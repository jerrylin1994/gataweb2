describe( "LocalReviews - Email Notification", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const random_number = Math.floor( Math.random() * 100000000 )
  function changeSurveyNotificationToAll( merchant_id ) {
    local_reviews.getSurveyTemplates( merchant_id )
      .then( ( response ) => {
        cy.log( response )
        cy.request( {
          method: "PUT",
          url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_templates/${ response.body[ 0 ].id }`,
          headers: {
            accept: "application/json"
          },
          body: {
            notifications: {
              email: {
                send_for: "all"
              }
            }
          }
        } )
      } )
  }

  context( "Enable survey settings email response test cases", () => {
    it( "Should be able to enable email notifications for survey", function() {
      const merchant_name = base.createMerchantName()
      const dashboard_username = base.createRandomUsername()
      const email_query = `Thanks for choosing ${ merchant_name }`
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", {} )
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          base.updateUserEmail( merchant_id, this.employee_id, `onelocalqa+${ random_number }@gmail.com` )
        } )
      base.loginDashboard( dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_reviews.getSurveyTemplates( merchant_id )
            .then( ( response ) => {
              const survey_id = response.body[ 0 ].id

              // enable email survey responses
              cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }/settings` )
              cy.get( "md-select[name=\"send_for\"]" )
                .click()
              cy.contains( "All Responses" )
                .click()
              cy.contains( "button", "Save" )
                .click()

              // assertion: should see success message for update survey template settings
              cy.contains( "Template Updated" )
                .should( "be.visible" )

              local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, user_data.email, user_data.name )
            } )
        } )
      cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
        .then( ( email ) => {
          assert.isNotEmpty( email )
          cy.task( "getReviewEmailStarHref", { email_id: email.data.id, email_account: "email1" } )
            .then( ( five_star_link ) => {
              assert.isNotEmpty( five_star_link, "5 star link should have been found in email" )
              cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
                .then( ( data ) => {
                  data.dashboard_username = dashboard_username,
                  data.survey_link = five_star_link,
                  cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", data )
                } )
            } )
        } )
    } )

    it( "Should be able to receive survey response email", () => {
      const review_message = `Great review yay! ${ random_number }`
      const email_query = `LocalReviews: New Survey Response - 1. Online Review ${ review_message }`
      cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
        .then( ( data ) => {
          assert.isDefined( data.survey_link, "Survey star link should have been found in email" )
          cy.visit( data.survey_link )
          base.loginDashboard( data.dashboard_username )
        } )
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
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )

      // assertion: should receive survey response email
      cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
        .then( ( email ) => {
          assert.isNotEmpty( email )
        } )
    } )
  } )

  context( "Disable user settings survey response email notification test cases", () => {
    it( "Should be able to disable survey email notifications for a user", function() {
      cy.visit( dashboard.host ) // prevent test reload later on in the test when visiting a diff domain
      const merchant_name = base.createMerchantName()
      const dashboard_username = base.createRandomUsername()
      const email_query = `Thanks for choosing ${ merchant_name }`
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", {} )
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          base.updateUserEmail( merchant_id, this.employee_id, `onelocalqa+${ random_number }@gmail.com` )
          changeSurveyNotificationToAll( merchant_id )
        } )
      base.loginDashboard( dashboard_username )
      cy.visit( `${ dashboard.host }/admin/settings/auth/users` )
      cy.wait( 1000 ) // help cypress error where the Cypress link text appears detached from DOM
      cy.get( ".ol-table-row" )
        .within( () => {
          cy.contains( "Cypress" )
            .click()
        } )
      cy.contains( "Manage Permissions & Notifications" )
        .click()

      // disable user survey response email notification
      cy.contains( "Survey Response" )
        .parent( "tr" )
        .within( () => {
          cy.get( "md-checkbox" )
            .click()
        } )
      cy.contains( "button", "Update User" )
        .click()

      // assertion: should see success message for disabling user notification for survey response email
      cy.contains( "User saved" )
        .should( "be.visible" )

      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_reviews.getSurveyTemplates( merchant_id )
            .then( ( response ) => {
              const survey_id = response.body[ 0 ].id
              local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, user_data.email, user_data.name )
            } )
        } )
      cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
        .then( ( email ) => {
          assert.isNotEmpty( email )
          cy.task( "getReviewEmailStarHref", { email_id: email.data.id, email_account: "email1" } )
            .then( ( five_star_link ) => {
              assert.isNotEmpty( five_star_link, "5 star link should have been found in email" )
              cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
                .then( ( data ) => {
                  data.dashboard_username = dashboard_username,
                  data.survey_link = five_star_link,
                  cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", data )
                } )
            } )
        } )
    } )

    it( "Should not be able to receive survey response email", () => {
      const review_message = `Great review yay! ${ random_number }`
      const email_query = `LocalReviews: New Survey Response - 1. Online Review ${ review_message }`
      cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
        .then( ( data ) => {
          assert.isDefined( data.survey_link, "Survey star link should have been found in email" )
          cy.visit( data.survey_link )
          base.loginDashboard( data.dashboard_username )
        } )
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
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )

      // assertion: should not receive survey response email
      cy.task( "checkEmailNotExist", { query: email_query, email_account: "email1" } )
        .then( ( email_result ) => {
          assert.equal( email_result, "Error: Exceeded maximum wait time" )
        } )
    } )
  } )
} )
