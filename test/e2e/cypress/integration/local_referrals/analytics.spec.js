describe( "Local Referrals - Analytics", () => {
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
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  function getRewards( merchant_id ) {
    return cy.request( {
      method: "GET",
      url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/rewards`,
      headers: {
        accept: "application/json"
      }
    } )
  }
  function redeemReward( merchant_id, reward_id ) {
    cy.request( {
      method: "POST",
      url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/rewards/${ reward_id }/redeem`,
      headers: {
        accept: "application/json"
      }
    } )
  }

  before( () => {
    base.login( admin_panel, "ac" )
    local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            const merchant_slug = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
              .then( ( response ) => {
                local_referrals.signUpAsFriend( friend_name, friend_email, merchant_slug, response.body.referrer_token )
              } )
          } )
      } )
    base.loginDashboard( dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_referrals.getReferrals( merchant_id, friend_name )
          .then( ( response ) => {
            local_referrals.confirmReferral( merchant_id, response.body[ 0 ].id, Cypress.dayjs().format( "YYYY-MM-DD" ) )
          } )
        getRewards( merchant_id )
          .then( ( response ) => {
            redeemReward( merchant_id, response.body[ 0 ].id )
          } )
      } )
    cy.visit( `${ dashboard.host }/admin/local-referrals` )
  } )

  it( "Should see correct stats in analytics tab", () => {
    cy.contains( "a", "Analytics" )
      .click()
    // assertion: Referrals number should be correct
    cy.get( `ol-stats-card[header-text="Referrals"]` )
      .contains( "span", "1" )
      .should( "be.visible" )
    // assertion: Friends who purchased number should be correct
    cy.get( `ol-stats-card[header-text="Friends Who Purchased"]` )
      .contains( "span", "1" )
      .should( "be.visible" )
    // assertion: conversion rate should be correct
    cy.get( `ol-stats-card[header-text="Conversion %"]` )
      .contains( "span", "100 %" )
      .should( "be.visible" )
    // assertion: most active advocate table content should be correct
    cy.get( `ol-stats-card[header-text="Most Active Advocates"]` )
      .within( () => {
        base.assertTableHeaderCount( 2 )
        const tableRowText = base.getTableRowsText( { name: "Name", referrals: "# of Referrals" }, 1 )[ 0 ]
        cy.wrap( null )
          .then( () => {
            assert.equal( tableRowText.name, advocate_name )
            assert.equal( tableRowText.referrals, "1" )
          } )
      } )
  } )
} )
