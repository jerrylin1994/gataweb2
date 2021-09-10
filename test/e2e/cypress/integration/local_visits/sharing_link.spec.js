describe( "LocalVisits - Sharing Link", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const visitor_name = user_data.name
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  it( "Part 1 - Should see sharing link in dashboard", () => {
    const dashboard_username = base.createRandomUsername()
    cy.writeFile( "cypress/helpers/local_visits/sharing_link.json", {} )
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_visits.createCheckInMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/check-in/forms` )
    cy.contains( "Distribute" )
      .click()
    // assertion: should see sharing link on distribute tab
    cy.contains( `${ dashboard.check_in_link }` )
      .invoke( "attr", "href" )
      .then( ( href ) => {
        assert.include( href, `${ dashboard.check_in_link }/share/test-automation` )
        cy.readFile( "cypress/helpers/local_visits/sharing_link.json" )
          .then( ( data ) => {
            data.sharing_link = href
            data.dashboard_username = dashboard_username
            cy.writeFile( "cypress/helpers/local_visits/sharing_link.json", data )
          } )
      } )
  } )

  it( "Part 2 - Should be able complete check-in form without phone verification", () => {
    cy.readFile( "cypress/helpers/local_visits/sharing_link.json" )
      .then( ( data ) => {
        assert.isDefined( data.sharing_link, "Should have found sharing link on dashboard" )
        cy.visit( data.sharing_link )
      } )
    cy.contains( "button", "Get Started" )
      .click()
    cy.contains( "Enter your mobile number" )
      .siblings( "input" )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.contains( "Next" )
      .click()
    cy.get( "svg" )
      .should( "not.exist" )
    cy.contains( "What is your name?" )
      .siblings( "input" )
      .type( visitor_name )
    cy.contains( "Next" )
      .click()
    // assertions: should see thank you page after completing registration
    cy.contains( "Thank you!" )
      .should( "be.visible" )
  } )

  it( "Part 3 - Should be able to enable phone verification", () => {
    cy.readFile( "cypress/helpers/local_visits/sharing_link.json" )
      .then( ( data ) => {
        assert.isDefined( data.sharing_link, "Should have found sharing link on dashboard" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/check-in/forms/distribute` )
    cy.contains( "Enable Phone Verification" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    // assertion: should see success toast for enabling phone verification
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    cy.readFile( "cypress/helpers/local_visits/sharing_link.json" )
      .then( ( data ) => {
        data.phone_verification_enabled = true
        cy.writeFile( "cypress/helpers/local_visits/sharing_link.json", data )
      } )
  } )

  it( "Part 4 - Should be able to complete check-in form with phone verification", () => {
    cy.readFile( "cypress/helpers/local_visits/sharing_link.json" )
      .then( ( data ) => {
        assert.isTrue( data.phone_verification_enabled, "Should have been able to enable phone verification" )
        cy.visit( data.sharing_link )
      } )
    cy.contains( "button", "Get Started" )
      .click()
    cy.contains( "Enter your mobile number" )
      .siblings( "input" )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.contains( "Next" )
      .click()
    // assertion: should receive test with verification code
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      auth_token: dashboard.accounts.twilio.auth_token,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text: "Your verification code is:"
    } )
      .then( ( response_text ) => {
        assert.isNotEmpty( response_text )
        const verification_code = response_text.split( ": " )[ 1 ]
        cy.log( verification_code )
        for( const i in [ 0, 1, 2, 3 ] ) {
          cy.get( `input[data-id="${ i }"]` )
            .type( verification_code.charAt( i ) )
        }
      } )
    cy.get( "svg" )
      .should( "not.exist" )
    cy.contains( "What is your name?" )
      .siblings( "input" )
      .type( visitor_name )
    cy.contains( "Next" )
      .click()
    // assertion: should see thank you page after completing registration
    cy.contains( "Thank you!" )
      .should( "be.visible" )
  } )
} )
