describe( "LocalMessages - Send message warnings and errors", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`
  
  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should see warning when sending a duplicate text", function() {
    // send first text
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )
      .then( ( response ) => {
        cy.wrap( response.body.text )
          .as( "sent_text" )
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
      } )

    // send duplicate text
    cy.get( `form[name="$ctrl.form.message"]` )
      .within( () => {
        cy.get( ".ql-editor" )
          .type( this.sent_text )
        cy.get( `button[type="submit"]` )
          .click()
      } )

    // assertion: should see error alert for duplicate message
    cy.contains( "The same message was already sent to this number directly before this. Please check your message history." )
      .should( "be.visible" )
    // assertion: should only see one message in conversation
    cy.get( "@sent_text" )
      .then( ( sent_text ) => {
        cy.contains( sent_text )
          .then( ( conversation_item ) => {
            expect( conversation_item.length.toString(), "should only see 1 sent text in conversation" ).to.equal( "1" )
          } )
      } )
  } )

  it( "Should see sms error when messaging a number that is an unknown or inactive destination number", { retries: { runMode: 1 } }, () => {
    // flakey due to https://github.com/gatalabs/gata/issues/9224
    cy.visit( `${ dashboard.host }/admin/local-messages/unassigned` )

    // send message to a inactive number
    cy.contains( "New Message" )
      .click()
    cy.get( "#new-message-search-field_search" )
      .type( "(855) 426-2669" )
    cy.get( "#message-form" )
      .find( ".ql-editor" )
      .type( `text message ${ Math.floor( Math.random() * 100000000 ) }` )
    cy.get( ".ol-new-message__form" )
      .contains( "button", "Send" )
      .click()
    // assertion: should see error message in convo for unknown destination
    cy.contains( "Failed to send(Unreachable destination handset)" )
      .should( "be.visible" )
  } )
} )
