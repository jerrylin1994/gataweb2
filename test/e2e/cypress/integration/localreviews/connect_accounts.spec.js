describe( "LocalReviews - Connected Accounts", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const dashboard = Cypress.env( "dashboard" )
  const admin_panel = Cypress.env( "admin" )
  const user_data = require( "../../fixtures/user_data" )
  const yelp_id = "https://www.yelp.ca/biz/wendys-daly-city"
  const yellow_pages_id = "https://www.yellowpages.ca/bus/Ontario/Toronto/Bardi-s-Steak-House/156059.html"
  const facebook_url = "https://www.facebook.com/1916995865260491"

  context( "Connect accounts test cases", () => {
    function assertConnectedAccountRecentReview( merchant_id ) {
      cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
      local_reviews.getFirstReview( merchant_id )
        .then( ( review ) => {
          const { comment } = review
          const reviewer =  review.created.hasOwnProperty("by") ?  review.created.by.display_name : "Anonymous" 
          cy.get( ".recent-reviews" )
            .within( () => {
              if( comment.length > 300 ) {
                cy.contains( comment.substring( 0, 300 ) )
                  .should( "be.visible" )
              } else {
                cy.contains( comment )
                  .should( "be.visible" )
              }
              cy.contains( reviewer )
                .should( "be.visible" )
            } )
        } )
    }

    function assertConnectedAccountViewPageHref( account_id ) {
      cy.contains( "View Page" )
        .invoke( "attr", "href" )
        .should( "equal", account_id )
    }

    beforeEach( () => {
      // const merchant_name = base.createMerchantName()
      const dashboard_username = base.createRandomUsername()
      base.login( admin_panel, "ac" )
      // base.deleteMerchantAndTwilioAccount()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews` )
    } )

    it( "Should be able to connect a YellowPages account", function() {
    // connect yp account in localreview settings
      cy.contains( "Connected Accounts" )
        .click()
      cy.get( ".reviewedge-connect-account-admin" )
        .contains( "Connect" )
        .click()
      cy.get( "input[name=\"location_id\"]" )
        .type( yellow_pages_id )
      cy.get( "md-select[name=\"type\"]" )
        .click()
      cy.wait( 500 )
      cy.contains( "Yellow Pages" )
        .click()
      cy.contains( "Confirm" )
        .click()

      // assertion: should see success message
      cy.contains( "Added connected account" )
        .should( "be.visible" )

      // assertion: yp view page button href should be correct
      assertConnectedAccountViewPageHref( yellow_pages_id )

      // assertion: yp review and reviewer should be shown in recent reviews
      assertConnectedAccountRecentReview( this.merchant_id )
    } )

    it( "Should be able to connect a Yelp account", function() {
    // connect yelp account in localreview settings
      cy.contains( "Connected Accounts" )
        .click()
      cy.get( ".reviewedge-connect-account-admin" )
        .contains( "Connect" )
        .click()
      cy.get( "input[name=\"location_id\"]" )
        .type( yelp_id )
      cy.get( "md-select[name=\"type\"]" )
        .click()
      cy.wait( 500 )
      cy.contains( "Yelp" )
        .click()
      cy.contains( "Confirm" )
        .click()

      // assertion: should see success message
      cy.contains( "Added connected account" )
        .should( "be.visible" )

      // assertion: yelp view page button href should be correct
      assertConnectedAccountViewPageHref( yelp_id )

      // assertion: yelp review and reviewer should be shown in recent reviews
      assertConnectedAccountRecentReview( this.merchant_id )
    } )

    it( "Should be able to connect Facebook account as an admin", function() {
    // connect fb account in LocalReviews settings
      cy.contains( "Connected Accounts" )
        .click()
      cy.contains( "Connect with FB Manager" )
        .click()
      cy.get( "#_search" )
        .type( "Krisp Klean" )
      cy.contains( "md-radio-button", "Krisp Klean" )
        .click()
      cy.contains( "button", "Confirm" )
        .click()

      // assertion: should see success message
      cy.contains( "Account Connected!" )
        .should( "be.visible" )

      // assertion: facebook view page button href should be correct
      assertConnectedAccountViewPageHref( facebook_url )

      // assertion: facebook review and reviewer should be shown in recent reviews
      assertConnectedAccountRecentReview( this.merchant_id )
    } )
  } )

  context( "Disconnect account test cases", () => {
    before( () => {
      // const merchant_name = base.createMerchantName()
      const dashboard_username = base.createRandomUsername()
      base.login( admin_panel, "ac" )
      // base.deleteMerchantAndTwilioAccount()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    } )

    beforeEach( function() {
      base.loginDashboardAsOnelocalAdmin( "ac", this.merchant_id )
    } )

    it( "Should be able to disconnect a Yelp account", function() {
      local_reviews.addConnectedAccounts( "yelp", yelp_id, this.merchant_id )
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/accounts` )
      cy.contains( "Yelp" )
        .parents( ".reviewedge-connected-account" )
        .within( () => {
          cy.contains( "Edit Account" )
            .click()
        } )
      cy.contains( "button", "Disconnect" )
        .click()
      cy.contains( "button", "Yes" )
        .click()

      // assertion: should be able to see success message and not see Yelp account
      cy.contains( "Account Disconnected" )
        .should( "be.visible" )
      cy.contains( "Yelp" )
        .should( "not.exist" )
    } )

    it( "Should be able to disconnect a YellowPages account", function() {
      local_reviews.addConnectedAccounts( "yellow_pages", yellow_pages_id, this.merchant_id )
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/accounts` )
      cy.contains( "YellowPages" )
        .parents( ".reviewedge-connected-account" )
        .within( () => {
          cy.contains( "Edit Account" )
            .click()
        } )
      cy.contains( "button", "Disconnect" )
        .click()
      cy.contains( "button", "Yes" )
        .click()

      // assertion: should be able to see success message and not see YP account
      cy.contains( "Account Disconnected" )
        .should( "be.visible" )
      cy.contains( "YellowPages" )
        .should( "not.exist" )
    } )
  } )
} )
