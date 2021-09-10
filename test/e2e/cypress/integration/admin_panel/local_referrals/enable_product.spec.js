describe( "Admin Panel - LocalReferrals", () => {
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../../support/base" )
  const user_data = require( "../../../fixtures/user_data" )
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  function assertActivateProductAlertExists() {
    cy.contains( "activate LocalReferrals" )
      .should( ( element ) => {
        expect( element ).to.be.visible
        expect( element ).to.have.attr( "href", "/admin/local-referrals/about" )
      } )
  }

  beforeEach( () => {
    base.login( admin_panel, "ac" )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to set LocalReferrals product status to live", () => {
      base.removeTwilioNumber( merchant_name )
      base.addMerchant( merchant_name, user_data.email )
        .then( ( response ) => {
          cy.visit( `${ admin_panel.host }/merchants/${ response.body.id }` )
          base.addTwilioNumber(response.body.id, Cypress.env("TWILIO_NUMBER"))
          cy.wrap( response.body.id ).as( "merchant_id" )
        } )

      // turn product status to live
      cy.contains( "a", "LocalReferrals" )
        .click()
      cy.url()
        .should( "include", "/local-referrals" )
      cy.contains( "General" )
        .click()
      cy.contains( "Status" )
        .children( "select" )
        .select( "Live" )
      cy.contains( "button", "Save" )
        .click()
      // assertion: should see success message for saving a live merchant
      cy.contains( "Merchant LocalReferrals information has been successfully updated." )
        .should( "be.visible" )
      cy.contains( "Status" )
        .should( "not.be.visible" )

      // add sms number to LocalReferrals
      cy.contains( "a", "SMS" )
        .click()
      cy.contains( "Text Message Invite Sent From" )
        .children( "select" )

      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
        } )

      // assertion: should see action button on the dashboard
      cy.visit( `${ dashboard.host }/admin/local-referrals/referrals` )
      cy.contains( "button", "Actions" )
        .should( "be.visible" )
    } )
  } )

  Cypress.testFilter( [], () => {
    it( "Should see activate product link for a disabled LocalReferrals merchant", () => {
      base.addMerchant( user_data.merchant_name, user_data.email )
        .then( ( response ) => {
          base.loginDashboardAsOnelocalAdmin( "ac", response.body.id )
        } )
      cy.visit( `${ dashboard.host }/admin` )
      cy.contains( "LocalReferrals" )
        .click()

      // assertions: should see acticate product link text on all pages
      cy.url()
        .should( "equal", `${ dashboard.host }/admin/local-referrals/about` )
      cy.get( `a[href="/admin/local-referrals/referrals"]` )
        .click()
      assertActivateProductAlertExists()
      cy.contains( "button", "Actions" )
        .should( "not.exist" )
      cy.get( `a[href="/admin/local-referrals/advocates"]` )
        .click()
      assertActivateProductAlertExists()
      cy.get( `a[href="/admin/local-referrals/analytics"]` )
        .click()
      assertActivateProductAlertExists()
    } )
  } )
} )
