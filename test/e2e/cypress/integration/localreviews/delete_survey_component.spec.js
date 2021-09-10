describe( "LocalReviews - Delete Surveys Components", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )

  it( "Should be able delete a question from dashboard", () => {
    // before
    cy.writeFile( "cypress/helpers/local_reviews/delete-survey-component.json", {} )
    base.login( admin_panel, "ac" )
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )

    // before each
    base.loginDashboard( dashboard_username )

    // create survey from online template
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.readFile( "cypress/helpers/local_reviews/delete-survey-component.json" )
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
            cy.writeFile( "cypress/helpers/local_reviews/delete-survey-component.json", data )
          } )
      } )

    // delete question
    cy.get( "@survey_id" )
      .then( ( survey_id ) => {
        cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }` )
      } )
    cy.get( "div[data-ng-model=\"question_items\"]" )
      .within( () => {
        cy.get( "img[ng-click=\"removeComponent( $event, item )\" ]" )
          .click( { force: true } )
      } )
    cy.contains( "button", "Yes" )
      .click()

    // assertion: should see success message
    cy.contains( "Question Deleted" )
      .should( "be.visible" )

    // write to file whether a question was deleted
    cy.readFile( "cypress/helpers/local_reviews/delete-survey-component.json" )
      .then( ( data ) => {
        data.question_deleted = true
        cy.writeFile( "cypress/helpers/local_reviews/delete-survey-component.json", data )
      } )
  } )


  it( "Should not see deleted question in the survey", () => {
    cy.readFile( "cypress/helpers/local_reviews/delete-survey-component.json" )
      .then( ( data ) => {
        assert.isTrue( data.question_deleted, "Question should have been deleted from the dashboard" )
        cy.visit( `${ dashboard.survey_sharing_link }/survey/${ data.merchant_slug }/${ data.survey_id }` )
      } )

    // start survey flow
    cy.get( "#name" )
      .type( "Test" )
    cy.get( "#mobile" )
      .type( "6472859168" )
    cy.contains( "Start" )
      .click()

    // assertion: should not see deleted question and the exit page instead
    cy.contains( "Thanks for choosing us!" )
      .should( "be.visible" )
  } )
} )
