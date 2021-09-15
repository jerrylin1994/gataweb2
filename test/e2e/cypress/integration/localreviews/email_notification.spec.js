describe( "LocalReviews - Email Notification", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const merchant_name = user_data.merchant_name
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
    it( "Part 1 - Should be able to enable email notifications for survey", function() {
      const dashboard_username = base.createRandomUsername()
      const email_query = `Thanks for choosing ${ merchant_name }`
      base.createUserEmail()
      base.login( admin_panel, "ac" )
      cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", {} )
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          base.updateUserEmail( merchant_id, this.employee_id, this.email_config.user )
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

              local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, this.email_config.user, user_data.name )
            } )
        } )

      cy.get( "@email_config" )
        .then( ( email_config ) => {
          // assertion: should get survey response email
          cy.task( "getLastEmail", { email_config, email_query } )
            .then( ( html ) => {
              cy.visit( Cypress.config( "baseUrl" ) )
              cy.document( { log: false } ).invoke( { log: false }, "write", html )
            } )
          cy.get( `img[alt="Star"]` )
            .eq( 4 )
            .parent()
            .invoke( "attr", "href" )
            .then( ( href ) => {
              cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
                .then( ( data ) => {
                  data.dashboard_username = dashboard_username,
                  data.survey_link = href,
                  data.email_config = email_config
                  cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", data )
                } )
            } )
        } )
    } )

    it( "Part 2 - Should be able to receive survey response email", () => {
      const review_message = `Great review yay! ${ random_number }`
      const email_query = `LocalReviews: New Survey Response - 1. Online Review`
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
      cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
        .then( ( data ) => {
          const email_config = data.email_config
          // assertion: should receive survey response email
          cy.task( "getLastEmail", { email_config, email_query } )
            .then( ( html ) => {
              cy.document( { log: false } ).invoke( { log: false }, "write", html )
            } )
        } )
      // assertion: should see review message in review response email
      cy.contains( review_message )
        .should( "be.visible" )
    } )
  } )

  context.only( "Disable user settings survey response email notification test cases", () => {
    it( "Part 1 - Should be able to disable survey email notifications for a user", function() {
      Cypress.on( "uncaught:exception", () => {
        return false
      } )
      cy.visit( dashboard.host ) // prevent test reload later on in the test when visiting a diff domain
      const dashboard_username = base.createRandomUsername()
      const email_query = `Thanks for choosing ${ merchant_name }`
      base.createUserEmail()
      base.login( admin_panel, "ac" )
      cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", {} )
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          const email = `${ this.email_config.user.slice( 0, this.email_config.user.indexOf( "@" ) ) }+1${ this.email_config.user.slice( this.email_config.user.indexOf( "@" ) ) }`
          base.updateUserEmail( merchant_id, this.employee_id, email )
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
              local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, this.email_config.user, user_data.name )
            } )
        } )
      cy.get( "@email_config" )
        .then( ( email_config ) => {
          cy.task( "getLastEmail", { email_config, email_query } )
            .then( ( html ) => {
              cy.document( { log: false } ).invoke( { log: false }, "write", html )
            } )

          cy.get( `img[alt="Star"]` )
            .eq( 4 )
            .parent()
            .invoke( "attr", "href" )
            .then( ( href ) => {
              cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
                .then( ( data ) => {
                  data.dashboard_username = dashboard_username,
                  data.survey_link = href,
                  data.email_config = email_config
                  cy.writeFile( "cypress/helpers/local_reviews/email_notification.json", data )
                } )
            } )
        } )
    } )

    it( "Part 2 - Should not be able to receive survey response email", () => {
      const email_query = `LocalReviews: New Survey Response - 1. Online Review`
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
        .type( "review message" )
      cy.contains( "Next" )
        .click()
      cy.contains( "Thanks for submitting your feedback!" )
        .should( "be.visible" )
      cy.readFile( "cypress/helpers/local_reviews/email_notification.json" )
        .then( ( data ) => {
          const email_config = data.email_config
          // assertion: should not receive survey response email
          cy.task( "checkEmailNotExist", { email_config, email_query } )
            .then( ( email_result ) => {
              assert.equal( email_result, "Error: Could not find email during wait time" )
            } )
        } )
    } )
  } )
} )
