Cypress.testFilter( [ "@smoke" ], () => {
    describe( "LocalReviews - Email Reviews", () => {
      const base = require( "../../support/base" )
      const user_data = require( "../../fixtures/user_data" )
      const local_reviews = require( "../../support/local_reviews" )
      const admin_panel = Cypress.env( "admin" )
      const dashboard = Cypress.env( "dashboard" )
      const review_message = "Great review yay!"
  
      it.only( "Should be able to send email review request", function() {
       cy.wait(6000)
       cy.log("yoooo")
      } )
  

    } )
  } )
  