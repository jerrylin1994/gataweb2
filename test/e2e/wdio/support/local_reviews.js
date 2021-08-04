const base = require( "../support/base" )
const rp = require( "request-promise" ).defaults( { jar: true, json: true } )
const tough = require( "tough-cookie" )

async function createLocalReviewsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username ) {
  let merchant_id = ""
  let dashboard_cookie = ""
  let employee_id = ""
  const domain = browser.config.dashboard.host.split( "//" )[ 1 ]
  const merchant = await base.addMerchant( merchant_name, user_email )
  merchant_id = merchant.id
  console.log( merchant_id )
  await enableLocalReviews( browser.config.dashboard.accounts.twilio.phone_number, merchant_id )
  const response = await base.loginDashboardAsOnelocalAdmin( merchant_id )
  dashboard_cookie = ( response.request._redirect.redirects[ 0 ].redirectUri ).split( "=" )[ 1 ]
  const cookie = new tough.Cookie( {
    key: "JSESSIONID",
    value: dashboard_cookie,
    domain,
    httpOnly: true
  } )
  base.cookiejar.setCookie( cookie.toString(), browser.config.dashboard.host )
  const dashboard_user = await base.createDashboardUser( merchant_id, dashboard_username )
  employee_id = dashboard_user.refs.account_ids[ 0 ]
  await base.updateDashboardUserPassword( merchant_id, dashboard_user.refs.account_ids[ 0 ] )
  return {
    employee_id,
    merchant_id
  }
}

function enableLocalReviews( phone_number, merchant_id ) {
  let updated_settings = ""
  return base.getMerchantById( merchant_id )
    .then( ( response ) => {
      const current_settings = response.settings.review_edge
      const new_settings = {
        "status": "live",
        "telephone": phone_number,
        "providers": [
          {
            "type": "google",
            "text": "Use Google to leave us a review?",
            "place_id": "Ei4zNzAgQWRlbGFpZGUgU3QgRSwgVG9yb250bywgT04gTTVBIDFOMSwgQ2FuYWRhIjESLwoUChIJ2Wa0pzDL1IkRmhAbRwTWuYMQ8gIqFAoSCeuM_pw5y9SJEYE1YV3UhPhd"
          },
          {
            "type": "facebook",
            "text": "Use Facebook to leave us a review?",
            "url": "https://www.facebook.com/pg/Krisp-Klean-1916995865260491/reviews"
          }
        ],
        "spam_prevention_enabled": false
      }
      updated_settings = Object.assign( current_settings, new_settings )
      return rp( {
        method: "PUT",
        url: `${ browser.config.admin.host }/merchants/${ merchant_id }`,
        headers: {
          accept: "application/json"
        },
        body: {
          settings: {
            review_edge: updated_settings
          }
        },
        jar: base.cookiejar
      } )
    } )
}

function sendReviewRequest( merchant_id, survey_template_id, employee_id, contact, name ) {
  return rp( {
    method: "POST",
    url: `${ browser.config.dashboard.host }/merchants/${ merchant_id }/survey_requests`,
    body: {
      app: "Dashboard",
      customer: {
        contact,
        contact_type: null,
        name
      },
      is_first: true,
      location: "LocalReviews",
      sender: {
        id: employee_id,
        ref: "employees",
        name: null
      },
      template_id: survey_template_id
    },
    headers: {
      accept: "application/json"
    },
    jar: base.cookiejar
  } )
}

function getSurveyTemplates( merchant_id ) {
  return rp( {
    method: "GET",
    url: `${ browser.config.dashboard.host }/merchants/${ merchant_id }/survey_templates`,
    headers: {
      accept: "application/json"
    },
    jar: base.cookiejar
  } )
}

function connectFbAccount( merchant_id ) {
  return rp( {
    method: "POST",
    url: `${ browser.config.dashboard.host }/merchants/${ merchant_id }/review_edge/accounts`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "facebook",
      access_token: "fb_manager",
      location_id: "1916995865260491"
    },
    jar: base.cookiejar
  } )
}

module.exports = {
  createLocalReviewsMerchantAndDashboardUser,
  enableLocalReviews,
  sendReviewRequest,
  getSurveyTemplates,
  connectFbAccount,
}
