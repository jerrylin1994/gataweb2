describe( "LocalReviews - Phone Reviews", () => {
  const user_data = require( "../../fixtures/user_data" )
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const review_message = "Great review yay!"
  const faker = require( "faker" )
  const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to send phone review request", function() {
      const dashboard_username = base.createRandomUsername()
      cy.intercept( "POST", "**/survey_requests" ).as( "postSurvey" )
      cy.writeFile( "cypress/helpers/local_reviews/phone-reviews.json", {} )

      // before
      base.login( admin_panel, "ac" )
          base.removeTwilioNumber( merchant_name )
          local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
          cy.get( "@merchant_id" )
            .then( ( merchant_id ) => {
              base.addTwilioNumber( merchant_id, Cypress.env("TWILIO_NUMBER") )
            } )

      // beforeEach
      base.loginDashboard( dashboard_username )
      cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )

      cy.contains( "Request Feedback" )
        .click()
      cy.get( "input[name = \"name\"]" )
        .type( faker.name.firstName() )
      cy.get( "input[name = \"contact\"]" )
        .type( dashboard.accounts.twilio.to_phone_number )
      base.getDashboardSession().then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
      } )
      cy.contains( "button[type = \"submit\"]", "Send" )
        .click()
      cy.wait( "@postSurvey" )
      cy.get( "@postSurvey" )
        .then( ( xhr ) => {
          cy.wrap( xhr.response.body.message.text ).as( "sent_text" )
          cy.wrap( xhr.request.body.template_id ).as( "survey_id" )
        } )
      cy.contains( `A feedback request was sent to ${ dashboard.accounts.twilio.to_phone_number }` )
        .should( "be.visible" )

      // assertion: review request text should have been sent
      cy.get( "@sent_text" )
        .then( ( sent_text ) => {
          cy.task( "checkTwilioText", {
            account_SID: dashboard.accounts.twilio.SID,
            to_phone_number: dashboard.accounts.twilio.to_phone_number,
            from_phone_number: Cypress.env("TWILIO_NUMBER"),
            sent_text
          } )
            .then( ( text ) => {
              assert.isNotEmpty( text )
              // assertion: review stats should be updated to reflect new sent survey
              local_reviews.getSurveyTemplates( this.merchant_id )
                .then( ( response ) => {
                  assert.equal( response.body[ 0 ].stats.completed_count, 0, "Completed count should be correct" )
                  assert.equal( response.body[ 0 ].stats.opened_count, 0, "Opened count should be correct" )
                  assert.equal( response.body[ 0 ].stats.requests_count, 1, "Requests count should be correct" )
                  assert.equal( response.body[ 0 ].stats.responses_count, 0, "Responses count should be correct" )
                } )
              cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
                .then( ( data ) => {
                  data.dashboard_username = dashboard_username
                  data.merchant_id = this.merchant_id
                  data.review_request_sent = true
                  data.survey_id = this.survey_id,
                  data.review_link = text.substring( text.lastIndexOf( ":" ) - 5 )
                  cy.writeFile( "cypress/helpers/local_reviews/phone-reviews.json", data )
                } )
            } )
        } )
    } )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to complete a review survey", () => {
      cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
        .then( ( data ) => {
          assert.isTrue( data.review_request_sent, "review request not not sent" )
          cy.visit( data.review_link )
          // assertion: opened rate should be 1
          base.loginDashboard( data.dashboard_username )
          local_reviews.getSurveyTemplates( data.merchant_id )
            .then( ( response ) => {
              assert.equal( response.body[ 0 ].stats.opened_count, 1, "Opened count should be correct" )
            } )
        } )
      // assertion: should see welcome question
      cy.contains( "How would you rate your experience with us?" )
        .should( "be.visible" )
      cy.get( ".survey-star-5" )
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
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )
      cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
        .then( ( data ) => {
          data.review_request_completed = true
          cy.writeFile( "cypress/helpers/local_reviews/phone-reviews.json", data )
        } )
    } )
  } )

  Cypress.testFilter( [ ], () => {
    it( "Should be able to reply to review from LocalMessages", () => {
      const sent_text = "Thanks for the review"
      cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
        .then( ( data ) => {
          assert.isTrue( data.review_request_completed, "Review request should have been completed" )
          base.login( admin_panel, "ac" )
          local_messages.enableLocalMessages( data.merchant_id )
          base.loginDashboard( data.dashboard_username )
          cy.visit( `${ dashboard.host }/admin/local-reviews/` )
        } )

      // reply to review in LocalMessages
      cy.contains( "Reply in LocalMessages" )
        .click()
      cy.get( `form[name="$ctrl.form.message"]` )
        .within( () => {
          cy.get( ".ql-editor" )
            .type( sent_text )
          cy.get( `button[type="submit"]` )
            .click()
        } )

      // assertion: should be able to receive text reply to a review
          cy.task( "checkTwilioText", {
            account_SID: dashboard.accounts.twilio.SID,
            to_phone_number: dashboard.accounts.twilio.to_phone_number,
            from_phone_number: Cypress.env("TWILIO_NUMBER"),
            sent_text
          } )
            .then( ( text ) => {
              assert.isNotEmpty( text )
            } )
    } )
  } )
} )
