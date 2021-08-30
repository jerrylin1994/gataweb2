describe( "LocalReviews - Connected Accounts", () => {
    const base = require( "../../support/base" )
    const local_reviews = require( "../../support/local_reviews" )
    const dashboard = Cypress.env( "dashboard" )
    const admin_panel = Cypress.env( "admin" )
    const user_data = require( "../../fixtures/user_data" )
  
    // beforeEach( () => {
    //   const merchant_name = base.createMerchantName()
    //   const dashboard_username = base.createRandomUsername()
    //   base.login( admin_panel, "ac" )
    //   base.deleteMerchantAndTwilioAccount()
    //   local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    //   cy.get( "@merchant_id" )
    //     .then( ( merchant_id ) => {
    //       // local_messages.addLocalMessagesTwilioNumber( merchant_id )
    //       // local_reviews.addPhoneNumber(merchant_id)
    //     } )
    // } )
  
    it( "DSdssda", () => {
      cy.task("getNodeIndex")
        .then((index)=>{
            cy.log(index)
        })
      cy.wait(3000)
    } )
  } )
  