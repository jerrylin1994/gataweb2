describe( "LocalReviews - Connected Accounts", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const dashboard = Cypress.env( "dashboard" )
  const admin_panel = Cypress.env( "admin" )
  const user_data = require( "../../fixtures/user_data" )

  it( "dsdsa", () => {
    base.createUserEmail()

    cy.task( "getLastEmail", { email_config: response, email_query: "Thanks for choosing" } )
      .then( ( response ) => {
        cy.log( response )
      } )
  } )
} )
