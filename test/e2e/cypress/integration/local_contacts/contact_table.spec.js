describe( "LocalContacts - Contact Table", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const user_data = require( "../../fixtures/user_data" )
  const local_reviews = require( "../../support/local_reviews" )

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchants()
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    cy.wrap( dashboard_username )
      .as( "dashboard_username" )
    local_reviews.createLocalReviewsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" ).then( ( merchant_id ) => {
      local_contacts.createContact( merchant_id, user_data.name, user_data.email, "", false )
    } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    it( "Should be able to search for contacts by name", () => {
      cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
      cy.intercept( "GET", "**/contacts**q=Bob**" )
        .as( "getContacts" )

      // search for contact
      cy.get( "#_search" )
        .type( user_data.name )
      cy.wait( "@getContacts" )

      // assertion: should see correct contacts from search
      cy.get( ".ol-table" )
        .contains( user_data.name )
        .should( "be.visible" )
    } )
  } )

  Cypress.testFilter( [ ], () => {
    it( "Should be able to add and delete a column from contact table", function() {
    // send review request to contact
      local_reviews.getSurveyTemplates( this.merchant_id )
        .then( ( response ) => {
          const survey_id = response.body[ 0 ].id
          local_reviews.sendReviewRequest( this.merchant_id, survey_id, this.employee_id, user_data.email, user_data.name )
        } )
      cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

      // add a column
      cy.get( "#column-toggle" )
        .click()
      cy.get( "md-checkbox[aria-label=\"Surveys Sent\"]" )
        .click()
      cy.get( "#column-toggle" )
        .click()
      cy.contains( user_data.name )
        .should( "be.visible" )

      // assertions: should see column added
      cy.get( ".ol-table" )
        .within( () => {
          cy.get( "th" )
            .eq( 5 )
            .should( "have.text", "Surveys Sent" )
          cy.get( "td" )
            .eq( 5 )
            .should( "have.text", "1. Online Review Star (Gating)" )
        } )

      // remove a column
      cy.get( "#column-toggle" )
        .click()
      cy.get( "md-checkbox[aria-label=\"Surveys Sent\"]" )
        .click()
      cy.get( "#column-toggle" )
        .click()
      cy.contains( user_data.name )
        .should( "be.visible" )

      // assertions: should not see deleted column
      cy.get( ".ol-table" )
        .within( () => {
          cy.get( "th" )
            .eq( 5 )
            .should( "not.have.text", "Surveys Sent" )
          cy.get( "td" )
            .eq( 5 )
            .should( "not.have.text", "1. Online Review Star (Gating)" )
        } )
    } )
  } )
} )
