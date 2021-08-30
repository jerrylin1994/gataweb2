describe( "LocalMessages - Autoresponder", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const responder_text = `Sorry we are not available right now ${ Math.floor( Math.random() * 100000000 ) }`
  const phone_number = Cypress.config( "baseUrl" ).includes( "stage" ) ? "14377476336" : "14377472898"
  const merchant_name = "Test Automation Autoresponder"

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchants( merchant_name )
    // base.deleteTwilioAccounts(merchant_name)
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, phone_number )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/settings` )
  } )

  it( "Should be able to enable autoresponder and receive autoresponder text", () => {
    // enable autoresponder from LocalMessage Settings
    cy.get( `a[href="/admin/settings/local-messages"]` )
      .click()
    cy.contains( "Autoresponder" )
      .click()
    cy.get( "md-select" )
      .click()
    cy.wait( 500 ) // added to reduce flake of clicking on a dropdown option
    cy.contains( "On" )
      .click()
    cy.wait( 500 ) // added to help issue where sometimes cypress types only half the string in the textarea element
    cy.get( "textarea" )
      .type( responder_text )
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Changes saved." )
      .should( "be.visible" )

    // send text to merchant
    local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, phone_number )

    // assertion: should receive autoresponder text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text: responder_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
  } )
} )
