describe( "LocalReferrals - Referral Table For Different Qualifications", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const advocate_name = user_data.name
  const advocate_email = user_data.email
  const friend_name = user_data.name2
  const friend_email = user_data.email2
  const friend_2_name = "Joe"
  const friend_2_email = "test@example.com"

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_referrals.createLocalReferralsMerchantAndDashboardUser( base.createMerchantName(), user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            const merchant_slug = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
              .then( ( response ) => {
                // friend1 status will be Qualified
                local_referrals.signUpAsFriend( friend_name, friend_email, merchant_slug, response.body.referrer_token )

                // friend2 status will be Sent
                cy.request( {
                  method: "POST",
                  url: `${ Cypress.env( "dashboard" ).referral_sharing_link }/merchants/${ merchant_slug }/advocate/${ response.body.referrer_token }/referral`,
                  headers: {
                    accept: "application/json"
                  },
                  qs: {
                    is_invite: true
                  },
                  body: {
                    email: friend_2_email,
                    name: friend_2_name
                  }
                } )
              } )
          } )
      } )
  } )

  it( "Should see referrals of all statuses for qualification all but only Qualified referrals for qualification friend", function() {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-referrals/referrals` )
    // assertions: should see referrals of status Sent and Qualified
    cy.contains( friend_name )
      .should( "be.visible" )
    cy.contains( friend_2_name )
      .should( "be.visible" )
    local_referrals.setQualificationToFriend( this.merchant_id )
    cy.reload()
    // assertions: should only see qualified referral but not the status Sent referral
    cy.contains( friend_name )
      .should( "be.visible" )
    cy.contains( friend_2_name )
      .should( "not.exist" )
  } )
} )
