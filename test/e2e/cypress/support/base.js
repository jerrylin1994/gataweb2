const user_data = require( "../fixtures/user_data" )

function createRandomUsername() {
  return `Cypress${ Math.floor( Math.random() * 100000000 ) }`
}

function getMerchantById( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
    headers: {
      accept: "application/json"
    },
  } )
}

function getMerchantByName( name ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "admin" ).host }/merchants`,
    headers: {
      accept: "application/json"
    },
    qs: {
      q: name
    }
  } )
}

function addMerchant( merchant_name, merchant_email ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "admin" ).host }/merchants`,
    headers: {
      accept: "application/json"
    },
    body: {
      "dispatch_type": "full",
      "locale": "en-CA",
      "type": "mobile_service",
      "timezone": "America/Toronto",
      "currency": "CAD",
      "testing": true,
      "auth_version": 2,
      "language": "en",
      "name": merchant_name,
      "email": merchant_email,
    }
  } )
}

function deleteMerchantAndTwilioAccount() {
  deleteMerchants( Cypress.env( "dashboard" ).accounts.all_products )
  deleteTwilioAccounts( )
}

function deleteTwilioAccounts( merchant_name = user_data.merchant_name ) {
  return cy.request( {
    auth: {
      user: Cypress.env( "dashboard" ).accounts.twilio.SID,
      pass: Cypress.env( "TWILIO_TOKEN" )
    },
    method: "GET",
    url: "https://api.twilio.com/2010-04-01/Accounts.json",
    headers: {
      accept: "application/json"
    },
    qs: {
      PageSize: "50",
    }
  } ).then( ( response ) => {
    for( const account of response.body.accounts ) {
      if( ( account.friendly_name ).includes( merchant_name ) && ( account.status == "active" ) ) {
        cy.request( {
          auth: {
            user: account.sid,
            pass: account.auth_token
          },
          method: "POST",
          url: `https://api.twilio.com/2010-04-01/Accounts/${ account.sid }.json`,
          form: true,
          headers: {
            accept: "application/json"
          },
          body: {
            Status: "closed"
          }
        } )
      }
    }
  } )
}

