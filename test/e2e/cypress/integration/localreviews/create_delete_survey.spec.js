describe( "LocalReviews - Create Surveys", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const user_data = require( "../../fixtures/user_data" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const sentiment_question = "Are you happy?"
  const survey_title = "Automation Survey"
  const mc_question = "Where do you live"
  const mc_answers = [ "Canada", "America" ]
  const thank_you_msg = "Thank you!!!!!!!!"
  const merchant_name = "Test Automation Create Delete Survey"

  context( "Create survey from online template and delete survey test cases", () => {
    const dashboard_username = base.createRandomUsername()

    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchants(merchant_name)
      base.deleteTwilioAccounts(merchant_name)
      // base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
    } )

    it( "Should be able to create survey from online template", () => {
      cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )

      // create survey from online template
      cy.contains( "Create Survey" )
        .click()
      cy.get( "#select_value_label_0" )
        .click()
      cy.contains( "OneLocal Templates" )
        .click()
      cy.contains( "td", "1. Online Review" )
        .click( { force: true } )
      cy.wait( 1000 ) // help with flake
      cy.get( "input[name=\"name\"]" )
        .type( "Survey from Online Template" )
      cy.contains( "Confirm" )
        .click()

      // assertion: Should be able to see new created survey
      cy.contains( "Survey from Online Template" )
        .should( "be.visible" )

      // assertion: should be able to see survey created success message
      cy.contains( "Survey created" )
        .should( "be.visible" )
    } )

    it( "Should be able to delete survey", function() {
      local_reviews.createSurveyFromOnlineTemplate( this.merchant_id )
      cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )

      // delete survey
      cy.contains( "Online Template Survey" )
        .click()
      cy.contains( "More" )
        .click()
      cy.contains( "Delete Survey" )
        .click()
      cy.contains( "Confirm" )
        .click()

      // assertions: should see success message and not see the delete survey in the table
      cy.contains( "Survey deleted" )
        .should( "be.visible" )
      cy.get( ".ol-table" )
        .contains( "Online Template Survey" )
        .should( "not.exist" )
    } )
  } )


  context( "Create survey with different components test cases", () => {
    const dashboard_username = base.createRandomUsername()

    it( "Should be able to create a new blank survey", function() {
      // before
      cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", {} )
      base.login( admin_panel, "ac" )
      // base.deleteMerchantAndTwilioAccount()
      base.deleteMerchants(merchant_name)
      base.deleteTwilioAccounts(merchant_name)
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", { merchant_id } )
        } )

      // before each
      base.loginDashboard( dashboard_username )

      cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
      cy.intercept( "GET", "**/survey_templates/**" )
        .as( "postSurveyTemplates" )
      cy.contains( "Surveys" )
        .click()
      cy.contains( "Create Survey" )
        .click()
      cy.get( "#input_3" )
        .type( survey_title )
      cy.contains( "Confirm" )
        .click()
      cy.wait( "@postSurveyTemplates" )
        .then( ( xhr ) => {
          cy.wrap( xhr.response.body.id ).as( "survey_id" )
          cy.wrap( xhr.response.body.slug ).as( "survey_slug" )
        } )

      // assertions: should be able to see success message, should be directed to the survey page
      cy.contains( "Survey created" )
        .should( "be.visible" )
      cy.url()
        .then( ( url ) => {
          expect( url ).to.contain( this.survey_id )
        } )

      // assertion: should be able to see survey link url on distribute page
      cy.get( "@survey_id" )
        .then( ( survey_id ) => {
          cy.visit( `${ dashboard.host }/admin/local-reviews/surveys/${ survey_id }/distribute` )
          base.getMerchantById( this.merchant_id )
            .then( ( response ) => {
              const survey_link = `${ dashboard.survey_sharing_link }/survey/${ response.body.slug }/${ this.survey_slug }`
              cy.wrap( survey_link ).as( "survey_link" )
              cy.get( "a[ng-click=\"openSurveyUrl()\"]" )
                .should( "include.text", survey_link )
            } )
        } )

      // write to file whether new survey was created and survey link
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          data.survey_created = true
          data.survey_link = this.survey_link
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
        } )
    } )

    it( "Should be able to add welcome page", function() {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_created, "Survey should have been created" )
        } )
      // before each
      base.loginDashboard( dashboard_username )

      // add welcome page
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ this.survey_id }` )
      cy.contains( "Add A Welcome Page" )
        .click()
      cy.get( "input[placeholder = \"Enter survey title…\"]" )
        .type( survey_title )
      cy.contains( "Confirm" )
        .click()

      // assertions: should be able to see success message
      cy.contains( "Welcome Page Added" )
        .should( "be.visible" )
      cy.get( "div[data-ng-model = \"intro_items\"]" )
        .within( () => {
          cy.contains( survey_title )
            .should( "be.visible" )
        } )

      // write to file whether welcome page was added
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          data.welcome_page_added = true
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
        } )
    } )

    it( "Should be able to add a MC question", function() {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_created, "Survey should have been created" )
        } )
      // before each
      base.loginDashboard( dashboard_username )

      // add MC question
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ this.survey_id }` )
      cy.contains( "Add A Question" )
        .click()
      cy.contains( "Multi Choice" )
        .click()
      cy.get( "input[placeholder = \"Enter your question…\"]" )
        .type( mc_question )
      cy.get( "#multi-choice-option-item-input-0" )
        .type( mc_answers[ 0 ] )
      cy.contains( "Add Option" )
        .type( mc_answers[ 1 ] )
      cy.contains( "Confirm" )
        .click()

      // assertions: should be able to see success message
      cy.contains( "Question Added" )
        .should( "be.visible" )
      cy.get( "div[data-ng-model = \"question_items\"]" )
        .within( () => {
          cy.contains( mc_question )
            .should( "be.visible" )
        } )

      // write to file whether mc question was added
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          data.mc_question_added = true
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
        } )
    } )

    it( "Should be able to add a Yes / No sentiment question", function() {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_created, "Survey should have been created" )
        } )

      // before each
      base.loginDashboard( dashboard_username )

      // add sentiment question
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ this.survey_id }` )
      cy.contains( "Add A Question" )
        .click()
      cy.contains( "Sentiment" )
        .click()
      cy.contains( "Yes / No" )
        .click()
      cy.get( "input[placeholder = \"Enter your question…\"]" )
        .type( sentiment_question )
      cy.contains( "Confirm" )
        .click()

      // assertions: should be able to see success message
      cy.contains( "Question Added" )
        .should( "be.visible" )
      cy.get( "div[data-ng-model = \"question_items\"]" )
        .within( () => {
          cy.contains( sentiment_question )
            .should( "be.visible" )
        } )

      // write to file whether sentiment question was added
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          data.sentiment_question_added = true
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
        } )
    } )

    it( "Should be able to add a review triage", function() {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_created, "Survey should have been created" )

          // before each
          base.loginDashboard( dashboard_username )

          cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ this.survey_id }` )
          cy.contains( "Add Review Triage" )
            .click()
          cy.contains( "Next" )
            .click()
          cy.contains( "Next" )
            .click()
          cy.contains( "Confirm" )
            .click()

          // assertions: should be able to see success message
          cy.contains( "Review Triage Added" )
            .should( "be.visible" )
          cy.get( "div[data-ng-model = \"question_items\"]" )
            .within( () => {
              cy.contains( sentiment_question )
                .should( "be.visible" )
            } )

          // write to file whether review triage was added
          cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
            .then( ( data ) => {
              data.triage_added = true
              cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
            } )
        } )
    } )

    it( "Should be able to add a exit page", function() {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isTrue( data.survey_created, "Survey should have been created" )
        } )

      // before each
      base.loginDashboard( dashboard_username )

      // add exit page
      cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ this.survey_id }` )
      cy.contains( "Add An Exit Page" )
        .click()
      cy.get( "input[placeholder = \"Enter confirmation/thank you message…\"]" )
        .type( thank_you_msg )
      cy.contains( "Confirm" )
        .click()

      // assertions: should be able to see success message
      cy.contains( "Exit Page Added" )
        .should( "be.visible" )
      cy.get( "div[data-ng-model = \"exit_items\"]" )
        .within( () => {
          cy.contains( thank_you_msg )
            .should( "be.visible" )
        } )

      // write to file whether exit page was added
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          data.exit_page_added = true
          cy.writeFile( "cypress/helpers/local_reviews/add-survey.json", data )
        } )
    } )

    it( "Should be able to see all the components of the survey", () => {
      cy.readFile( "cypress/helpers/local_reviews/add-survey.json" )
        .then( ( data ) => {
          assert.isDefined( data.survey_link, "Should have survey link from survey creation" )
          cy.visit( data.survey_link )
          cy.get( "#name" )
            .type( "Jerry" )
          cy.get( "#email" )
            .type( "dsajkdsjak@example.com" )
          cy.contains( "Start" )
            .click()

          // welcome page assertion
          if( data.welcome_page_added ) {
            cy.contains( survey_title )
              .should( "be.visible" )
            cy.contains( "Start" )
              .click()
          }

          // question page assertion
          if( data.mc_question_added ) {
            cy.contains( mc_question )
              .should( "be.visible" )
            mc_answers.forEach( ( answer ) => {
              cy.contains( answer )
                .should( "be.visible" )
            } )
            cy.contains( mc_answers[ 0 ] )
              .click()
          }

          // sentiment page assertion
          if( data.sentiment_question_added ) {
            cy.contains( sentiment_question )
              .should( "be.visible" )
            cy.contains( "Yes" )
              .click()
          }

          // review triage page assertion
          if( data.triage_added ) {
            cy.contains( "Use Google to leave us a review?" )
              .should( "be.visible" )
            cy.contains( "No" )
              .click()
            cy.contains( "Use Facebook to leave us a review?" )
              .should( "be.visible" )
            cy.contains( "No" )
              .click()
          }

          cy.get( ".survey-textarea-field" )
            .type( "review" )
          cy.contains( "Next" )
            .click()

          // exit page assertion
          if( data.exit_page_added ) {
            cy.contains( thank_you_msg )
              .should( "be.visible" )
          }
        } )
    } )
  } )
} )
