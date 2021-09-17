describe( "LocalReviews - Survey Link", () => {
  const base = require( "../../support/base" )
  const user_data = require( "../../fixtures/user_data" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const review_message = "Great review yay!"

  it( "Should be able to see sharing link for survey", function() {
    const dashboard_username = base.createRandomUsername()
    const merchant_name = base.createMerchantName()

    // before
    base.login( admin_panel, "ac" )
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )

    // beforeEach
    base.loginDashboard( dashboard_username )

    // create survey
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_reviews.createSurveyFromOnlineTemplate( merchant_id )
          .then( ( response ) => {
            const survey_id = response.body.id
            cy.wrap( survey_id ).as( "survey_id" )
            cy.visit( `${ dashboard.host }/admin/local-reviews/surveys/${ survey_id }/distribute` )
          } )
      } )

    cy.get( "a[ng-click=\"openSurveyUrl()\"]" )
      .invoke( "text" )
      .then( ( survey_link ) => {
        // assertion: survey link should exist
        assert.isNotEmpty( survey_link, "Survey link should exist" )
        cy.writeFile( "cypress/helpers/local_reviews/survey-link.json", {
          survey_id: this.survey_id,
          survey_link,
          survey_link_exists: true,
          dashboard_username
        } )
      } )
  } )

  it( "Should be able to complete a sharing link survey", () => {
    cy.readFile( "cypress/helpers/local_reviews/survey-link.json" )
      .then( ( data ) => {
        assert.isTrue( data.survey_link_exists, "Survey link should have been found" )
        cy.visit( data.survey_link )
        cy.get( "#name" )
          .type( user_data.name )
        cy.get( "#mobile" )
          .type( user_data.phone_number )
        cy.contains( "Start" )
          .click()

        // fill out survey
        cy.contains( "Get started" )
          .click()
        cy.contains( "Use Google to leave us a review?" )
          .should( "be.visible" )
        cy.contains( "No" )
          .click()
        cy.contains( "Use Facebook to leave us a review?" )
          .should( "be.visible" )
        cy.contains( "No" )
          .click()
        cy.get( ".survey-textarea-field" )
          .type( review_message )
        cy.contains( "Next" )
          .click()

        // assertion: should see survey exit page
        cy.contains( "Thanks for choosing us!" )
          .should( "be.visible" )
        cy.readFile( "cypress/helpers/local_reviews/survey-link.json" )
          .then( ( data ) => {
            data.review_completed = true
            cy.writeFile( "cypress/helpers/local_reviews/survey-link.json", data )
          } )
      } )
  } )

  it( "Should see correct stats for the survey response", () => {
    cy.readFile( "cypress/helpers/local_reviews/survey-link.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_completed, "Review should have been completed" )
        base.loginDashboard( data.dashboard_username )
        cy.intercept( "GET", "**/survey_responses**" )
          .as( "getSurveyResponses" )
        cy.visit( `${ dashboard.host }/admin/local-reviews/surveys/${ data.survey_id }/responses` )
        cy.wait( "@getSurveyResponses" )
        cy.contains( "Loading…" )
          .should( "not.exist" )

        // assertion: table header count should be correct
        base.assertTableHeaderCount( 10 )

        const tableRowText = base.getTableRowsText( { response_date: "Response Date", contact: "Contact", channel: "Channel", sentiment: "Sentiment", request_date: "Request Date", feedback_button: "We'd appreciate your feedback!", opened_website: "Opened Website", review_comment: "Review Comments", consent: "Consent to Share" }, 1 )

        // assertion: responses table data should be correct
        cy.wrap( null )
          .then( () => {
            assert.equal( tableRowText[ 0 ].response_date, base.getTodayDate() )
            assert.equal( tableRowText[ 0 ].contact, user_data.name )
            assert.equal( tableRowText[ 0 ].channel, "Sharing Link" )
            assert.equal( tableRowText[ 0 ].sentiment, "Positive" )
            assert.equal( tableRowText[ 0 ].request_date, "-" )
            assert.equal( tableRowText[ 0 ].feedback_button, "Get started" )
            assert.equal( tableRowText[ 0 ].opened_website, "-" )
            assert.equal( tableRowText[ 0 ].review_comment, review_message )
            assert.equal( tableRowText[ 0 ].consent, "Yes" )
          } )
      } )
  } )
} )
