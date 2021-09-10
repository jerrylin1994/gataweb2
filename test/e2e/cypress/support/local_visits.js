const dashboard = Cypress.env( "dashboard" )
const admin_panel = Cypress.env( "admin" )
const base = require( "../support/base" )
const local_messages = require( "../support/local_messages" )

function createVisitsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number ) {
  base.addMerchant( merchant_name, user_email )
    .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
      base.addTwilioNumber( merchant_id, phone_number )
      cy.wait( 1000 )
      // local_messages.addLocalMessagesTwilioNumber( merchant_id )
      base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
      base.createDashboardUser( merchant_id, dashboard_username )
        .then( ( response ) => {
          base.updateDashboardUserPassword( merchant_id, response.body.refs.account_ids[ 0 ] )
        } )
    } )
}

function createCheckInMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number ) {
  createVisitsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number )
  cy.get( "@merchant_id" )
    .then( ( merchant_id ) => {
      enableCheckIn( merchant_id )
    } )
}

function enableCheckIn( merchant_id ) {
  cy.request( {
    method: "POST",
    url: `${ admin_panel.host }/admin/merchants/${ merchant_id }/visits/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "merchant_settings_update",
      data: {
        status: "live",
        id: merchant_id,
        visits: {
          enabled: true
        }
      }
    }
  } )
}

function getVisitsSettings( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ admin_panel.host }/admin/merchants/${ merchant_id }/visits/settings`,
    headers: {
      accept: "application/json"
    },
  } )
}

function sendCheckInInvite( merchant_id, phone_number ) {
  return cy.request( {
    method: "POST",
    url: `${ dashboard.host }/merchants/${ merchant_id }/visits/invite`,
    headers: {
      accept: "application/json"
    },
    body: {
      phone_number
    }
  } )
}

function completeCheckInForm( auth_token, question_id, visit_id, visitor_name ) {
  cy.request( {
    method: "POST",
    url: `${ dashboard.check_in_link }/visits/${ visit_id }/check-in`,
    qs: {
      token: auth_token
    },
    headers: {
      accept: "application/json"
    },
    body: {
      answers: {
        [ question_id ]: visitor_name
      }
    }
  } )
}

module.exports = {
  createVisitsMerchantAndDashboardUser,
  createCheckInMerchantAndDashboardUser,
  getVisitsSettings,
  enableCheckIn,
  sendCheckInInvite,
  completeCheckInForm,
}