// function deleteTwilioAccounts( ) {
//   return cy.request( {
//     auth: {
//       user: Cypress.env( "dashboard" ).accounts.twilio.SID,
//       pass: Cypress.env( "TWILIO_TOKEN" )
//     },
//     method: "GET",
//     url: "https://api.twilio.com/2010-04-01/Accounts.json",
//     headers: {
//       accept: "application/json"
//     },
//     qs: {
//       PageSize: "50"
//     }
//   } ).then( ( response ) => {
//     for( const account of response.body.accounts ) {
//       if( ( account.friendly_name ).includes( Cypress.env( "dashboard" ).accounts.all_products.merchant_name ) && ( account.status == "active" ) ) {
//         cy.request( {
//           auth: {
//             user: account.sid,
//             pass: account.auth_token
//           },
//           method: "POST",
//           url: `https://api.twilio.com/2010-04-01/Accounts/${ account.sid }.json`,
//           form: true,
//           headers: {
//             accept: "application/json"
//           },
//           body: {
//             Status: "closed"
//           }
//         } )
//       }
//     }
//   } )
// }
function removeTwilioNumber( merchant_name ) {
  getMerchantByName( merchant_name )
    .then( ( response ) => {
      for( const merchant of response.body ) {
        if( merchant.name == merchant_name ) {
          getPhoneNumber( merchant.id )
            .then( ( response ) => {
              if( response.body.length == 1 ) {
                cy.request( {
                  method: "DELETE",
                  url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ merchant.id }/phone/phone-numbers/${ response.body[ 0 ].id }`,
                  qs: {
                    keep_phone_number: true
                  }
                } )
              }
            } )
        }
      }
    } )
}

// function removeTwilioNumber(merchant_id){
//   getPhoneNumber(merchant_id)
//   .then((response)=>{
//     if (response.body.length == 1){
//       cy.request({
//             method: "DELETE",
//             url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ merchant_id }/phone/phone-numbers/${response.body[0].id}`,
//             qs: {
//               keep_phone_number: true
//             }
//           })
//     }
//   })
// }

function getTwilioNumber( machine_number ) {
  switch( machine_number ) {
    case 0: return "14377476336"
    case 1: return "14377476234"
    case 2: return "14377475747"
    case 3: return "14377475919"
    default: return "14377471955"
  }
}

function deleteMerchants( merchant_name = user_data.merchant_name ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "admin" ).host }/merchants`,
    headers: {
      accept: "application/json"
    },
    qs: {
      q: merchant_name

    }
  } ).then( ( response ) => {
    for( const merchant of response.body ) {
      if( merchant.name == merchant_name ) {
        removeTwilioNumber( merchant.id )
        cy.request( {
          timeout: 60000,
          method: "DELETE",
          url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant.id }`,
          headers: {
            accept: "application/json"
          }
        } )
      }
    }
  } )
}

// function deleteMerchants( account ) {
//   const regex = "Test Automation\\d{8}"
//   return cy.request( {
//     method: "GET",
//     url: `${ Cypress.env( "admin" ).host }/merchants`,
//     headers: {
//       accept: "application/json"
//     },
//     qs: {
//       q: account.merchant_name

//     }
//   } ).then( ( response ) => {
//     for( const merchant of response.body ) {
//       if( merchant.name == account.merchant_name || merchant.name.match( regex ) ) {
//         cy.request( {
//           timeout: 60000,
//           method: "DELETE",
//           url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant.id }`,
//           headers: {
//             accept: "application/json"
//           }
//         } )
//       }
//     }
//   } )
// }

function login( env, account_type ) {
  const password = env.host.includes( "dashboard" ) ? Cypress.env( "DASHBOARD_PASSWORD" ) : Cypress.env( "ADMIN_PASSWORD" )
  return cy.request( {
    method: "POST",
    url: `${ env.host }/session`,
    body: {
      username: env.accounts[ account_type ].username,
      password
    }
  } )
}

function loginDashboardAsOnelocalAdmin( account_type, merchant_id ) {
  login( Cypress.env( "admin" ), account_type )
    .then( () => {
      if( Cypress.env( "admin" ).host.includes( "test" ) ) {
        cy.request( {
          method: "GET",
          url: `${ Cypress.env( "admin" ).host }/open_merchant`,
          qs: {
            merchant_id,
            mode: "testing"
          }
        } )
      } else {
        cy.request( {
          method: "GET",
          url: `${ Cypress.env( "admin" ).host }/open_merchant`,
          qs: {
            merchant_id
          }
        } )
      }
    } )
}

function createDashboardUser( merchant_id, username ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/auth/actions`,
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json"
    },
    body: {
      "type": "account_create",
      "data": {
        "user_type": "admin",
        "user_role_ids": [],
        "user_merchant_ids": [
          merchant_id
        ],
        "login_type": "username",
        username,
        "password": "qwerty"
      }
    }
  } )
}

function updateDashboardUserPassword( merchant_id, account_id ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/auth/actions`,
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json"
    },
    body: {
      "type": "account_update",
      "data": {
        account_id,
        "password": "qwerty",
        "needs_onboarding": false,
        "display_name": "Cypress"
      }
    }
  } )
}

function loginDashboard( username ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/session`,
    body: {
      username,
      password: Cypress.env( "DASHBOARD_PASSWORD" )
    }
  } )
}

function getDashboardSession( ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/session`,
  } )
}

function createMerchantName() {
  return `Test Automation${ Math.floor( Math.random() * 90000000 + 10000000 ) }`
}

function getDashboardMerchantStats( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/inbox/stats`,
  } )
}

function changeObjectKeyValue( obj, key, value ) {
  let objects = []
  for( const i in obj ) {
    if( typeof obj[ i ] === "object" && ! Array.isArray( obj[ i ] ) ) {
      objects = objects.concat( changeObjectKeyValue( obj[ i ], key, value ) )
    } else if( i == key ) {
      obj[ key ] = value
    }
  }
  return obj
}

function getIntercomUsers( page ) {
  return cy.request( {
    auth: {
      bearer: Cypress.env( "INTERCOM_TOKEN" )
    },
    method: "GET",
    url: "https://api.intercom.io/users",
    headers: {
      accept: "application/json"
    },
    qs: {
      per_page: 60,
      page,
      sort: "signed_up_at"
    }
  } )
}

function deleteIntercomUser( id ) {
  cy.request( {
    auth: {
      bearer: Cypress.env( "INTERCOM_TOKEN" )
    },
    method: "POST",
    url: "https://api.intercom.io/user_delete_requests",
    headers: {
      accept: "application/json"
    },
    body: {
      "intercom_user_id": id
    }
  } )
}

function deleteIntercomUsers() {
  getIntercomUsers( 1 )
    .then( ( xhr ) => {
      for( const user of xhr.body.users ) {
        if( user.name == "Cypress" ) {
          deleteIntercomUser( user.id )
        }
      }
    } )
}

function getMerchantSettings( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/settings`,
  } )
}

