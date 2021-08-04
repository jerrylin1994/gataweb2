describe( "LocalReviews - Employee App", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const merchant_name = base.createMerchantName()
  const dashboard_username = base.createRandomUsername()
  const user_data = require( "../../fixtures/user_data" )

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to open employee app dashboard", () => {
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
    cy.contains( "Cypress" )
      .click()
    cy.contains( "Launch Employee Dashboard" )
      .click()

    // assertion: url should be correct
    cy.url()
      .should( "equal", `${ dashboard.host }/employee` )

    // assertion: should see onelocal header image
    cy.get( ".onelocal-header-img" )
      .should( "be.visible" )
  } )

  it( "Should be able to send 2 sms review request", () => {
    const sent_text = `Hi ${ user_data.name }, Thanks for choosing ${ merchant_name }`
    cy.visit( `${ dashboard.host }/employee` )

    // request sms review
    cy.contains( "Request Feedback by SMS" )
      .click()
    base.getDashboardSession().then( ( response ) => {
      if( ! ( "has_agreed_review_edge_tou" in response.body ) ) {
        cy.get( ".md-container" )
          .click()
        cy.contains( "Continue" )
          .click()
      }
    } )
    cy.get( "#name" )
      .type( user_data.name )
    cy.wait( 500 ) // help with flake where the email sometimes would be filled into the #name element
    cy.get( "#contact" )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.contains( "Continue" )
      .click()
    cy.contains( `${ user_data.name } (${ dashboard.accounts.twilio.to_phone_number })` )
      .should( "be.visible" )
    cy.contains( "Send Request" )
      .click()

    // assertion: should see succuss
    cy.contains( "Success!" )
      .should( "be.visible" )

    // assertion: should receive review
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: dashboard.accounts.twilio.phone_number,
      sent_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )

    // send another sms request
    cy.contains( "Send Another" )
      .click()
    cy.get( "#name" )
      .type( user_data.name )
    cy.wait( 500 ) // help with flake where the email sometimes would be filled into the #name element
    cy.get( "#contact" )
      .type( dashboard.accounts.twilio.to_phone_number2 )
    cy.contains( "Continue" )
      .click()
    cy.contains( "Send Request" )
      .click()

    // assertion: should see succuss
    cy.contains( "Success!" )
      .should( "be.visible" )

    // assertion: should receive review
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number2,
      from_phone_number: dashboard.accounts.twilio.phone_number,
      sent_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
  } )

  it( "Should be able to send email review request", () => {
    const email_query = `Thanks for choosing ${ merchant_name } from: noreply@quick-feedback.co`
    cy.visit( `${ dashboard.host }/employee` )

    // request email review
    cy.contains( "Request Feedback by Email" )
      .click()
    base.getDashboardSession().then( ( response ) => {
      if( ! ( "has_agreed_review_edge_tou" in response.body ) ) {
        cy.get( ".md-container" )
          .click()
        cy.contains( "Continue" )
          .click()
      }
    } )
    cy.get( "#name" )
      .type( user_data.name )
    cy.wait( 500 ) // help with flake where the email sometimes would be filled into the #name element
    cy.get( "#contact" )
      .type( user_data.email )
    cy.contains( "Continue" )
      .click()
    cy.contains( `${ user_data.name } (${ user_data.email })` )
      .should( "be.visible" )
    cy.contains( "Send Request" )
      .click()

    // assertion: should see succuss
    cy.contains( "Success!" )
      .should( "be.visible" )

    // assertion: should receive email request
    cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
      .then( ( email ) => {
        assert.isNotEmpty( email )
      } )
  } )
} )
