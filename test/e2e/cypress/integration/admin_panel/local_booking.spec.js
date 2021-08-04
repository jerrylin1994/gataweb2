describe( "Admin Panel - LocalBooking", () => {
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const user_data = require( "../../fixtures/user_data" )

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    base.addMerchant( user_data.merchant_name, user_data.email )
      .then( ( response ) => {
        const merchant_id = response.body.id
        cy.wrap( merchant_id ).as( "merchant_id" )
        local_messages.enableLocalMessages( merchant_id, dashboard.accounts.twilio.phone_number )
        cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }` )
      } )
  } )

  beforeEach( () => {
    base.login( admin_panel, "ac" )
  } )

  it( "Should be able to enable LocalBooking", function() {
    cy.contains( "a", "LocalVisits" )
      .click()
    cy.contains( "Status" )
      .children( "select" )
      .select( "Live" )
    cy.get( `div[heading="Booking"]` )
      .contains( "Enabled" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Visits settings updated" )
      .should( "be.visible" )
    base.loginDashboardAsOnelocalAdmin( "ac", this.merchant_id )
    cy.visit( `${ dashboard.host }` )
    cy.contains( "LocalVisits" )
      .click()
    // assertion: should see create booking button LocalVisits page
    cy.contains( "button", "Create" )
      .should( "be.visible" )
  } )
} )
