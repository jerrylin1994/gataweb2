describe( "LocalVisits - Flags", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const visitor_name = user_data.name
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  function createFlag( rule_value ) {
    cy.contains( "Add Rule" )
      .click()
    cy.get( `[aria-label = "Question"]` )
      .click()
    cy.contains( "What is your name?" )
      .click()
    cy.get( `[aria-label = "Condition"]` )
      .click()
    cy.contains( "Contains" )
      .click()
    cy.wait( 300 ) // added as cypress types the name too fast which causes the name to not be completely typed
    cy.findByLabelText( "Value" )
      .type( rule_value )
    cy.contains( "button", "Save" )
      .click()
  }

  beforeEach( () => {
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_visits.createCheckInMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to create a flag and flag a visitor", () => {
    cy.visit( `${ dashboard.host }/admin/settings` )
    cy.get( `a[href="/admin/settings/local-visits"]` )
      .click()
    cy.contains( "Check-in" )
      .click()
    cy.contains( "Forms" )
      .click()
    cy.contains( "Flags" )
      .click()
    createFlag( visitor_name )
    // assertion: should see success toast for adding a flag
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        // send check-in invite and complete check-in form
        local_visits.sendCheckInInvite( merchant_id, dashboard.accounts.twilio.to_phone_number )
          .then( ( check_in_invite_response ) => {
            base.getMerchantSettings( merchant_id )
              .then( ( merchant_settings_response ) => {
                local_visits.completeCheckInForm( check_in_invite_response.body.auth_token, merchant_settings_response.body.visits.visits.check_in.fields[ 0 ].id, check_in_invite_response.body.id, visitor_name )
              } )
          } )
      } )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )
    // assertion: should see flag icon in visitor table
    cy.get( ".visits-dashboard__table-row" )
      .find( ".visits-dashboard__flag-icon" )
      .should( "be.visible" )
    cy.contains( visitor_name )
      .click()
    // assertions: should see flag icon and flag message in visitor information modal
    cy.get( ".modal-content" )
      .within( () => {
        cy.contains( "This check-in has been flagged" )
          .should( "be.visible" )
        cy.get( ".visits-visit-detail-modal__field-flag-icon" )
          .should( "be.visible" )
        cy.contains( "button", "Dismiss" )
          .click()
      } )
    cy.contains( "Notify" )
      .click()
    // assertions: should see flag message in confirmation modal and be able to view details of a flagged visitor
    cy.get( "form" )
      .within( () => {
        cy.contains( "This check-in has been flagged" )
          .should( "be.visible" )
        cy.contains( "View Details" )
          .click()
      } )
    cy.get( ".modal-title" )
      .should( "have.text", "Visitor Information" )
      .and( "be.visible" )
  } )

  it( "Should be able to edit and delete a flag", () => {
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/check-in/forms/flags` )
    createFlag( visitor_name )
    // edit a flag
    cy.get( `[aria-label = "Condition: Contains"]` )
      .click()
    cy.contains( "Does not Contain" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    // assertion: should see success toast for saving an edit
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    // delete a flag
    cy.get( ".check-in-form-flags__rule-item-actions" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    // assertion: should see success toast for deleting a flag
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    // assertion: should not see flag in dashboard
    cy.contains( "Rule 1" )
      .should( "not.exist" )
  } )
} )
