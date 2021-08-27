import '@percy/cypress';
describe( "LocalSEO - Content", () => {
  const local_seo = require( "../../support/local_seo" )
  const base = require( "../../support/base" )
  const dashboard = Cypress.env( "dashboard" )
  const Ajv = require("ajv")
  const ajv = new Ajv()

  beforeEach( () => {
    cy.fixture( "local_seo_schema.json" ).as( "local_seo_schema" )
    cy.intercept( "GET", "**/seo_boost/dashboard_stats**", {fixture:"local_seo_mock.json" } )
    base.login( dashboard, "all_products" )
    cy.visit( dashboard.host )
    cy.contains( "LocalSEO" ).click()
  } )

  it( "LocalSEO dashboard stats api schema should be correct and dashboard should have all the content", function() {
    // validate schema
    local_seo.getDashboardStats()
      .then( ( response ) => {
        ajv.validate( this.local_seo_schema, response.body )
        expect( ajv.errors, "dashboard_stats api schema does not match" ).to.be.null
      } )

    // percy visual test
    cy.contains("Your Website Performance")
      .should("be.visible")
    cy.get( ".erp-page-content" )
      .invoke( "attr", "style", "position: relative" )
    cy.percySnapshot( "LocalSEO Dashboard", { widths: [ 1920 ] } )
  } )
} )
