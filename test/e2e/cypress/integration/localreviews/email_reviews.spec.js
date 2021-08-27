Cypress.testFilter( [ "@smoke" ], () => {
  describe( "LocalReviews - Email Reviews", () => {
    const base = require( "../../support/base" )
    const user_data = require( "../../fixtures/user_data" )
    const local_reviews = require( "../../support/local_reviews" )
    const admin_panel = Cypress.env( "admin" )
    const dashboard = Cypress.env( "dashboard" )
    const review_message = "Great review yay!"

    it( "Should be able to send email review request", function() {
      cy.intercept( "POST", "**/review_edge/survey_requests" ).as( "sendSurvey" )
      const dashboard_username = base.createRandomUsername()
      // const merchant_name = base.createMerchantName()
      const email_query = `Thanks for choosing ${ user_data.merchant_name }`
      cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", {} )
      base.login( admin_panel, "ac" )
      // base.deleteMerchants()
      // base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      base.createUserEmail()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )

      base.loginDashboard( dashboard_username )
      cy.visit( dashboard.host )
      cy.get( "a[href = \"/admin/local-reviews\"]" )
        .click()
      cy.contains( "Request Feedback" )
        .click()
      cy.get( "input[name = \"name\"]" )
        .type( user_data.name )
      cy.get( "@email_config" )
        .then( ( email_config ) => {
          cy.get( "input[name = \"contact\"]" )
            .type( email_config.imap.user )
        } )
      cy.get( ".md-container" ).click()
      cy.contains( "button[type = \"submit\"]", "Send" )
        .click()
      cy.get( "@email_config" )
        .then( ( email_config ) => {
          cy.contains( `A feedback request was sent to ${ email_config.imap.user }` )
            .should( "be.visible" )
          cy.task( "getLastEmail", { email_config, email_query } )
            .then( ( html ) => {
              cy.visit( Cypress.config( "baseUrl" ) )
              cy.document( { log: false } ).invoke( { log: false }, "write", html )
            } )
        } )
      cy.get( "@sendSurvey" )
        .then( ( xhr ) => {
          cy.wrap( xhr.request.body.template_id ).as( "survey_id" )
        } )
      cy.get( `img[alt="Star"]` )
        .eq( 4 )
        .parent()
        .invoke( "attr", "href" )
        .then( ( href ) => {
          cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
            .then( ( data ) => {
              data.survey_link_exists = true,
              data.dashboard_username = dashboard_username,
              data.survey_link = href,
              data.merchant_id = this.merchant_id
              data.survey_id = this.survey_id
              cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", data )
            } )
        } )
    } )

    it( "Should be able to complete a email review survey", () => {
      cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_link_exists, "Survey star link should have been found in email" )
          cy.visit( data.survey_link )
          // assertion: opened rate should be 1
          base.loginDashboard( data.dashboard_username )
          local_reviews.getSurveyTemplates( data.merchant_id )
            .then( ( response ) => {
              assert.equal( response.body[ 0 ].stats.opened_count, 1, "Opened count should be correct" )
            } )
        } )
      cy.get( ".powered-by-onelocal" )
        .should( "be.visible" )
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
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )
      cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
        .then( ( data ) => {
          data.survey_request_completed = true
          cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", data )
        } )
    } )

    it( "Should see correct stats for completed email survey", () => {
      cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_request_completed, "Review request should have been completed" )
          base.loginDashboard( data.dashboard_username )
          cy.intercept( "GET", "**/survey_responses**" )
            .as( "getSurveyResponses" )
          cy.visit( `${ dashboard.host }/admin/local-reviews/surveys/${ data.survey_id }/responses` )
          cy.wait( "@getSurveyResponses" )

          // assertion: table header count should be correct
          base.assertTableHeaderCount( 10 )
          const tableRowText = base.getTableRowsText( { response_date: "Response Date", contact: "Contact", channel: "Channel", sentiment: "Sentiment", request_date: "Request Date", star_rating: "How would you rate your experience with us?", opened_website: "Opened Website", review_comment: "Review Comments", consent: "Consent to Share" }, 1 )

          // assertion: responses table data should be correct
          cy.wrap( null )
            .then( () => {
              assert.equal( tableRowText[ 0 ].response_date, base.getTodayDate() )
              assert.equal( tableRowText[ 0 ].contact, user_data.name )
              assert.equal( tableRowText[ 0 ].channel, "Email Request" )
              assert.equal( tableRowText[ 0 ].sentiment, "Positive" )
              assert.equal( tableRowText[ 0 ].request_date, base.getTodayDate() )
              assert.equal( tableRowText[ 0 ].star_rating, "5" )
              assert.equal( tableRowText[ 0 ].opened_website, "-" )
              assert.equal( tableRowText[ 0 ].review_comment, review_message )
              assert.equal( tableRowText[ 0 ].consent, "Yes" )
            } )
        } )
    } )
  } )
} )
