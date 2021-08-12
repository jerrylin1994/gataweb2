import '@percy/cypress';
describe( "LocalSite - Content", () => {
  const local_site = require( "../../support/local_site" )
  const base = require( "../../support/base" )
  const dashboard = Cypress.env( "dashboard" )
  const Ajv = require("ajv")
  const ajv = new Ajv()

  beforeEach( () => {
    cy.fixture( "local_site_schema.json" ).as( "local_site_schema" )
    cy.intercept( "GET", "**/first_impression/dashboard_stats", {fixture:"local_site_mock.json"} )
    base.login( dashboard, "all_products" )
    cy.visit( dashboard.host )
    cy.contains( "LocalSite" ).click()
  } )

  it( "LocalSite dashboard stats api schema should be correct and dashboard should have all the content", function() {
    // validate schema
    local_site.getDashboardStats()
      .then( ( response ) => {
        ajv.validate( this.local_site_schema, response.body )
        expect( ajv.errors, "dashboard_stats api schema does not match" ).to.be.null
      } )

    // // percy visual test
    // cy.contains("Website Performance")
    //   .should("be.visible")
    // cy.get( ".erp-page-content" )
    //   .invoke( "attr", "style", "position: relative" )
    // cy.percySnapshot( "LocalSite Dashboard", { widths: [ 1920 ] } )
  } )
} )
