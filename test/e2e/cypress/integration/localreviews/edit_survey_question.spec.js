describe( "LocalReviews - Edit Survey Question", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const new_question = "We'd appreciate your feedback! - edited"
  const user_data = require( "../../fixtures/user_data" )

  it( "Should be able edit a survey question", () => {
    // before
    cy.writeFile( "cypress/helpers/local_reviews/edit-survey-question.json", {} )
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )

    // before each
    base.loginDashboard( dashboard_username )

    // create survey from online template
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.readFile( "cypress/helpers/local_reviews/edit-survey-question.json" )
          .then( ( data ) => {
            data.merchant_id = merchant_id
            base.getMerchantById( merchant_id )
              .then( ( response ) => {
                data.merchant_slug = response.body.slug
                local_reviews.createSurveyFromOnlineTemplate( merchant_id )
                  .then( ( xhr ) => {
                    cy.wrap( xhr.body.id ).as( "survey_id" )
                    data.survey_id = xhr.body.id
                    data.survey_slug = xhr.body.slug
                  } )
              } )
            cy.writeFile( "cypress/helpers/local_reviews/edit-survey-question.json", data )
          } )
      } )

    // edit question
    cy.get( "@survey_id" )
      .then( ( survey_id ) => {
        cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }` )
      } )
    cy.contains( "We'd appreciate your feedback!" )
      .click()
    cy.get( "#input_0" )
      .clear()
      .type( new_question )
    cy.contains( "Confirm" )
      .click()

    // assertion: should see success message
    cy.contains( "Question Updated" )
      .should( "be.visible" )

    // write to file whether question was edited
    cy.readFile( "cypress/helpers/local_reviews/edit-survey-question.json" )
      .then( ( data ) => {
        data.question_edited = true
        cy.writeFile( "cypress/helpers/local_reviews/edit-survey-question.json", data )
      } )
  } )

  it( "Should be able to see edited question on survey", () => {
    cy.readFile( "cypress/helpers/local_reviews/edit-survey-question.json" )
      .then( ( data ) => {
        assert.isTrue( data.question_edited, "Question should have been edited from the dashboard" )
        cy.visit( `${ dashboard.survey_sharing_link }/survey/${ data.merchant_slug }/${ data.survey_id }` )
      } )
    cy.get( "#name" )
      .type( "Test" )
    cy.get( "#mobile" )
      .type( "6472859168" )
    cy.contains( "Start" )
      .click()

    // assertion
    cy.contains( new_question )
      .should( "be.visible" )
  } )
} )
