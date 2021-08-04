const rp = require( "request-promise" ).defaults( { jar: true, json: true } )
const tough = require( "tough-cookie" )
const cookiejar = rp.jar()

function createRandomUsername() {
  return `WDIO${ Math.floor( Math.random() * 100000000 ) }`
}

function createMerchantName() {
  return `Test Automation${ Math.floor( Math.random() * 90000000 + 10000000 ) }`
}

function login() {
  const domain = browser.config.admin.host.split( "//" )[ 1 ]
  browser.call( () => {
    return rp( {
      method: "POST",
      url: `${ browser.config.admin.host }/session`,
      body: {
        username: browser.config.admin.accounts.ac.username,
        password: browser.config.admin.accounts.ac.password
      },
      resolveWithFullResponse: true,
    } )
      .then( ( response ) => {
        const header = response.headers[ "set-cookie" ][ 0 ].split( ";" )
        const session = header[ 0 ].split( "=" )[ 1 ]
        browser.setCookies( { name: "JSESSIONID", value: session, domain, httpOnly: true } )
        const cookie = new tough.Cookie( {
          key: "JSESSIONID",
          value: session,
          domain,
          httpOnly: true
        } )
        cookiejar.setCookie( cookie.toString(), browser.config.admin.host )
      } )
  } )
}

function addMerchant( merchant_name, merchant_email ) {
  return rp( {
    method: "POST",
    url: `${ browser.config.admin.host }/merchants`,
    headers: {
      accept: "application/json"
    },
    body: {
      dispatch_type: "full",
      locale: "en-CA",
      type: "mobile_service",
      timezone: "America/Toronto",
      currency: "CAD",
      testing: false,
      auth_version: 2,
      language: "en",
      name: merchant_name,
      email: merchant_email,
    },
    jar: cookiejar
  } )
}

function getMerchantById( merchant_id ) {
  return rp( {
    method: "GET",
    url: `${ browser.config.admin.host }/merchants/${ merchant_id }`,
    headers: {
      accept: "application/json",
    },
    jar: cookiejar
  } )
}

function loginDashboardAsOnelocalAdmin( merchant_id ) {
  if( browser.config.admin.host.includes( "test" ) ) {
    return rp( {
      method: "GET",
      url: `${ browser.config.admin.host }/open_merchant`,
      qs: {
        merchant_id,
        mode: "testing"
      },
      json: false
    } )
  }
  return rp( {
    method: "GET",
    url: `${ browser.config.admin.host }/open_merchant`,
    qs: {
      merchant_id
    },
    resolveWithFullResponse: true,
    jar: cookiejar,
    json: false
  } )
}


function createDashboardUser( merchant_id, username ) {
  return rp( {
    method: "POST",
    url: `${ browser.config.dashboard.host }/merchants/${ merchant_id }/auth/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "account_create",
      data: {
        user_type: "admin",
        user_role_ids: [],
        user_merchant_ids: [
          merchant_id
        ],
        login_type: "username",
        username,
        password: "qwerty"
      }
    },
    jar: cookiejar
  } )
}

function updateDashboardUserPassword( merchant_id, account_id ) {
  return rp( {
    method: "POST",
    url: `${ browser.config.dashboard.host }/merchants/${ merchant_id }/auth/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "account_update",
      data: {
        account_id,
        password: "qwerty",
        needs_onboarding: false,
        display_name: "WDIO"
      }
    },
    jar: cookiejar
  } )
}

function loginDashboard( username ) {
  const domain = browser.config.dashboard.host.split( "//" )[ 1 ]
  browser.call( () => {
    return rp( {
      method: "POST",
      url: `${ browser.config.dashboard.host }/session`,
      body: {
        username,
        password: "qwerty"
      },
      resolveWithFullResponse: true,
    } )
      .then( ( response ) => {
        const dashboard_cookie = response.headers[ "set-cookie" ][ 0 ].split( ";" )[ 0 ].split( "=" )[ 1 ]
        const cookie = new tough.Cookie( {
          key: "JSESSIONID",
          value: dashboard_cookie,
          domain,
          httpOnly: true
        } )
        cookiejar.setCookie( cookie.toString(), browser.config.dashboard.host )
        browser.setCookies( { name: "JSESSIONID", value: dashboard_cookie, domain, httpOnly: true } )
      } )
  } )
}

function deleteMerchantAndTwilioAccount() {
  deleteMerchants( )
  deleteTwilioAccounts( )
}

function deleteMerchants( ) {
  browser.call( async () => {
    const regex = "Test Automation\\d{8}"
    const merchants = await rp( {
      method: "GET",
      url: `${ browser.config.admin.host }/merchants`,
      headers: {
        accept: "application/json"
      },
      qs: {
        q: "Test Automation"
      },
      jar: cookiejar
    } )
    for( const merchant of merchants ) {
      if( merchant.name == "Test Automation" || merchant.name.match( regex ) ) {
        console.log( merchant )
        await rp( {
          method: "DELETE",
          url: `${ browser.config.admin.host }/merchants/${ merchant.id }`,
          headers: {
            accept: "application/json"
          },
          jar: cookiejar
        } )
      }
    }
  } )
}

function deleteTwilioAccounts( ) {
  browser.call( () => {
    return rp( {
      auth: {
        user: browser.config.dashboard.accounts.twilio.SID,
        pass: browser.config.dashboard.accounts.twilio.auth_token
      },
      method: "GET",
      url: "https://api.twilio.com/2010-04-01/Accounts.json",
      headers: {
        accept: "application/json"
      },
      qs: {
        PageSize: "50"
      }
    } ).then( ( response ) => {
      for( const account of response.accounts ) {
        if( ( account.friendly_name ).includes( browser.config.dashboard.accounts.all_products.merchant_name ) && ( account.status == "active" ) ) {
          return rp( {
            auth: {
              user: account.sid,
              pass: account.auth_token
            },
            method: "POST",
            url: `https://api.twilio.com/2010-04-01/Accounts/${ account.sid }.json`,
            headers: {
              accept: "application/json"
            },
            form: {
              Status: "closed"
            }
          } )
        }
      }
    } )
  } )
}

function getIntercomUsers( page ) {
  return rp( {
    auth: {
      bearer: browser.config.dashboard.accounts.intercom.bearer
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
  browser.call( () => {
    return rp( {
      auth: {
        bearer: browser.config.dashboard.accounts.intercom.bearer
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
  } )
}

function deleteIntercomUsers() {
  const users = []
  browser.call( () => {
    return getIntercomUsers( 1 )
      .then( ( response ) => {
        for( const user of response.users ) {
          if( user.name == "WDIO" ) {
            deleteIntercomUser( user.id )
          }
        }
      } )
  } )
}

module.exports = {
  login,
  createMerchantName,
  addMerchant,
  getMerchantById,
  loginDashboardAsOnelocalAdmin,
  createDashboardUser,
  createRandomUsername,
  updateDashboardUserPassword,
  cookiejar,
  loginDashboard,
  deleteMerchantAndTwilioAccount,
  deleteIntercomUsers,
  deleteTwilioAccounts,
}
