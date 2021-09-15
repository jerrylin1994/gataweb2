describe( "LocalMessages - Schedule Message", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const sent_text = `text message ${ Math.floor( Math.random() * 100000000 ) }`
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-messages/unassigned` )
  } )

  it( "Should be able to send out a scheduled message and view message list", () => {
    // add 1 day and 5 minutes to current time
    const future_date_time = Cypress.dayjs()
      .add( 1, "day" )
      .add( 5, "minutes" )
    const formatted_future_date_time = future_date_time.format( "MM/DD/YYYY HH:mm" )
    const convo_formatted_future_date_time = future_date_time.format( "MMM DD, h:mm A" )
    const scheduled_msg_formatted_future_date_time = future_date_time.format( "MMM D, YYYY h:mm A" )
    const [ future_date, future_time ] = formatted_future_date_time.split( " " )

    // send out a scheduled message
    cy.contains( "New Message" )
      .click()
    cy.get( "#new-message-search-field_search" )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.get( ".ql-editor" )
      .type( sent_text )
    cy.contains( "schedule" )
      .click()
    cy.get( ".md-datepicker-input" )
      .clear()
      .type( future_date )
    cy.get( `input[name="time"]` )
      .type( future_time )
    cy.wait( 500 ) // in run mode the typing is too fast so modal does not have time to process the new date
    cy.contains( "button", "Set Schedule" )
      .click()
    cy.get( ".ol-new-message__form" )
      .contains( "Send" )
      .click()
    // assertion: should see success message for sending schduled message
    cy.contains( "Message scheduled" )
      .should( "be.visible" )
    // assertions: should see correct message details in the convo container
    cy.get( ".conversation-items" )
      .within( () => {
        cy.get( ".conversation-item-message-details" )
          .should( "include.text", "Cypress" )
          .and( "include.text", "Scheduled" )
          .and( "include.text", convo_formatted_future_date_time )
      } )

    // view scheduled message list
    cy.contains( "(See all)" )
      .click()
    // assertions: scheduled messsage list should have correct info
    cy.get( `tr[ng-repeat="message in messages"]` )
      .within( () => {
        cy.get( "td" )
          .then( ( table_data ) => {
            expect( table_data[ 0 ] ).to.have.text( scheduled_msg_formatted_future_date_time )
            expect( table_data[ 1 ] ).to.include.text( ( dashboard.accounts.twilio.to_phone_number ).substring( 8, 12 ) )
            expect( table_data[ 2 ] ).to.have.text( "Cypress(Manual)" )
            expect( table_data[ 3 ] ).to.include.text( sent_text )
          } )
      } )
  } )

  it( "Should be able to receive a scheduled message", function() {
    const future_date_time = Cypress.dayjs().utc()
      .add( 13, "seconds" )
    const formatted_utc_future_date_time = `${ future_date_time.format( "YYYY-MM-DDTHH:mm:ss" ) }.000Z`

    // scheduled a message 13 seconds from now
    local_messages.scheduleMessage( this.merchant_id, formatted_utc_future_date_time, sent_text )
    // assertion: should not receive message within the first 10ish seconds
    cy.task( "checkTwilioTextNotExist", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text
    } )
      .then( ( result ) => {
        assert.equal( result, "Error: Exceeded maximum wait time" )
      } )
    // assertion: should receive message within the next 15ish seconds
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text,
      wait_time: 15
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
  } )
} )
