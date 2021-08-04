describe( "Local Referrals - Sharing Link Referral Flow", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )

  it( "Part 1 - Should see sharing link on LocalReferrals About page", () => {
    cy.writeFile( "cypress/helpers/local_referrals/sharing_link.json", { } )
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    base.loginDashboard( dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.writeFile( "cypress/helpers/local_referrals/sharing_link.json", {
          dashboard_username,
          merchant_id
        } )
      } )

    // get referral sharing link
    cy.visit( `${ dashboard.host }/admin/local-referrals/about` )
    cy.contains( "Your LocalReferrals Link" )
      .children( "a" )
      .invoke( "text" )
      .then( ( sharing_link ) => {
        // assertion: should see sharing link on about page
        assert.isNotEmpty( sharing_link )
        cy.readFile( "cypress/helpers/local_referrals/sharing_link.json" )
          .then( ( data ) => {
            data.sharing_link = sharing_link
            cy.writeFile( "cypress/helpers/local_referrals/sharing_link.json", data )
          } )
      } )
  } )

  it( "Part 2 - Should be able to sign up as an advocate via sharing link and send a friend invite", () => {
    cy.readFile( "cypress/helpers/local_referrals/sharing_link.json" )
      .then( ( data ) => {
        assert.isDefined( data.sharing_link, "Sharing link should be found" )
        cy.visit( data.sharing_link )
      } )
    const advocate_name = user_data.name
    const advocate_email = user_data.email
    const friend_name = user_data.name2
    const friend_email = user_data.email2

    // sign up as advocate
    cy.get( "#name" )
      .type( advocate_name )
    cy.get( "#email" )
      .type( advocate_email )
    cy.contains( "button", "Submit" )
      .click()
    cy.readFile( "cypress/helpers/local_referrals/sharing_link.json" )
      .then( ( data ) => {
        base.loginDashboard( data.dashboard_username )
        // assertion: advocate should be registered
        local_referrals.getAdvocateRegistered( data.merchant_id, advocate_name )
          .then( ( response ) => assert.isNotEmpty( response.body ) )
      } )

    // invite friend
    cy.get( `input[placeholder="Friend's Name"]` )
      .type( friend_name )
    cy.get( `input[placeholder="Friend's Email"]` )
      .type( friend_email )
    cy.contains( "button", "Submit" )
      .click()

    // assertion: should receive friend referral email
    cy.task( "checkEmail", { query: `${ advocate_name } Thought You Would Be Interested In Our Services! from: noreply@my-referral.co`, email_account: "email2" } )
      .then( ( email ) => {
        assert.isNotEmpty( email )
      } )
    cy.readFile( "cypress/helpers/local_referrals/sharing_link.json" )
      .then( ( data ) => {
      // assertion: referral status should be Incoming
        local_referrals.getReferrals( data.merchant_id, friend_name )
          .then( ( response ) => assert.equal( ( response.body[ 0 ].state.label ), "Incoming" ) )
      } )
  } )
} )
