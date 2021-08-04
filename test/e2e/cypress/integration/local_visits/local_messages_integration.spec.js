describe( "LocalVisits - LocalMessage Integration", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  let merchant_id

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_visits.createCheckInMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( created_merchant_id ) => {
        merchant_id = created_merchant_id
        local_messages.enableLocalMessages( merchant_id )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should receive check-in invite from keyword trigger", () => {
    local_messages.sendTwilioMessage( "Here", dashboard.accounts.twilio.to_phone_number, dashboard.accounts.twilio.phone_number )
    // visitor should be sent the check-in link
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      auth_token: dashboard.accounts.twilio.auth_token,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: dashboard.accounts.twilio.phone_number,
      sent_text: "Please begin your check-in process"
    } ).then( ( check_in_text ) => {
      assert.include( check_in_text, "mycheckin.co" )
    } )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )
    // assertion: should see visitor who triggered the keyword check-in
    cy.contains( dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
      .should( "be.visible" )
  } )

  it( "LocalMessages conversation should be in correct closed/open LocalMessages column", () => {
    cy.intercept( "GET", "**/conversations/*/messages**" )
      .as( "getConversations" )
    local_messages.sendTwilioMessage( "How are you doing", dashboard.accounts.twilio.to_phone_number2, dashboard.accounts.twilio.phone_number )
    local_messages.sendTwilioMessage( "Here", dashboard.accounts.twilio.to_phone_number2, dashboard.accounts.twilio.phone_number )
    local_messages.sendTwilioMessage( "Here", dashboard.accounts.twilio.to_phone_number, dashboard.accounts.twilio.phone_number )
    cy.visit( `${ dashboard.host }/admin/local-messages/all` )
    cy.wait( "@getConversations" )
    // assertions: should see visitor who had a previous convo in the open tab
    cy.contains( "Open (1)" )
      .should( "be.visible" )
      .click()
    cy.contains( dashboard.accounts.twilio.to_phone_number2.substring( 8, 12 ) )
      .should( "be.visible" )
      // assertions: should see visitor who didn't have a previous convo in the open tab
    cy.contains( "Closed (1)" )
      .should( "be.visible" )
      .click()
    cy.contains( dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
      .should( "be.visible" )
  } )

  it( "Should be able to view check-in information from LocalMessages", () => {
    cy.intercept( "GET", "**/conversations/*/messages**" )
      .as( "getConversations" )
    // send check-in invite and complete check-in form
    local_visits.sendCheckInInvite( merchant_id, dashboard.accounts.twilio.to_phone_number )
      .then( ( check_in_invite_response ) => {
        base.getMerchantSettings( merchant_id )
          .then( ( merchant_settings_response ) => {
            local_visits.completeCheckInForm( check_in_invite_response.body.auth_token, merchant_settings_response.body.visits.visits.check_in.fields[ 0 ].id, check_in_invite_response.body.id, user_data.name )
          } )
      } )
    cy.visit( `${ dashboard.host }/admin/local-messages/all` )
    cy.wait( "@getConversations" )
    cy.contains( "Closed" )
      .click()
    cy.contains( dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
      .click()
      // assertions: should see view check-in cta and be able to view check-in details
    cy.contains( "View Check-In" )
      .should( "be.visible" )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Visitor Information" )
      .and( "be.visible" )
  } )
} )
