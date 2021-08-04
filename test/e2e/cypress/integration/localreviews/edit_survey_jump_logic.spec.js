describe( "LocalReviews - Edit Surveys Jump Logic", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )

  it( "Should be able edit jump logic in the dashboard", () => {
    // before
    cy.writeFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json", {} )
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )

    // before each
    base.loginDashboard( dashboard_username )

    // create survey from online template
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.readFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json" )
          .then( ( data ) => {
            data.merchant_id = merchant_id
            base.getMerchantById( merchant_id )
              .then( ( response ) => {
                data.merchant_slug = response.body.slug
                local_reviews.createSurveyFromOnlineTemplate( merchant_id )
                  .then( ( xhr ) => {
                    local_reviews.addSurveyComponenents( merchant_id, xhr.body.id )
                    cy.wrap( xhr.body.id ).as( "survey_id" )
                    data.survey_id = xhr.body.id
                    data.survey_slug = xhr.body.slug
                  } )
              } )
            cy.writeFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json", data )
          } )
      } )

    // edit jump logic
    cy.get( "@survey_id" )
      .then( ( survey_id ) => {
        cy.visit( `${ dashboard.host }/admin/settings/local-reviews/templates/${ survey_id }` )
      } )
    cy.get( "img[ng-click=\"openEditLogicJumpModal( $event, item )\"]" )
      .eq( 1 )
      .click( { force: true } )
    cy.contains( "Add Rule" )
      .click()
    cy.get( "input[ng-model= \"condition_item.value\"]" )
      .type( "yes" )
    cy.get( "img[ng-click=\"addCondition( rule_item, condition_item )\"]" )
      .click()
    cy.get( "md-select[ng-model=\"rule_item.operator\"]" )
      .click()
    cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
    cy.get( ".md-active" )
      .within( () => {
        cy.contains( "Or" )
          .click()
      } )
    cy.get( "md-select[ng-model=\"condition_item.component_id\"]" )
      .eq( 1 )
      .click()
    cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
    cy.get( ".md-active" )
      .within( () => {
        cy.contains( "Question 2" )
          .click()
      } )
    cy.get( "input[ng-model= \"condition_item.value\"]" )
      .eq( 1 )
      .wait( 1000 ) // added to prevent flake with filling this field
      .type( "maybe" )

    cy.get( "md-select[ng-model=\"rule_item.action.review_triage_type\"]" )
      .click()
    cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
    cy.get( ".md-active" )
      .within( () => {
        cy.contains( "Negative Feedback" )
          .click()
      } )
    cy.contains( "Confirm" )
      .click()

    // assertion: Should see success message for updated logic jump
    cy.contains( "Logic Jump Updated" )
      .should( "be.visible" )

    // make sentiment question non required
    cy.contains( "We'd appreciate your feedback!" )
      .click()
    cy.get( "md-checkbox[ng-model=\"component.required\"]" )
      .click()
    cy.contains( "Confirm" )
      .click()

    cy.readFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json" )
      .then( ( data ) => {
        data.survey_logic_updated = true
        cy.writeFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json", data )
      } )
  } )

  it( "Should be able to see edited jump logic on survey", () => {
    cy.readFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json" )
      .then( ( data ) => {
        assert.isTrue( data.survey_logic_updated, "Jump logic should have been edited from the dashboard" )
        cy.visit( `${ dashboard.survey_sharing_link }/survey/${ data.merchant_slug }/${ data.survey_id }` )
      } )
    cy.get( "#name" )
      .type( "Test" )
    cy.get( "#mobile" )
      .type( "6472859168" )
    cy.contains( "Start" )
      .click()
    cy.contains( "Next" )
      .click()
    cy.get( "input[placeholder=\"Enter your answer…\"]" )
      .type( "yes" )
    cy.contains( "Next" )
      .click()

    // assertion: should land on negative review page
    cy.contains( "Thank you for choosing" )
      .should( "be.visible" )

    // OR condition
    cy.get( ".survey-back-arrow-container" )
      .click()
    cy.get( ".survey-back-arrow-container" ) // second click added due to first click not doing anything
      .click()
    cy.get( "input[placeholder=\"Enter your answer…\"]" )
      .clear()
      .type( "maybe" )
    cy.contains( "Next" )
      .click()

    // assertion: should land on negative review page
    cy.contains( "Thank you for choosing" )
      .should( "be.visible" )
  } )

  after( () => {
    base.login( admin_panel, "ac" )
    cy.readFile( "cypress/helpers/local_reviews/edit-survey-jump-logic.json" )
      .then( ( data ) => {
        local_reviews.removeLocalReviewsTwilioNumber( admin_panel, data.merchant_id ) // will not be needed once twilio bug is fixed https://github.com/gatalabs/gata/issues/8957
      } )
  } )
} )
