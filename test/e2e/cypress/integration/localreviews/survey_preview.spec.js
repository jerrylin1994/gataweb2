describe( "LocalReviews - Survey Preview", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )
  let email_config

  context( "Send survey preview test cases", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      base.createUserEmail()
      cy.get( "@email_config" )
        .then( ( email_configuration ) => {
          email_config = email_configuration
          local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, email_config.imap.user, dashboard_username )
        } )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_messages.addLocalMessagesTwilioNumber( merchant_id )
          local_reviews.addPhoneNumber( merchant_id )
        } )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
      cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )
      cy.contains( "1. Online Review" )
        .click()
      cy.contains( "More" )
        .click()
      cy.contains( "Preview Survey" )
        .click()
      cy.get( ".md-select-value" )
        .click()
    } )

    it( "Should be able to send SMS preview", () => {
      const sent_text = `Hi Cypress, Thanks for choosing ${ merchant_name }`
      cy.contains( "SMS Request" )
        .click()
      cy.contains( "Start Preview" )
        .click()
      cy.wait( 500 ) // help with flake where cypress thinks the input field is disabled when it is not
      cy.get( "input[name=\"contact\"]" )
        .type( dashboard.accounts.twilio.to_phone_number )
      cy.contains( "button", "Send Preview" )
        .click()
      // assertion: SMS has survey link
      cy.task( "checkTwilioText", {
        account_SID: dashboard.accounts.twilio.SID,
        to_phone_number: dashboard.accounts.twilio.to_phone_number,
        from_phone_number: dashboard.accounts.twilio.phone_number,
        sent_text
      } )
        .then( ( text ) => {
          assert.isNotEmpty( text )
        } )
    } )

    it( "Should be able to send SMS reminder preview", () => {
      const sent_text = `Hi Cypress, we saw you weren't able to leave a review, could you take a moment to let us know how we did? We'd really appreciate it! ${ merchant_name }`
      cy.contains( "SMS Reminder" )
        .click()
      cy.contains( "Start Preview" )
        .click()
      cy.wait( 1000 ) // help with flake
      cy.get( "input[name=\"contact\"]" )
        .type( dashboard.accounts.twilio.to_phone_number )
      cy.contains( "button", "Send Preview" )
        .click()
      // assertion: SMS has survey link
      cy.task( "checkTwilioText", {
        account_SID: dashboard.accounts.twilio.SID,
        to_phone_number: dashboard.accounts.twilio.to_phone_number,
        from_phone_number: dashboard.accounts.twilio.phone_number,
        sent_text
      } )
        .then( ( text ) => {
          assert.isNotEmpty( text )
        } )
    } )

    it( "Should be able to send email reminders preview", () => {
      const email_query = `Thanks for choosing us! Would you leave us a review? ${ merchant_name }`
      cy.contains( "Email Reminder" )
        .click()
      cy.contains( "Start Preview" )
        .click()
      cy.contains( "button", "Send Preview" )
        .click()
      // assertion: should receive survey reminder email preview
      cy.task( "getLastEmail", { email_config, email_query } )
    } )

    it( "Should be able to send email survey preview", () => {
      const email_query = `Thanks for choosing ${ merchant_name }`
      cy.contains( "Email Request" )
        .click()
      cy.contains( "Start Preview" )
        .click()
      cy.contains( "button", "Send Preview" )
        .click()
      // assertion: should receive survey email preview
      cy.task( "getLastEmail", { email_config, email_query } )
    } )
  } )

  context( "Complete survey preview test case", () => {
    const dashboard_username = base.createRandomUsername()
    it( "Should not log review and request for a preview", () => {
      // visiting an old survey link to get passed issue of code rerun when visiting different subdomain
      const old_survey_link = `${ dashboard.survey_sms_link }/u/Xmm1vHurmhZEtE`
      cy.visit( old_survey_link )

      const sent_text = `Hi Cypress, Thanks for choosing ${ merchant_name }`
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_messages.addLocalMessagesTwilioNumber( merchant_id )
          local_reviews.addPhoneNumber( merchant_id )
        } )
      base.loginDashboard( dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_reviews.getSurveyTemplates( merchant_id )
            .then( ( response ) => {
              local_reviews.sendSMSPreview( dashboard.accounts.twilio.to_phone_number, merchant_id, response.body[ 0 ].id )
            } )
        } )
      cy.task( "checkTwilioText", {
        account_SID: dashboard.accounts.twilio.SID,
        to_phone_number: dashboard.accounts.twilio.to_phone_number,
        from_phone_number: dashboard.accounts.twilio.phone_number,
        sent_text
      } ).then( ( text ) => {
        const new_survey_link = text.substring( text.lastIndexOf( ":" ) - 5 )
        cy.request( {
          method: "GET",
          url: new_survey_link
        } ).then( ( response ) => {
          // visit redirect url rather than actual survey url to avoid visiting 2 super domains
          cy.visit( response.allRequestResponses[ 1 ][ "Request URL" ] )
        } )
      } )

      // Survey flow
      cy.contains( "Start" )
        .click()
      cy.get( ".survey-star-5" )
        .click()
      cy.contains( "No" )
        .click()
      cy.contains( "No" )
        .click()
      cy.get( ".survey-textarea-field" )
        .type( "Preview review" )
      cy.contains( "Next" )
        .click()

      // assertion: should see thank you exit page message
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )

      // assertion: completing survey preview request should count towards survey stats
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_reviews.getSurveyTemplates( merchant_id )
        } )
        .then( ( response ) => {
          assert.equal( response.body[ 0 ].stats.completed_count, 0, "Completed count should equal 0" )
          assert.equal( response.body[ 0 ].stats.opened_count, 0, "Opened count should equal 0" )
          assert.equal( response.body[ 0 ].stats.requests_count, 0, "Requests count should equal 0" )
          assert.equal( response.body[ 0 ].stats.responses_count, 0, "Responses count should equal 0" )
        } )
    } )
  } )
} )
