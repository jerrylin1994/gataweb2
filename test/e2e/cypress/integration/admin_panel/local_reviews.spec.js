describe( "Admin Panel - LocalReviews", () => {
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const place_id = "ChIJ6S8ZgMo0K4gRZ0mxD-wPS-0"
  const site_url = "https://google.com"
  const user_data = require( "../../fixtures/user_data" )

  function assertActivateProductAlertExists() {
    cy.contains( "activate LocalReviews" )
      .should( ( element ) => {
        expect( element ).to.be.visible
        expect( element ).to.have.attr( "href", "/admin/local-reviews/about" )
      } )
  }

  context( "Product status test cases", () => {
    beforeEach( () => {
      base.login( admin_panel, "ac" )
      // base.deleteMerchants()
      // base.deleteMerchantAndTwilioAccount()
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to set LocalReviews product status to live", () => {
        base.addMerchant( user_data.merchant_name, user_data.email )
          .then( ( response ) => {
            cy.visit( `${ admin_panel.host }/merchants/${ response.body.id }` )
            // local_messages.addLocalMessagesTwilioNumber( response.body.id )
            cy.wrap( response.body.id ).as( "merchant_id" )
          } )
        // turn product status to live
        cy.contains( "a", "LocalReviews" )
          .click()
        cy.contains( "Product Status" )
          .children( "select" )
          .select( "Live" )
        cy.contains( "Place ID" )
          .children( "input" )
          .type( place_id )
        cy.contains( "Site Url" )
          .children( "input" )
          .type( site_url )
        cy.contains( "button", "Save" )
          .click()

        // assertion: should see success message for saving a live merchant
        cy.contains( "Merchant LocalReviews information has been successfully updated." )
          .should( "be.visible" )

        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
          } )

        // assertion: should see request feedback button on the dashboard
        cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
        cy.contains( "button", "Request Feedback" )
          .should( "be.visible" )
      } )
    } )

    Cypress.testFilter( [], () => {
      it( "Should see dashboard placeholders for not enabled LocalReviews merchant", () => {
        base.addMerchant( user_data.merchant_name, user_data.email )
          .then( ( response ) => {
            base.loginDashboardAsOnelocalAdmin( "ac", response.body.id )
          } )
        cy.visit( `${ dashboard.host }/admin/` )
        cy.contains( "LocalReviews" )
          .click()

        // assertions: should see product placeholders and not see reviews and referrals tables
        cy.url()
          .should( "equal", `${ dashboard.host }/admin/local-reviews/about` )
        cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
        cy.get( ".ol-stats-card-empty-box" )
          .should( "be.visible" )
        cy.get( ".recent-reviews-item-empty" )
          .should( "be.visible" )
        cy.contains( "button", "Request Feedback" )
          .should( "not.exist" )
        assertActivateProductAlertExists()
        cy.visit( `${ dashboard.host }/admin/local-reviews/reviews` )
        assertActivateProductAlertExists()
        cy.get( ".reviews-table-container" )
          .should( "not.exist" )
        cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )
        cy.get( "tbody[ol-table-empty=\"ol-table-empty\"]" )
          .should( "be.visible" )
        assertActivateProductAlertExists()
        cy.visit( `${ dashboard.host }/admin/local-reviews/requests` )
        assertActivateProductAlertExists()
        cy.get( ".ol-table-responsive-container" )
          .should( "not.exist" )
        cy.visit( `${ dashboard.host }/admin/local-reviews/analytics` )
        assertActivateProductAlertExists()
      } )
    } )
  } )

  Cypress.testFilter( [], () => {
    context( "Powered by Onelocal footer test cases", () => {
      it( "Part 1 - Should be able to toggle off Powered by Onelocal footer and not see it in email requests", function() {
        cy.writeFile( "cypress/helpers/admin_panel/local-reviews.json", {} )
        const dashboard_username = base.createRandomUsername()
        const email_query = `Thanks for choosing ${ user_data.merchant_name }`
        base.createUserEmail()
        base.login( admin_panel, "ac" )
        // base.deleteMerchants()
        // base.deleteMerchantAndTwilioAccount()
        local_reviews.createLocalReviewsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )

        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
          // hide onelocal footer
            cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }/local-reviews` )
            cy.contains( "Hide OneLocal branding in emails + surveys" )
              .click()
            cy.contains( "button", "Save" )
              .click()

            // assertion: should see success message for saving a onelocal footer setting
            cy.contains( "Merchant LocalReviews information has been successfully updated." )
              .should( "be.visible" )

            // send survey request
            local_reviews.getSurveyTemplates( merchant_id )
              .then( ( response ) => {
                const survey_id = response.body[ 0 ].id
                local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, this.email_config.imap.user, user_data.name )
              } )
          } )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.task( "getLastEmail", { email_config, email_query } )
              .then( ( html ) => {
                cy.visit( Cypress.config( "baseUrl" ) )
                cy.document( { log: false } ).invoke( { log: false }, "write", html )
              } )
          } )
        cy.get( `img[alt="Star"]` )
          .eq( 4 )
          .parent()
          .invoke( "attr", "href" )
          .then( ( href ) => {
            cy.readFile( "cypress/helpers/admin_panel/local-reviews.json" )
              .then( ( data ) => {
                data.survey_request_found = true
                data.survey_link = href
                cy.writeFile( "cypress/helpers/admin_panel/local-reviews.json", data )
              } )
          } )
      } )

      it( "Part 2 - Should not see Powered by Onelocal footer in survey", () => {
        cy.readFile( "cypress/helpers/admin_panel/local-reviews.json" )
          .then( ( data ) => {
            assert.isTrue( data.survey_request_found, "Survey request should have been found" )
            cy.visit( data.survey_link )
          } )

        // assertion: onelocal footer should not be found
        cy.get( ".powered-by-onelocal" )
          .should( "not.exist" )
      } )
    } )
  } )
} )
