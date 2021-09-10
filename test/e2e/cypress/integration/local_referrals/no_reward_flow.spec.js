describe( "Local Referrals - No Reward Flow", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const advocate_name = user_data.name
  const friend_name = user_data.name2
  const advocate_email = user_data.email
  const friend_email = user_data.email2
  const dashboard_username = base.createRandomUsername()

  before( () => {
    base.login( admin_panel, "ac" )
    local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
  } )

  it( "Part 1 - Should be able to set rewards to none and not see rewards tab in the dashboard", () => {
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.writeFile( "cypress/helpers/local_referrals/no_rewards.json", {
          merchant_id
        } )
        cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }/local-referrals` )
      } )
    // set advocate reward to none
    cy.contains( "Rewards" )
      .click()
    cy.contains( "Advocate Reward" )
      .parent( "div" )
      .within( () => {
        cy.get( "select" )
          .select( "None" )
      } )
    // set friend reward to none
    cy.contains( "Friend Reward" )
      .parent( "div" )
      .within( () => {
        cy.get( "select" )
          .select( "None" )
      } )
    cy.get( `div[heading="Rewards"]` )
      .contains( "button", "Save" )
      .click()
    // assertion: should see success toast for saving admin panel settings
    cy.contains( "Merchant LocalReferrals information has been successfully updated." )
      .should( "be.visible" )
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-referrals` )
    // assertions: should see "About" tab but not the "Rewards" tab
    cy.contains( "a", "About" )
      .should( "be.visible" )
    cy.contains( "a", "Rewards" )
      .should( "not.exist" )
    cy.readFile( "cypress/helpers/local_referrals/no_rewards.json" )
      .then( ( data ) => {
        data.rewards_disabled = true
        cy.writeFile( "cypress/helpers/local_referrals/no_rewards.json", data )
      } )
  } )


  it( "Part 2 - Should not see promo and reward for advocate and friend on dashboard", () => {
    base.loginDashboard( dashboard_username )
    cy.readFile( "cypress/helpers/local_referrals/no_rewards.json" )
      .then( ( data ) => {
        assert.isTrue( data.rewards_disabled, "Rewards should have been disabled" )
        cy.wrap( data.merchant_id )
          .as( "merchant_id" )
      } )
    // sign up advocate and friend
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            const merchant_slug = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
              .then( ( response ) => {
                local_referrals.signUpAsFriend( friend_name, friend_email, merchant_slug, response.body.referrer_token )
              } )
          } )
      } )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_referrals.getReferrals( merchant_id, friend_name )
          .then( ( response ) => {
            local_referrals.confirmReferral( merchant_id, response.body[ 0 ].id, Cypress.dayjs().format( "YYYY-MM-DD" ) )
            cy.visit( `${ dashboard.host }/admin/local-referrals/referrals/${ response.body[ 0 ].id }` )
          } )
      } )

    // assertions: should see Service Date field but not Reward and Promo fields
    cy.contains( "Service Date" )
      .should( "be.visible" )
    cy.contains( "Promo" )
      .should( "not.exist" )
    cy.contains( "Reward" )
      .should( "not.exist" )
  } )
} )
