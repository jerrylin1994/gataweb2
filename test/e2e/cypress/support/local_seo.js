function getDashboardStats() {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ Cypress.env( "dashboard" ).accounts.all_products.merchant_id }/seo_boost/dashboard_stats?keyword_period=6&location_ranking_period=6&traffic_sources_period=6&website_performance_period=30`,
    headers: {
      accept: "application/json"
    }
  } )
}

module.exports = {
  getDashboardStats,
}
