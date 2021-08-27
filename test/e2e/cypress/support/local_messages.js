const base = require( "../support/base" )
// function enableLocalMessages( merchant_id ) {
//   cy.request( {
//     method: "PUT",
//     url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
//     headers: {
//       accept: "application/json"
//     },
//     body: {
//       "settings": {
//         "messenger": {
//           "status": "live"
//         }
//       }
//     }
//   } )
//   addLocalMessagesTwilioNumber( merchant_id )
// }

function enableLocalMessages( merchant_id ) {
  cy.request( {
    method: "PUT",
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
    headers: {
      accept: "application/json"
    },
    body: {
      "settings": {
        "messenger": {
          "status": "live"
        }
      }
    }
  } )
}

// function addLocalMessagesTwilioNumber( merchant_id ) {
//   cy.request( {
//     method: "PUT",
//     url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/messenger/channel`,
//     headers: {
//       accept: "application/json"
//     },
//     body: {
//       phone_number: Cypress.env( "dashboard" ).accounts.twilio.phone_number
//     }
//   } )
// }

function addLocalMessagesTwilioNumber( merchant_id, phone_number ) {
  cy.request( {
    method: "PUT",
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/messenger/channel`,
    headers: {
      accept: "application/json"
    },
    body: {
      phone_number
    }
  } )
}

function removeLocalMessagesTwilioNumber( merchant_id ) {
  cy.request( {
    method: "PUT",
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/messenger/channel`,
    headers: {
      accept: "application/json"
    },
    body: {
      "phone_number": null,
    }
  } )
}

function createLocalMessagesMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number ) {
  base.addMerchant( merchant_name, user_email )
    .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
      enableLocalMessages( merchant_id, phone_number )
      base.addTwilioNumber( merchant_id, phone_number )
      base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
      base.createDashboardUser( merchant_id, dashboard_username )
        .then( ( response ) => {
          base.updateDashboardUserPassword( merchant_id, response.body.refs.account_ids[ 0 ] )
        } )
    } )
}

function sendTwilioMessage( text, from, to ) {
  const twilio_account = Cypress.env( "dashboard" ).accounts.twilio
  cy.request( {
    method: "POST",
    form: true,
    auth: {
      user: twilio_account.SID,
      pass: Cypress.env( "TWILIO_TOKEN" )
    },
    url: `https://api.twilio.com/2010-04-01/Accounts/${ twilio_account.SID }/Messages.json`,
    headers: {
      accept: "application/json"
    },
    body: {
      Body: text,
      From: from,
      To: to
    }
  } )
}

function sendDashboardMessage( merchant_id, phone_number ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/messenger/messages`,
    body: {
      phone_number,
      text: `HELLO${ Math.floor( Math.random() * 100000000 ) }`
    }
  } )
}

function scheduleMessage( merchant_id, future_date_time, sent_text ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/messenger/messages`,
    body: {
      phone_number: Cypress.env( "dashboard" ).accounts.twilio.to_phone_number,
      text: sent_text,
      date: future_date_time
    }
  } )
}

module.exports = {
  removeLocalMessagesTwilioNumber,
  enableLocalMessages,
  createLocalMessagesMerchantAndDashboardUser,
  sendTwilioMessage,
  sendDashboardMessage,
  scheduleMessage,
  addLocalMessagesTwilioNumber,
}
