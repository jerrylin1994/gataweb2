describe( "LocalReviews - Custom Request", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const custom_msg = `Custom review request${ Math.floor( Math.random() * 1000000000000000 ) }`
  const random_number = Math.floor( Math.random() * 100000000 )
  const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.addTwilioNumber( merchant_id, Cypress.env("TWILIO_NUMBER") )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
  } )

  it( "Should be able to customize phone review request when sending request", () => {
    cy.contains( "Request Feedback" )
      .click()
    cy.get( "input[name = \"name\"]" )
      .type( user_data.name )
    cy.get( "input[name = \"contact\"]" )
      .type( dashboard.accounts.twilio.to_phone_number )
    base.getDashboardSession()
      .then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
      } )
    cy.contains( "Customize Message" )
      .click()
    cy.get( "textarea" )
      .clear()
      .type( custom_msg )
    cy.contains( "md-select", "Insert Dynamic Tag" )
      .click()
    cy.contains( "STOP Text" )
      .click()
    cy.contains( "md-select", "Insert Dynamic Tag" )
      .click()
    cy.contains( "Survey Link" )
      .click()
    cy.contains( "Save Message" )
      .click()

    // assertion: success message for custom msg should be visible in modal
    cy.contains( "Custom SMS message saved and ready to send!" )
      .should( "be.visible" )
    cy.contains( "button", "Send" )
      .click()

    // assertion: message sent success message should be visible
    cy.contains( `A feedback request was sent to ${ dashboard.accounts.twilio.to_phone_number }` )
      .should( "be.visible" )
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env("TWILIO_NUMBER"),
      sent_text: custom_msg
    } )
      .then( ( text ) => {
        // assertion: should have received custom text message
        assert.isNotEmpty( text )
      } )
  } )

  it( "Should be able to customize email request when sending request", () => {
    base.createUserEmail()
    cy.contains( "Request Feedback" )
      .click()
    cy.get( "input[name = \"name\"]" )
      .type( user_data.name )
    cy.get( "@email_config" )
      .then( ( email_config ) => {
        cy.get( "input[name = \"contact\"]" )
          .type( email_config.imap.user )
      } )
    cy.contains( "button", "Customize Message" )
      .click()

    // customize message
    cy.get( ".ql-editor" )
      .type( custom_msg )

    // change call to action
    cy.get( "md-select[name=\"cta_type\"]" )
      .click()
    cy.contains( "Default (Start Survey)" )
      .click()
    cy.contains( "button", "Save Message" )
      .click()
    base.getDashboardSession()
      .then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
      } )

    // assertion: success message for custom msg should be visible in modal
    cy.contains( "Custom Email message saved and ready to send!" )
      .should( "be.visible" )
    cy.contains( "button", "Send" )
      .click()

    cy.get( "@email_config" )
      .then( ( email_config ) => {
        // assertion: should see success message for request sent
        cy.contains( `A feedback request was sent to ${ email_config.imap.user }` )
          .should( "be.visible" )
        cy.task( "getLastEmail", { email_config, email_query: `Thanks for choosing ${ merchant_name }` } )
          .then( ( html ) => {
            cy.visit( Cypress.config( "baseUrl" ) )
            cy.document( { log: false } ).invoke( { log: false }, "write", html )
          } )
      } )
    // assertion: review request email should have custom message
    cy.contains( custom_msg )
      .should( "be.visible" )
  } )

  it( "Should be able to customize default email request", function() {
    const email_subject = `Email subject${ random_number }`
    const email_title = `Email title${ random_number }`
    const email_body = `Email body${ random_number }`
    let email
    base.createUserEmail()
    cy.get( "@email_config" )
      .then( ( email_config ) => {
        email = `${ email_config.imap.user.slice( 0, email_config.imap.user.indexOf( "@" ) ) }+1${ email_config.imap.user.slice( email_config.imap.user.indexOf( "@" ) ) }`
      } )
    local_reviews.getSurveyTemplates( this.merchant_id )
      .then( ( response ) => {
        const survey_id = response.body[ 0 ].id
        cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }/design` )
      } )
    cy.contains( "a", "Email Request" )
      .click()

    // edit email content
    cy.get( "input[ng-model=\"survey_template.email.subject\"]" )
      .clear()
      .type( email_subject )
    cy.get( "input[ng-model=\"survey_template.email.title\"]" )
      .clear()
      .type( email_title )
    cy.get( ".ql-editor" )
      .clear()
      .type( email_body )
    cy.get( "md-select[name=\"cta_type\"]" )
      .click()

    // edit email call to action
    cy.contains( "Default (Start Survey)" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Template Updated" )
      .should( "be.visible" )

    // send email request
    local_reviews.getSurveyTemplates( this.merchant_id )
      .then( ( response ) => {
        const survey_id = response.body[ 0 ].id
        local_reviews.sendReviewRequest( this.merchant_id, survey_id, this.employee_id, email, user_data.name )
      } )

    cy.get( "@email_config" )
      .then( ( email_config ) => {
        // assertion: should receive email with edited subject
        cy.task( "getLastEmail", { email_config, email_query: email_subject } )
          .then( ( html ) => {
            cy.visit( Cypress.config( "baseUrl" ) )
            cy.document( { log: false } ).invoke( { log: false }, "write", html )
          } )
      } )
    // assertions: should see edited email body and subject
    cy.contains( email_body )
      .should( "be.visible" )
    cy.contains( email_title )
      .should( "be.visible" )
  } )

  it( "Should be able to customize default sms request", function() {
    const sms_text = `Please leave a review ${ random_number }`
    local_reviews.getSurveyTemplates( this.merchant_id )
      .then( ( response ) => {
        const survey_id = response.body[ 0 ].id
        cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }/design` )
      } )
    cy.contains( "a", "SMS Request" )
      .click()

    // edit sms content
    cy.get( "#sms_text" )
      .clear()
      .type( sms_text )
    cy.get( "md-select[ng-model=\"tag\"]" )
      .click()
    cy.contains( "Survey Link" )
      .click()
    cy.get( "md-select[ng-model=\"tag\"]" )
      .click()
    cy.contains( "STOP Text" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Template Updated" )
      .should( "be.visible" )

    // send sms request
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
    cy.contains( "Request Feedback" )
      .click()
    cy.get( "input[name = \"name\"]" )
      .type( user_data.name )
    cy.get( "input[name = \"contact\"]" )
      .type( dashboard.accounts.twilio.to_phone_number2 )
    base.getDashboardSession()
      .then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
      } )
    cy.contains( "button[type = \"submit\"]", "Send" )
      .click()
    cy.contains( `A feedback request was sent to ${ dashboard.accounts.twilio.to_phone_number2 }` )
      .should( "be.visible" )

    // assertions: Should receive sms text with custom content
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number2,
      from_phone_number: Cypress.env("TWILIO_NUMBER"),
      sent_text: sms_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
  } )
} )

