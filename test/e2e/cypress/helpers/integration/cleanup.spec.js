const base = require( "../../support/base" )
describe("Cleanup",()=>{
  it ("Cleanup",()=>{
    base.deleteIntercomUsers()
    base.deleteTwilioAccounts()
    base.login()
    // base.deleteMerchants()
   })
})

