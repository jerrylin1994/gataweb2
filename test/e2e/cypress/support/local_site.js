function getDashboardStats() {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ Cypress.env( "dashboard" ).accounts.all_products.merchant_id }/first_impression/dashboard_stats`,
    headers: {
      accept: "application/json"
    }
  } )
}

module.exports = {
  getDashboardStats,
}
