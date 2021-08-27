describe( "LocalMessages - LocalContacts Integration", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const sent_text = `text message ${ Math.floor( Math.random() * 100000000 ) }`
  const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377476204" : "14377472898"
  const merchant_name = "Test Automation LM/LC Integration"

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchants(merchant_name)
    base.deleteTwilioAccounts(merchant_name)
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, phone_number )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_contacts.createContact( merchant_id, user_data.name, "", dashboard.accounts.twilio.to_phone_number, false )
          .then( ( response ) => {
            cy.wrap( response.body.refs.contact_ids[ 0 ] )
              .as( "customer_id" )
          } )
        local_contacts.createContact( merchant_id, user_data.name2, "", dashboard.accounts.twilio.to_phone_number2, false )
          .then( ( response ) => {
            cy.wrap( response.body.refs.contact_ids[ 0 ] )
              .as( "customer_id2" )
          } )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
  } )

  it( "Should be able to send a bulk messages from LocalContacts dashboard and view bulk message list", () => {
    cy.intercept( "GET", "**/recipients**" )
      .as( "getBulkMsgRecipients" )
    // select 2 contacts from contact table and send a message
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name }"]` )
      .click()
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name2 }"]` )
      .click()
    cy.contains( "Send Message" )
      .click()
    cy.get( ".ql-editor" )
      .type( sent_text )
    cy.get( ".ol-checkbox-button" )
      .click()
    cy.get( ".ol-new-message__form" )
      .contains( "Send" )
      .click()
    cy.get( ".ol-new-message__summary-value" )
      .should( "have.text", "2" )
    // assertion: should see success message
    cy.contains( "Bulk message is sending" )
      .should( "be.visible" )
    cy.contains( "a", "View" )
      .invoke( "attr", "href" )
      .as( "bulk_msg_details_link" )
    // assertions: should receive the sent bulk message
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number2,
      from_phone_number: phone_number,
      sent_text
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
    // reply to a bulk message
    const reply_text = "Hello!!!!!!!"
    local_messages.sendTwilioMessage( reply_text, dashboard.accounts.twilio.to_phone_number, phone_number )
    cy.wait( 1000 ) // added to give time for dashboard to update with the reply

    // view bulk message list
    cy.get( "@bulk_msg_details_link" )
      .then( ( bulk_msg_details_link ) => {
        cy.visit( `${ dashboard.host }${ bulk_msg_details_link }` )
      } )
    // wait until bulk message list page is loaded
    cy.wait( "@getBulkMsgRecipients" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    cy.contains( "Filter By" )
      .should( "not.exist" )

    // assertion: bulk message table should have correct number of column headers
    base.assertTableHeaderCount( 4 )

    const tableRowsText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", status: "Status", responses: "Responses" }, 2 )

    // assertions: should be able to see correct data for bulk messages
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].name, user_data.name )
        assert.include( tableRowsText[ 0 ].phone_number, dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
        assert.include( tableRowsText[ 0 ].status, "Sent" )
        assert.include( tableRowsText[ 0 ].responses, reply_text )
        assert.equal( tableRowsText[ 1 ].name, user_data.name2 )
        assert.include( tableRowsText[ 1 ].phone_number, dashboard.accounts.twilio.to_phone_number2.substring( 8, 12 ) )
        assert.include( tableRowsText[ 1 ].status, "Sent" )
        assert.equal( tableRowsText[ 1 ].responses, "-" )
      } )
    // assertion: should only see 7 bulk message info containers
    cy.get( ".ol-bulk-messages-detail__info" )
      .then( ( elements ) => {
        assert.equal( elements.length, 7 )
      } )
    // assertion: should see correct stats in bulk message containers
    cy.get( ".ol-bulk-messages-detail__infos" )
      .within( () => {
        cy.get( ".ol-bulk-messages-detail__info-value" )
          .then( ( detail_value ) => {
            expect( detail_value[ 0 ] ).to.have.text( "Completed" )
            expect( detail_value[ 1 ] ).to.have.text( "2 Sent" )
            expect( detail_value[ 2 ] ).to.have.text( "1 (50%)" )
            expect( detail_value[ 5 ] ).to.have.text( "Cypress" )
            expect( detail_value[ 6 ] ).to.have.text( sent_text )
          } )
      } )
  } )
} )
