describe( "LocalVisits - Check-In Invite", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const visitor_name = user_data.name
  const today_date = Cypress.dayjs().format( "MMM DD, YYYY" )
  const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377475747" : "14377472898"
  const merchant_name = "Test Automation Send Invite Check-in"

  it( "Part 1 - Should be to send check-in invite", () => {
    const dashboard_username = base.createRandomUsername()
    cy.writeFile( "cypress/helpers/local_visits/invite_check_in.json", {} )
    base.login( admin_panel, "ac" )
    base.deleteMerchants(merchant_name)
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_visits.createCheckInMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, phone_number )
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )

    // send invite
    cy.contains( "Send Invite" )
      .click()
    // assertion: send check in modal should have correct title
    cy.get( ".modal-title" )
      .should( "have.text", "Send Check-in Invite" )
      .and( "be.visible" )
    cy.get( `input[type="tel"]` )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.get( "form" )
      .contains( "button", "Send Invite" )
      .click()
    cy.contains( "Invite sent" )
      .should( "be.visible" )
    // assertion: should receive check in invite text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      auth_token: dashboard.accounts.twilio.auth_token,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text: "Please begin your check-in"
    } )
      .then( ( response_text ) => {
        assert.isNotEmpty( response_text )
        cy.readFile( "cypress/helpers/local_visits/invite_check_in.json" )
          .then( ( data ) => {
            data.check_in_link = response_text.split( ": " )[ 1 ]
            data.dashboard_username = dashboard_username
            cy.writeFile( "cypress/helpers/local_visits/invite_check_in.json", data )
          } )
      } )
  } )

  it( "Part 2 - Should be able to register visitor from check-in form", () => {
    cy.readFile( "cypress/helpers/local_visits/invite_check_in.json" )
      .then( ( data ) => {
        assert.isDefined( data.check_in_link, "Check in link should have been sent via text" )
        if( Cypress.config( "baseUrl" ) == "https://test.onelocal.com" ) {
          cy.visit( `${ data.check_in_link.slice( 0, 8 ) }test.${ data.check_in_link.slice( 8 ) }` )
        } else {
          cy.visit( data.check_in_link )
        }
      } )
    // assertion: check-in registration page should have correct content
    cy.contains( `Welcome to ${ merchant_name }'s Check-in Registration` )
      .should( "be.visible" )
    cy.contains( "button", "Get Started" )
      .click()
    cy.contains( "What is your name?" )
      .siblings( "input" )
      .type( visitor_name )
    cy.contains( "Next" )
      .click()
    // assertions: should see thank you page after completing registration
    cy.contains( "Thank you!" )
      .should( "be.visible" )
    cy.contains( "Registration Completed" )
      .should( "be.visible" )
    cy.contains( "Please standby, we will send you a text message when we're available to see you." )
      .should( "be.visible" )
    cy.readFile( "cypress/helpers/local_visits/invite_check_in.json" )
      .then( ( data ) => {
        data.registration_completed = true
        cy.writeFile( "cypress/helpers/local_visits/invite_check_in.json", data )
      } )
  } )

  it( "Part 3 - Should be able to notify visitor and complete check-in", () => {
    cy.intercept( "GET", "**/visits**" )
      .as( "getVisits" )
    const notify_message = "Hey please come in"
    cy.readFile( "cypress/helpers/local_visits/invite_check_in.json" )
      .then( ( data ) => {
        assert.isTrue( data.registration_completed, "Registration should have been completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )

    // waiting tab
    // assertion: Waiting tab should have 1 entry
    cy.contains( "Waiting (1)" )
      .should( "be.visible" )
    cy.wait( "@getVisits" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    const waitingTableRowText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", waiting_time: "Waiting Time", status: "Status" }, 1 )[ 0 ]
    // assertion: Waiting table should have checked in visitor
    cy.wrap( null )
      .then( () => {
        assert.equal( waitingTableRowText.name, visitor_name )
        assert.include( waitingTableRowText.phone_number, dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
        assert.include( waitingTableRowText.status, "Checked in" )
      } )
    cy.contains( "Notify" )
      .click()
    cy.get( `textarea[name = "message"]` )
      .clear()
      .type( notify_message )
    cy.contains( "button", "Notify" )
      .click()
    cy.contains( "Visitor notified" )
      .should( "be.visible" )
    // assertion: should receive check in invite text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      auth_token: dashboard.accounts.twilio.auth_token,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text: notify_message
    } )
      .then( ( response_text ) => {
        assert.isNotEmpty( response_text )
      } )
    const updatedWaitingTableRowText = base.getTableRowsText( { status: "Status" }, 1 )[ 0 ]
    // assertion: visit status should be Notified
    cy.wrap( null )
      .then( () => {
        assert.include( updatedWaitingTableRowText.status, "Notified" )
      } )
    cy.contains( visitor_name )
      .click()
    // assertions: visitor information modal should have activity log for notified, checked in, and invited
    cy.get( ".modal-content" )
      .within( () => {
        cy.get( ".visits-visit-detail-modal__log-item" )
          .eq( 0 )
          .within( () => {
            cy.contains( "Notified" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
        cy.get( ".visits-visit-detail-modal__log-item" )
          .eq( 1 )
          .within( () => {
            cy.contains( "Checked in" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
        cy.get( ".visits-visit-detail-modal__log-item" )
          .eq( 2 )
          .within( () => {
            cy.contains( "Invited" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
        cy.contains( "Dismiss" )
          .click()
      } )
    cy.contains( "Start Visit" )
      .click()
    cy.contains( "Visit started" )
      .should( "be.visible" )
    // assertion: waiting tab should have 0 entries
    cy.contains( "Waiting (0)" )
      .should( "be.visible" )

    // in progress tab
    // assertion: In Progress tab should have 1 entry
    cy.contains( "In Progress (1)" )
      .should( "be.visible" )
      .click()
    cy.wait( "@getVisits" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: In Progress table should have correct number of headers
    base.assertTableHeaderCount( 5 )
    const inProgressTableRowText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", status: "Status" }, 1 )[ 0 ]
    // assertion: In Progress table should have checked in visitor
    cy.wrap( null )
      .then( () => {
        assert.equal( inProgressTableRowText.name, visitor_name )
        assert.include( inProgressTableRowText.phone_number, dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
        assert.include( inProgressTableRowText.status, "In progress" )
      } )
    cy.contains( "Complete Visit" )
      .click()
    // assertion: should see success toast for visits completed
    cy.contains( "Visit completed" )
      .should( "be.visible" )
    // assertion: In Progress tab should have 0 entries
    cy.contains( "In Progress (0)" )
      .should( "be.visible" )

    // completed tab
    cy.contains( "Completed" )
      .click()
    cy.wait( "@getVisits" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: Completed table should have correct number of headers
    base.assertTableHeaderCount( 5 )
    const completedTableRowText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", status: "Status" }, 1 )[ 0 ]
    // assertion: Completed table should have checked in visitor
    cy.wrap( null )
      .then( () => {
        assert.equal( completedTableRowText.name, visitor_name )
        assert.include( completedTableRowText.phone_number, dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
        assert.include( completedTableRowText.status, "Completed" )
      } )
  } )
} )
