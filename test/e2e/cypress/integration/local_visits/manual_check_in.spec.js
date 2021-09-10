describe( "LocalVisits - Manual Check-In", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const visitor_name = user_data.name
  const today_date = Cypress.dayjs().format( "MMM DD, YYYY" )
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_visits.createCheckInMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )
  } )

  it( "Should be able to manually check in a customer with phone number and complete visit", () => {
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )
    cy.intercept( "GET", "**/visits**" )
      .as( "getVisits" )
    cy.contains( "Manual Check In" )
      .click()

    // waiting tab
    // assertion: check-in registration modal should have correct title
    cy.get( ".modal-title" )
      .should( "have.text", "Check-in Registration" )
      .and( "be.visible" )
    cy.get( `input[ng-model="model.phone_number"]` )
      .type( dashboard.accounts.twilio.to_phone_number )
    cy.get( `input[ng-model="model.answers[ field.id ]"]` )
      .type( visitor_name )
    cy.contains( "button", /^Check In$/ )
      .click()
    // assertion: should see success toast for customer check in
    cy.contains( "Customer checked-in" )
      .should( "be.visible" )
    cy.contains( "close" )
      .click()
    // assertion: Waiting tab should have 1 entry
    cy.contains( "Waiting (1)" )
      .should( "be.visible" )
    // assertion: Waiting table should have correct number of headers
    base.assertTableHeaderCount( 6 )
    const waitingTableRowText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", waiting_time: "Waiting Time", status: "Status" }, 1 )[ 0 ]
    // assertion: Waiting table should have checked in visitor
    cy.wrap( null )
      .then( () => {
        assert.equal( waitingTableRowText.name, visitor_name )
        assert.include( waitingTableRowText.phone_number, dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
        assert.include( waitingTableRowText.waiting_time, "a few seconds ago" )
        assert.include( waitingTableRowText.status, "Checked in" )
      } )
    cy.contains( visitor_name )
      .click()
    // assertions: visitor information modal should have correct info and buttons
    cy.get( ".modal-content" )
      .within( () => {
        cy.get( ".modal-title" )
          .should( "have.text", "Visitor Information" )
          .and( "be.visible" )
        cy.get( ".visits-visit-detail-modal__log-item" )
          .within( () => {
            cy.contains( "Checked in" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
        cy.contains( "button", "Dismiss" )
          .should( "be.visible" )
        cy.contains( "button", "Cancel Visit" )
          .should( "be.visible" )
        cy.contains( "button", "Notify" )
          .should( "be.visible" )
        cy.contains( "button", "Dismiss" )
          .should( "be.visible" )
          .click()
      } )
    cy.contains( "Notify" )
      .click()
    // assertion: notify modal should have correct info and buttons
    cy.get( ".modal-content" )
      .within( () => {
        cy.get( ".modal-title" )
          .should( "have.text", "Confirmation" )
          .and( "be.visible" )
        cy.contains( "button", "Notify" )
          .should( "be.visible" )
        cy.contains( "button", "Start Visit" )
          .click()
      } )
    // assertion: should see success toast for visit started
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
    cy.contains( visitor_name )
      .click()
    // assertion: visitor information modal should have correct info and buttons
    cy.get( ".modal-content" )
      .within( () => {
        cy.get( ".visits-visit-detail-modal__log-item" )
          .eq( 0 )
          .within( () => {
            cy.contains( "In progress" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
        cy.contains( "button", "Dismiss" )
          .should( "be.visible" )
        cy.contains( "button", "Cancel Visit" )
          .should( "be.visible" )
        cy.contains( "button", "Complete Visit" )
          .should( "be.visible" )
          .click()
      } )
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
    cy.contains( visitor_name )
      .click()
    // assertion: Visitor information activity log should include completed log
    cy.get( ".modal-content" )
      .within( () => {
        cy.get( ".visits-visit-detail-modal__log-item" )
          .eq( 0 )
          .within( () => {
            cy.contains( "Completed" )
              .should( "be.visible" )
            cy.contains( today_date )
              .should( "be.visible" )
          } )
      } )
  } )

  it( "Should be able to manually check in a customer without a phone number", () => {
    cy.contains( "Manual Check In" )
      .click()
    cy.contains( "button", /^Check In$/ )
      .click()
    // assertion: should see success toast for customer check in
    cy.contains( "Customer checked-in" )
      .should( "be.visible" )
    const waitingTableRowText = base.getTableRowsText( { name: "Name", phone_number: "Phone Number", waiting_time: "Waiting Time", status: "Status" }, 1 )[ 0 ]
    // assertion: Waiting table should have checked in visitor with no name and phone number
    cy.wrap( null )
      .then( () => {
        assert.equal( waitingTableRowText.name, "-" )
        assert.include( waitingTableRowText.phone_number, "-" )
        assert.include( waitingTableRowText.status, "Checked in" )
      } )
    // assertion: visitor cta should be Start Visit
    cy.contains( "Start Visit" )
      .should( "be.visible" )
  } )
} )
