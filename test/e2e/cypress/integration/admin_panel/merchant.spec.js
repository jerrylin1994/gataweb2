describe( "Admin Panel - Merchants", () => {
  const base = require( "../../support/base" )
  const admin_panel = Cypress.env( "admin" )
  const user_data = require( "../../fixtures/user_data" )

  beforeEach( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchants()
    // base.deleteMerchantAndTwilioAccount()
    cy.visit( admin_panel.host )
  } )

  if( Cypress.config( "baseUrl" ) == "https://stage.onelocal.com" ) {
    Cypress.testFilter( [], () => {
      it( "Should be able to remove a merchant", () => {
        base.addMerchant( user_data.merchant_name, user_data.email )
          .then( ( response ) => {
            cy.visit( `${ admin_panel.host }/merchants/${ response.body.id }` )
          } )
        cy.get( "input[value = \"Remove\"]" )
          .click()
        cy.contains( "Yes" )
          .click()
        cy.contains( "Merchant has been successfully removed." )
          .should( "be.visible" )
      } )
    } )
  }

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to add a merchant", () => {
      cy.contains( "Add Merchant" )
        .click()
      cy.get( "input[name = \"name\"]" )
        .type( user_data.merchant_name )
      cy.get( "input[name = \"email\"]" )
        .type( "jerry.l@example.com" )
      cy.get( "button[type = \"submit\"]" )
        .click()
      cy.contains( `Merchant: ${ user_data.merchant_name } has been successfully added.` )
        .should( "be.visible" )
    } )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to open merchant from dashboard", () => {
      base.addMerchant( user_data.merchant_name, user_data.email )
        .then( ( response ) => {
          cy.wrap( response.body.id )
            .as( "merchant_id" )
          cy.visit( `${ admin_panel.host }/merchants/${ response.body.id }`, {
            onBeforeLoad( win ) {
              cy.stub( win, "open" )
            }
          } )
        } )
      cy.contains( "Open Merchant" )
        .click()
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          cy.window().its( "open" )
            .should( "be.calledWith", `/open_merchant?merchant_id=${ merchant_id }` )
          cy.visit( `${ Cypress.env( "admin" ).host }/open_merchant?merchant_id=${ merchant_id }` )
        } )
      // asserion: should see welcome message on dashboard
      cy.contains( "Welcome To Your OneLocal Dashboard" )
        .should( "be.visible" )
    } )
  } )
} )
