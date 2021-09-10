describe( "LocalMessages - Opt-in Opt-out", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber(merchant_name)
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to opt-out and in via text", function() {
    const stop_text = "You have successfully been unsubscribed"
    const start_text = "You have successfully been resubscribed to messages from this number."

    // opt out
    local_contacts.createContact( this.merchant_id, user_data.name, "", dashboard.accounts.twilio.to_phone_number, false )
      .then( ( response ) => {
        // opt out by customer via text
        local_messages.sendTwilioMessage( "STOP", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
        const contact_id = response.body.refs.contact_ids[ 0 ]
        cy.wrap( contact_id )
          .as( "contact_id" )
      } )
    // assertion: should receive opt out text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text: stop_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
    cy.get("@contact_id")
      .then((contact_id)=>{
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
      })
    // contact details and activity log
    // assertion: should see opt out icon in contact details
    cy.get( `img[ol-tooltip-text="This email/number is opted-out from communications"]` )
      .should( "be.visible" )
    // assertion: should see correct opt out message in activity log
    cy.contains( `Phone number Opt-Out from individual messages by ${ user_data.name }: ${ dashboard.accounts.twilio.to_phone_number }` )
      .should( "be.visible" )

    // send text to opt out customer
    cy.visit( `${ dashboard.host }/admin/local-messages/you` )
    cy.contains( "New Message" )
      .click()
    cy.get( "#new-message-search-field_search" )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.get( ".ql-editor" )
      .type( "HELLO" )
    cy.contains( "button", "Send" )
      .click()
    // assertion: should see error message for sending text to opted out customer
    cy.contains( "Sorry this phone number has been Opted-out, you cannot send any messages." )
      .should( "be.visible" )

    // opt in
    local_messages.sendTwilioMessage( "START", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
    // assertion: should receive opt in text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text: start_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )

    // contact details and activity log
    cy.get( "@contact_id" )
      .then( ( contact_id ) => {
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
      } )
    // assertion: should see opt in correct message in activity log
    cy.contains( `Phone number Opt-In from individual messages by ${ user_data.name }: ${ dashboard.accounts.twilio.to_phone_number }` )
      .should( "be.visible" )
    // assertion: should not see opt out icon in contact details
    cy.get( `img[popover="This email/number is opted-out from communications"]` )
      .should( "not.exist" )
  } )

  it( "Should be able to opt-in and out via convo actions", function() {
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number2 )
      .then( ( response ) => {
        cy.wrap( response.body.customer_ids[ 0 ] )
          .as( "contact_id" )
        cy.wrap( response.body.conversation_id )
          .as( "convo_id" )
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
      } )

    // Opt out
    cy.get( "#more-button" )
      .click()
    cy.contains( "Opt-Out" )
      .click()
    cy.get( "@convo_id" )
      .then( ( convo_id ) => {
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ convo_id }` )
      } )
    // assertions: should see opt out messages in message convo
    cy.contains( "You opted-out this phone number" )
      .should( "be.visible" )
    cy.contains( "You closed this conversation" )
      .should( "be.visible" )
    // assertion: should opt out status in conversation details
    cy.get( "conversation-details" )
      .contains( "Opted Out" )
      .should( "be.visible" )
    // assertion: should see disabled overlay over the text editor
    cy.get( ".ol-conversation-composer__disabled-overlay" )
      .should( "be.visible" )

    // Opt-in
    cy.contains( "Opt-In" )
      .click()
    cy.contains( "You opted-in this phone number" )
      .should( "be.visible" )
    cy.get( "conversation-details" )
      .contains( "Opted In" )
      .should( "be.visible" )

    // activity log
    cy.get( "@contact_id" )
      .then( ( contact_id ) => {
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
      } )
    // assertion: should see correct opt-in message in activity log
    cy.contains( `Phone number Opt-In from individual messages by Cypress: ${ dashboard.accounts.twilio.to_phone_number2 }` )
      .should( "be.visible" )
    // assertion: should see correct opt-out message in activity log
    cy.contains( `Phone number Opt-Out from individual messages by Cypress: ${ dashboard.accounts.twilio.to_phone_number2 }` )
      .should( "be.visible" )
  } )
} )
