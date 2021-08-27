describe("dassad",()=>{
  const base = require( "../../support/base" )
const user_data = require( "../../fixtures/user_data" )
const local_reviews = require( "../../support/local_reviews" )
const admin_panel = Cypress.env( "admin" )
const dashboard = Cypress.env( "dashboard" )
const dashboard_username = base.createRandomUsername()
const merchant_name = base.createMerchantName()


  it("test",()=>{
      base.login( admin_panel, "ac" )
      // base.addTwilioNumber("6127c4f3cd6ce568e56d2351", "+14377476234")
      base.removeTwilioNumber("6127c4f3cd6ce568e56d2351")
  })
})
