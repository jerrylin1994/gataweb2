describe( "LocalReviews - Competitor", () => {
  const base = require( "../../support/base" )
  const dashboard = Cypress.env( "dashboard" )
  const local_reviews = require( "../../support/local_reviews" )
  const yelp_id = "https://www.yelp.ca/biz/wendys-daly-city"
  const yellow_pages_id = "https://www.yellowpages.ca/bus/Ontario/Toronto/Bardi-s-Steak-House/156059.html"
  const competitor_google_id = "ChIJZV4reHrO1IkREf5cUYAVd6g"
  const competitor_facebook_url = "https://www.facebook.com/CiboYongeSt"
  const competitor_yelp_url = "https://www.yelp.ca/biz/subway-scarborough-18"
  const competitor_yellow_pages_url = "https://www.yellowpages.ca/bus/Ontario/Windsor/Subway/2559050.html"

  beforeEach( () => {
    base.loginDashboardAsOnelocalAdmin( "ac", dashboard.accounts.all_products.merchant_id )
  } )

  it( "Should be able to set competitors and see competitor stats", () => {
    local_reviews.addConnectedAccounts( "yelp", yelp_id, dashboard.accounts.all_products.merchant_id )
    local_reviews.addConnectedAccounts( "yellow_pages", yellow_pages_id, dashboard.accounts.all_products.merchant_id )
    local_reviews.deleteAllCompetitors( dashboard.accounts.all_products.merchant_id )
    cy.visit( `${ dashboard.host }/admin/settings/local-reviews` )
    cy.contains( "Add Competitors (OneLocal Admin Only)" )
      .click()

    // assertion: should see success msg for adding google competitor
    cy.get( `a[ng-click="addCompetitor( 'google' )"]` )
      .click()
    cy.get( `input[name="google_identifier_0"]` )
      .type( competitor_google_id )
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Changes saved." )
      .should( "be.visible" )
    cy.contains( "i", "close" )
      .click()

    // assertion: should see success msg for adding facebook competitor
    cy.get( `a[ng-click="addCompetitor( 'facebook' )"]` )
      .click()
    cy.get( `input[name="facebook_identifier_0"]` )
      .type( competitor_facebook_url )
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Changes saved." )
      .should( "be.visible" )
    cy.contains( "i", "close" )
      .click()

    // assertion: should see success msg for adding yelp competitor
    cy.get( `a[ng-click="addCompetitor( 'yelp' )"]` )
      .click()
    cy.get( `input[name="yelp_identifier_0"]` )
      .type( competitor_yelp_url )
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Changes saved." )
      .should( "be.visible" )
    cy.contains( "i", "close" )
      .click()

    // assertion: should see success msg for adding yp competitor
    cy.get( `a[ng-click="addCompetitor( 'yellow_pages' )"]` )
      .click()
    cy.get( `input[name="yellow_pages_identifier_0"]` )
      .type( competitor_yellow_pages_url )
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Changes saved." )
      .should( "be.visible" )

    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
    cy.contains( "Analytics" )
      .click()
    cy.contains( "Competitors" )
      .click()

    // assertions: should see name of all added competitors
    cy.contains( "Google Ratings" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Tim Hortons" )
          .should( "be.visible" )
      } )
    cy.contains( "Total Google Reviews" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Tim Hortons" )
          .should( "be.visible" )
      } )
    cy.contains( "Facebook Ratings" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Cibo Wine Bar Yonge St" )
          .should( "be.visible" )
      } )
    cy.contains( "Total Facebook Reviews" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Cibo Wine Bar Yonge St" )
          .should( "be.visible" )
      } )
    cy.contains( "Yelp Ratings" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Subway" )
          .click()
          .should( "be.visible" )
      } )
    cy.contains( "Total Yelp Reviews" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Subway" )
          .should( "be.visible" )
      } )
    cy.contains( "Yellow Pages Ratings" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Subway" )
          .click()
          .should( "be.visible" )
      } )
    cy.contains( "Total Yellow Pages Reviews" )
      .parents( ".ol-card__body" )
      .within( () => {
        cy.contains( "Subway" )
          .should( "be.visible" )
      } )
  } )
} )
