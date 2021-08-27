describe( "Local Referrals - Rewards", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const advocate_name = user_data.name
  const friend_name = user_data.name2
  const advocate_email = user_data.email
  const friend_email = user_data.email2
  let dashboard_username = ""

  function testSetup() {
    cy.intercept( "GET", "**/referral_magic/rewards**" )
      .as( "getRewards" )
    dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.deleteMerchants() 
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
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
      } )
    cy.visit( `${ dashboard.host }/admin/local-referrals/rewards` )
    cy.wait( "@getRewards" )
    cy.contains( "Loading…" )
      .should( "not.be.visible" )
  }

  Cypress.testFilter( [ "@smoke" ], () => {
    context( "Redeem reward test cases", () => {
      before( () => {
        testSetup()
      } )

      it( "Part 1 - Should be able to redeem an reward and have the advocates table and rewards table update", function() {
        cy.writeFile( "cypress/helpers/local_referrals/rewards.json", { } )
        // assertions: reward table should have correct number of table headers and content
        base.assertTableHeaderCount( 6 )
        const rewardTableRowText = base.getTableRowsText( { date: "Date", status: "Status", reward_code: "Reward Code", advocate: "Advocate", advocate_reward: "Reward For Advocate" }, 1 )[ 0 ]
        cy.wrap( null )
          .then( () => {
            assert.equal( rewardTableRowText.date, Cypress.dayjs().format( "MMM D, YYYY" ) )
            assert.equal( rewardTableRowText.status, "Granted" )
            assert.include( rewardTableRowText.advocate, advocate_name )
            assert.equal( rewardTableRowText.advocate_reward, advocate_reward_name )
          } )
        // redeem reward
        cy.contains( "button", "Redeem" )
          .click()
        cy.get( "form" )
          .within( () => {
          // assertions: redeem reward modal should have correct content
            cy.contains( "Redeem Advocate Reward" )
              .should( "be.visible" )
            cy.contains( "Advocate Name" )
              .should( "be.visible" )
              .siblings( "input" )
              .should( "have.value", advocate_name )
            cy.contains( "label", "Reward" )
              .should( "be.visible" )
              .siblings( "input" )
              .should( "have.value", advocate_reward_name )
            cy.contains( "button", "Confirm" )
              .click()
          } )
        // assertion: should see success message for redeeming a reward
        cy.contains( "Reward Redeemed" )
          .should( "be.visible" )
        cy.readFile( "cypress/helpers/local_referrals/rewards.json" )
          .then( ( data ) => {
            data.merchant_id = this.merchant_id
            data.reward_redeemed = true
            cy.writeFile( "cypress/helpers/local_referrals/rewards.json", data )
          } )
      } )

      it( "Part 2 - Should see updated advocates table, rewards table, activity log, and referral should be completed", () => {
        cy.readFile( "cypress/helpers/local_referrals/rewards.json" )
          .then( ( data ) => {
            assert.isTrue( data.reward_redeemed, "Reward should have been redeemed" )
          } )
        base.loginDashboard( dashboard_username )
        cy.intercept( "GET", "**/referral_magic/rewards**" )
          .as( "getRewards" )
        cy.intercept( "GET", "**/referral_magic/advocates**" )
          .as( "getAdvocates" )
        cy.intercept( "GET", "**/referral_magic/referrals/**" )
          .as( "getReferrals" )
        cy.intercept( "GET", "**/actions**" )
          .as( "getContactActions" )
        const activity_date = Cypress.dayjs().format( "ddd MMM DD" )

        // view rewards table
        cy.visit( `${ dashboard.host }/admin/local-referrals/rewards` )
        cy.wait( "@getRewards" )
        cy.contains( "Loading…" )
          .should( "not.be.visible" )
        const rewardTableRowTextUpdated = base.getTableRowsText( { status: "Status" }, 1 )[ 0 ]
        // assertion: reward status should be "Redeemed" after redeeming reward
        cy.wrap( null )
          .then( () => {
            assert.equal( rewardTableRowTextUpdated.status, "Redeemed" )
          } )

        // view advocate table
        cy.contains( "a", "Advocates" )
          .click()
        cy.wait( "@getAdvocates" )
        cy.contains( "Loading…" )
          .should( "not.exist" )
        const advocateTableRowText = base.getTableRowsText( { friends_purchased: "# Of Friends Who Purchased", rewards_earned: "# Of Rewards Earned" }, 1 )[ 0 ]
        // assertions: # of friends who purchased and # of rewards earned should be 1 after redeeming reward
        cy.wrap( null )
          .then( () => {
            assert.equal( advocateTableRowText.friends_purchased, "1" )
            assert.equal( advocateTableRowText.rewards_earned, "1" )
          } )

        // view advocate activity log
        cy.contains( "a", "Bob" )
          .click()
        cy.wait( "@getContactActions" )

        // referral reward redeemed log
          // assertions: should see correct messages in log
            cy.contains( `Referral Reward Redeemed: $100.00 Off Next Order` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )

        // referral referral completed log
          // assertions: should see correct messages in log
            cy.contains( `Referral Completed` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
            cy.contains( "a", "View Referral" )
              .click()
        cy.wait( "@getReferrals" )

        // completed referral details page
        // assertions: referral details page should have friend and advocate details
        cy.contains( "Friend Details" )
          .parent( "section" )
          .within( () => {
            cy.contains( "a", friend_name )
              .should( "be.visible" )
            cy.contains( "Friend Email" )
              .siblings( "input" )
              .should( "have.value", friend_email )
            cy.contains( /^Promo$/ )
              .siblings( "input" )
              .should( "have.value", friend_reward_name )
          } )
        cy.contains( "Advocate Details" )
          .parent( "section" )
          .within( () => {
            cy.contains( "a", advocate_name )
              .should( "be.visible" )
            cy.contains( "Advocate Email" )
              .siblings( "input" )
              .should( "have.value", advocate_email )
            cy.contains( /^Reward$/ )
              .siblings( "input" )
              .should( "have.value", advocate_reward_name )
          } )
      } )
    } )
  } )

  context( "Cancel reward test cases", () => {
    before( () => {
      testSetup()
    } )

    Cypress.testFilter( [ ], () => {
      it( "Should be able to cancel a reward", () => {
      // cancel reward
        cy.contains( "button", "Cancel" )
          .click()
        cy.get( "form" )
          .within( () => {
            cy.contains( "Cancel Reward" )
              .should( "be.visible" )
            cy.get( `md-select[name="cancel_reason"]` )
              .click()
          } )
        cy.contains( "Friend not interested in service" )
          .click()
        cy.contains( "button", "Confirm" )
          .click()
        cy.contains( "Reward Cancelled" )
          .should( "be.visible" )
        const tableRowsText = base.getTableRowsText( { status: "Status" }, 1 )[ 0 ]
        // assertions: reward status should be "Cancelled" and reason should be correct
        cy.wrap( null )
          .then( () => {
            assert.include( tableRowsText.status, "Cancelled" )
            assert.include( tableRowsText.status, "Friend not interested in service" )
          } )
      } )
    } )
  } )
} )
