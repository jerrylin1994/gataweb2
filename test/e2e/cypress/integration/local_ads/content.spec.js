import '@percy/cypress';
describe( "LocalAds - Content", () => {
  const local_ads = require( "../../support/local_ads" )
  const base = require( "../../support/base" )
  const dashboard = Cypress.env( "dashboard" )
  const Ajv = require("ajv")
  const ajv = new Ajv()

  beforeEach( () => {
    cy.fixture( "local_ads_schema.json" ).as( "local_ads_schema" )
    base.login( dashboard, "all_products" )
    cy.visit( dashboard.host )
  } )

  it( "LocalAds dashboard stats api schema should be correct and dashboard should have all the content", function() {
    // validate schema
    local_ads.getDashboardStats()
      .then( ( response ) => {
        ajv.validate( this.local_ads_schema, response.body )
        expect( ajv.errors, "dashboard_stats api schema does not match" ).to.be.null
      } )

    // update mock with new facebook ad preview url
    local_ads.getDashboardStats()
      .then( ( response ) => {
        cy.fixture( "local_ads_mock.json" )
          .then( ( mock ) => {
            cy.intercept( "GET", "**/clear_growth/dashboard_stats?period=last_30_days", mock ).as( "dashboardStats" )
          } )
      } )

    // percy visual test
    cy.contains( "LocalAds" ).click()
    cy.contains("Google Adwords Performance")
      .should("be.visible")
    cy.get( ".erp-page-content" )
      .invoke( "attr", "style", "position: relative" )
    cy.percySnapshot( "LocalAds Google Dashboard", { widths: [ 1920 ] } )
    cy.contains( "Facebook Ads" ).click()
    cy.contains("Facebook Ads Performance")
      .should("be.visible")
    cy.percySnapshot( "LocalAds Facebook Dashboard", { widths: [ 1920 ] } )
  } )
} )
