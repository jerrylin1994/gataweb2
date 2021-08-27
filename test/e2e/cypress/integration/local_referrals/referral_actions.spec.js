describe( "Local Referrals - Referral Actions", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const advocate_name = user_data.name
  const friend_name = user_data.name2

  beforeEach( function() {
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    // base.deleteMerchantAndTwilioAccount()
    // base.deleteMerchants()
    base.deleteIntercomUsers()
    local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    base.createUserEmail()
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            const merchant_slug = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, user_data.email, merchant_slug )
              .then( ( response ) => {
                local_referrals.signUpAsFriend( friend_name, this.email_config.imap.user, merchant_slug, response.body.referrer_token )
              } )
          } )
      } )
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-referrals/referrals` )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to confirm a referral with 0 days processing period", () => {
    // confirm reward
      cy.contains( "button", "Confirm" )
        .click()
      cy.get( "form" )
        .within( () => {
          cy.get( ".modal-title" )
            .should( "have.text", "Confirm Referral" )
            .and( "be.visible" )
          // assertions: confirm referral modal should have correct content
          cy.contains( "Friend Name" )
            .should( "be.visible" )
            .siblings( "input" )
            .should( "have.value", friend_name )
          cy.contains( "Promo For Friend" )
            .should( "be.visible" )
            .siblings( "input" )
            .should( "have.value", friend_reward_name )
          cy.contains( "Advocate Name" )
            .should( "be.visible" )
            .siblings( "input" )
            .should( "have.value", advocate_name )
          cy.get( ".processing-period-input" )
            .clear()
            .type( "0" )
          cy.contains( "button", "Confirm" )
            .click()
        } )

      // assertion: should see success message for confirming a referral
      cy.contains( "Referral Confirmed" )
        .should( "be.visible" )
      cy.get( "@email_config" )
        .then( ( email_config ) => {
          // assertion: should see success message for confirming a referral
          cy.task( "getLastEmail", { email_config, email_query: `${ friend_name }, earn rewards by referring your friends` } )
        } )
    } )
  } )

  Cypress.testFilter( [ ], () => {
    it( "Should be able to confirm a referral with service date in the future and see a pending reward", () => {
      const service_date = Cypress.dayjs().add( 10, "day" )
        .format( "MM/D/YYYY" )
      cy.intercept( "GET", "**/rewards**" )
        .as( "getRewards" )
      // confirm referral
      cy.contains( "button", "Confirm" )
        .click()
      cy.get( ".md-datepicker-input" )
        .clear()
        .type( service_date )
      cy.wait( 500 ) // added to allow modal to process the new typed in date
      cy.get( "form" )
        .contains( "button", "Confirm" )
        .click()
      cy.contains( "a", "Rewards" )
        .click()
      cy.wait( "@getRewards" )
      cy.contains( "Loading…" )
        .should( "not.be.visible" )
      const tableRowsText = base.getTableRowsText( { status: "Status" }, 1 )[ 0 ]
      // assertion: Reward should be in pending state
      cy.wrap( null )
        .then( () => {
          assert.equal( tableRowsText.status, "Pending" )
        } )
    } )

    it( "Should be able to cancel a referral", () => {
      cy.contains( "button", "Cancel" )
        .click()
      // assertion: modal title should be correct
      cy.get( ".modal-title" )
        .should( "have.text", "Cancel Referral" )
        .and( "be.visible" )

      // pick cancel reason
      cy.get( `md-select[name="cancel_reason"]` )
        .click()
      cy.wait( 500 ) // added to reduce flake of clicking on a dropdown option
      cy.contains( "Other" )
        .click()
      cy.wait( 500 ) // added to due to cypress typing too quick
      cy.get( `input[name="cancel_reason_detail"]` )
        .type( "Did not want to join" )

      // add notes to the cancellation
      cy.contains( "+ Add Notes" )
        .click()
      cy.get( `textarea[name="notes"]` )
        .type( "notes" )
      cy.get( "form" )
        .contains( "button", "Confirm" )
        .click()

      // assertion: referral cancelled toast message should be visible
      cy.contains( "Referral Cancelled" )
        .should( "be.visible" )
      // assertions: should see no active referrals in the referral table
      cy.contains( "No Active Referrals" )
        .should( "be.visible" )
      cy.get( ".ol-filter-dropdown-value" )
        .click()
      cy.contains( "All" )
        .click()
      // assertion: should see cancelled referral in the referral table
      cy.get( "table" )
        .contains( "Cancelled" )
        .should( "be.visible" )
    } )

    it( "Should be able to reschedule a referral", () => {
      const schedule_date = Cypress.dayjs( ).add( 5, "day" )
      const reschedule_date = schedule_date.add( 5, "day" )

      // confirm referral with service date in the future
      cy.contains( "button", "Confirm" )
        .click()
      cy.get( ".md-datepicker-input" )
        .clear()
        .type( schedule_date.format( "MM/DD/YYYY" ) )
      cy.get( "form" )
        .contains( "button", "Confirm" )
        .click()

      // reschedule referral
      cy.contains( "button", "Reschedule" )
        .click()
      // assertion: modal title should be correct
      cy.get( ".modal-title" )
        .should( "have.text", "Reschedule Referral" )
        .and( "exist" )
      cy.contains( "New Service Date" )
        .siblings( "md-datepicker" )
        .find( ".md-datepicker-input" )
        .clear()
        .type( reschedule_date.format( "MM/D/YYYY" ) )
      cy.wait( 500 ) // added due to typing date is too fast
      cy.get( "form" )
        .contains( "button", "Confirm" )
        .click()

      // assertion: should see success message for rescheduled referral
      cy.contains( "Referral Rescheduled" )
        .should( "be.visible" )
      // assertion: service date should be the new scheduled date
      cy.get( "table" )
        .contains( reschedule_date.format( "MMM D, YYYY" ) )
        .should( "be.visible" )
    } )
  } )
} )