function updateUserEmail( merchant_id, account_id, email ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/auth/actions`,
    body: {
      type: "account_update",
      data: {
        account_id,
        email
      }
    }
  } )
}

function getTodayDate() {
  const date = new Date()
  const options = { year: "numeric", month: "short", day: "numeric" }
  const formatted_date = date.toLocaleDateString( "en-US", options )
  return formatted_date
}

function assertTableHeaderCount( count ) {
  cy.get( "th" )
    .then( ( elements ) => {
      assert.equal( elements.length, count )
    } )
}

function getTableRowsImgSrc( headers, rows ) {
  const rowImgSrcArray = []
  for( let i = 1; i <= rows; i++ ) {
    const rowImgSrc = {}
    for( const property in headers ) {
      cy.contains( "th", headers[ property ] )
        .invoke( "index" )
        .then( ( i ) => {
          cy.get( "td" )
            .eq( i )
            .find( "img" )
            .invoke( "attr", "src" )
            .then( ( src ) => {
              rowImgSrc[ property ] = src
            } )
        } )
    }
    rowImgSrcArray.push( rowImgSrc )
  }
  return rowImgSrcArray
}

function getTableRowsText( headers, rows ) {
  const rowTextArray = []
  for( let i = 1; i <= rows; i++ ) {
    const rowText = {}
    for( const property in headers ) {
      cy.contains( "th", headers[ property ] ).invoke( "index" )
        .then( ( header_index ) => {
          cy.get( "tr" )
            .eq( i )
            .within( () => {
              cy.get( "td" )
                .eq( header_index )
                .invoke( "text" )
                .then( ( text ) => {
                  rowText[ property ] = text
                } )
            } )
        } )
    }
    rowTextArray.push( rowText )
  }
  return rowTextArray
}

function getPhoneNumber( merchant_id ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ merchant_id }/phone/phone-numbers`,
    headers: {
      accept: "application/json"
    }
  } )
}

function createUserEmail() {
  return cy.task( "createUserEmail" )
    .then( ( email_config ) => {
      cy.wrap( email_config )
        .as( "email_config" )
      cy.log( email_config.user )
      cy.log( email_config.password )
    } )
}


function addTwilioNumber( merchant_id, phone_number ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ merchant_id }/phone/phone-numbers`,
    body: {
      existing_phone_number: true,
      phone_number
    },
    failOnStatusCode: false
  } ).then( ( response ) => {
    if( response.status == 422 ) {
      cy.wait( 1000 )
      cy.request( {
        method: "POST",
        url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ merchant_id }/phone/phone-numbers`,
        body: {
          existing_phone_number: true,
          phone_number
        }
      } )
    }
  } )
}

module.exports = {
  createRandomUsername,
  addMerchant,
  login,
  deleteMerchantAndTwilioAccount,
  getMerchantById,
  loginDashboardAsOnelocalAdmin,
  createDashboardUser,
  updateDashboardUserPassword,
  loginDashboard,
  getDashboardSession,
  createMerchantName,
  getDashboardMerchantStats,
  changeObjectKeyValue,
  deleteIntercomUsers,
  getMerchantSettings,
  updateUserEmail,
  getTodayDate,
  assertTableHeaderCount,
  getTableRowsImgSrc,
  getTableRowsText,
  getPhoneNumber,
  createUserEmail,
  deleteTwilioAccounts,
  deleteMerchants,
  removeTwilioNumber,
  addTwilioNumber,
  getTwilioNumber,
}
