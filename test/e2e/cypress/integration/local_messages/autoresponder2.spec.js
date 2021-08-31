describe( "LocalMessages - Autoresponder", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const responder_text = `Sorry we are not available right now ${ Math.floor( Math.random() * 100000000 ) }`
  // const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377476336" : "14377472898"
  // const merchant_name = "Test Automation Autoresponder"


  it( "Should be able to enable autoresponder and receive autoresponder text", () => {
    // cy.log(Cypress.env("BORK"))
    base.login(admin_panel, "ac")
    base.deleteMerchants("Test Automation 14377476397")
  } )
} )
