const base = require( "../support/base" )
const local_messages = require( "../support/local_messages" )
const dashboard = Cypress.env( "dashboard" )

function createLocalReviewsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username ) {
  base.addMerchant( merchant_name, user_email )
    .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
      enableLocalReviews( merchant_id )
      base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
      base.createDashboardUser( merchant_id, dashboard_username )
        .then( ( response ) => {
          cy.wrap( response.body.refs.account_ids[ 0 ] ).as( "employee_id" )
          base.updateDashboardUserPassword( merchant_id, response.body.refs.account_ids[ 0 ] )
        } )
    } )
}

function addPhoneNumber( merchant_id, phone_number ) {
  local_messages.addLocalMessagesTwilioNumber( merchant_id, phone_number )
  base.getPhoneNumberId( merchant_id )
    .then( ( response ) => {
      const phone_number_id = response.body[ 0 ].id
      base.getMerchantById( merchant_id )
        .then( ( response ) => {
          const current_settings = response.body.settings.review_edge
          const new_settings = {
            telephone: dashboard.accounts.twilio.phone_number,
            phone_number_id,
          }
          const updated_settings = Object.assign( current_settings, new_settings )
          cy.request( {
            method: "PUT",
            url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
            headers: {
              accept: "application/json"
            },
            body: {
              settings: {
                "review_edge": updated_settings
              }
            }
          } )
        } )
    } )
}

function enableLocalReviews( merchant_id ) {
  base.getMerchantById( merchant_id )
    .then( ( response ) => {
      const current_settings = response.body.settings.review_edge
      const new_settings = {
        "status": "live",
        "providers": [
          {
            "type": "google",
            "text": "Use Google to leave us a review?",
            "place_id": "ChIJ6S8ZgMo0K4gRZ0mxD-wPS-0"
          },
          {
            "type": "facebook",
            "text": "Use Facebook to leave us a review?",
            "url": "https://google.com"
          }
        ],
        "spam_prevention_enabled": false
      }
      const updated_settings = Object.assign( current_settings, new_settings )
      cy.request( {
        method: "PUT",
        url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
        headers: {
          accept: "application/json"
        },
        body: {
          settings: {
            "review_edge": updated_settings
          }
        }
      } )
    } )
}

function removeLocalReviewsTwilioNumber( env, merchant_id ) {
  base.getMerchantById( merchant_id )
    .then( ( response ) => {
      const current_settings = response.body.settings.review_edge
      const new_settings = {
        "telephone": null
      }
      const updated_settings = Object.assign( current_settings, new_settings )
      cy.request( {
        method: "PUT",
        url: `${ env.host }/merchants/${ merchant_id }`,
        headers: {
          accept: "application/json"
        },
        body: {
          settings: {
            "review_edge": updated_settings
          }
        }
      } )
    } )
}

function sendSMSPreview( phone_number, merchant_id, survey_template_id ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_request_preview`,
    body: {
      "contact": phone_number,
      "contact_type": "sms",
      "content": {
        "enabled": true,
        "text": "Hi [Contact First Name], Thanks for choosing [Merchant Name]. Can you take 30 seconds to answer a quick survey? [STOP Text]\n\n[CTA]",
        "send_image": true
      },
      "send_link": true,
      survey_template_id
    },
    headers: {
      accept: "application/json"
    }
  } )
}

function createSurveyFromOnlineTemplate( merchant_id ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_templates`,
    body: {
      "name": "Online Template Survey", "onelocal_template_id": "5addef924f315b175f877a64"
    },
    headers: {
      accept: "application/json"
    }
  } )
}

function addSurveyComponenents( merchant_id, survey_id ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_templates/${ survey_id }/components`,
    body: {
      type: "short_answer",
      required: true,
      data_type: "text",
      label: "Question 2"
    },
    headers: {
      accept: "application/json"
    }
  } )
}

function getSurveyTemplates( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_templates`,
    headers: {
      accept: "application/json"
    }
  } )
}

function updateLocalReviewsDashboardSettings( merchant_id, settings ) {
  cy.request( {
    method: "PUT",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/settings/review_edge`,
    headers: {
      accept: "application/json",
    },
    body: {
      "widget": settings
    }
  } )
}

function getLocalReviewsStats( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/review_edge/stats`,
    headers: {
      accept: "application/json"
    }
  } )
}

function getFirstReview( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/reviews`,
    headers: {
      accept: "application/json"
    },
    qs: {
      page: "1",
      per_page: "1"
    }
  } ).then( ( response ) => {
    return response.body[ 0 ]
  } )
}

function scheduleReviewRequest( merchant_id, contact_name, survey_template_id, future_date_time, employee_id, contact ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/scheduled_survey_requests`,
    body: {
      "template_id": survey_template_id,
      "skip_warnings": true,
      "app": "Dashboard",
      "customer": {
        contact,
        "contact_type": null,
        "name": contact_name
      },
      "location": "LocalReviews",
      "is_first": true,
      "sender": {
        "id": employee_id,
        "ref": "employees",
        "name": null
      },
      "schedule": {
        "date": future_date_time
      }
    },
    headers: {
      accept: "application/json"
    }
  } )
}

function deleteAllCompetitors( merchant_id ) {
  cy.request( {
    method: "PUT",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/settings/competitors`,
    headers: {
      accept: "application/json",
    },
    body: {
      facebook: [],
      google: [],
      yellow_pages: [],
      yelp: []
    }
  } )
}

function sendReviewRequest( merchant_id, survey_template_id, employee_id, contact, name ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/survey_requests`,
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
    }
  } )
}

function deleteConnectedAccount( merchant_id, account_type ) {
  base.getMerchantSettings( merchant_id )
    .then( ( response ) => {
      for( const account of response.body.review_edge.connected_accounts ) {
        if( account.type == account_type ) {
          cy.request( {
            method: "DELETE",
            url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/review_edge/accounts/${ account.id }`
          } )
        }
      }
    } )
}

function addConnectedAccounts( type, location_id, merchant_id ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/review_edge/accounts`,
    body: {
      location_id,
      type
    },
    headers: {
      accept: "application/json"
    }
  } )
}

function getPhoneNumberId( merchant_id ) {
  cy.request( {
    method: "GET",
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/phone-numbers`,
    headers: {
      accept: "application/json"
    }
  } ).then( ( response ) => {
    return response.body.id
  } )
}


module.exports = {
  createLocalReviewsMerchantAndDashboardUser,
  removeLocalReviewsTwilioNumber,
  sendSMSPreview,
  createSurveyFromOnlineTemplate,
  addSurveyComponenents,
  getSurveyTemplates,
  updateLocalReviewsDashboardSettings,
  getLocalReviewsStats,
  getFirstReview,
  scheduleReviewRequest,
  deleteAllCompetitors,
  sendReviewRequest,
  deleteConnectedAccount,
  addConnectedAccounts,
  getPhoneNumberId,
  addPhoneNumber,
}
