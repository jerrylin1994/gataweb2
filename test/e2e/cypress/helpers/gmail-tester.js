/**
 * this module is used to check for the presense of a email
 * @todo be able to check more than the first email
 */

const fs = require( "fs" )
const { google } = require( "googleapis" )

function getAuth( email_account ) {
  let token_path = ""
  let content = ""
  switch( email_account ) {
    case "email1":
      token_path = `${ __dirname }/token.json`
      content = fs.readFileSync( `${ __dirname }/credentials.json` )
      break
    case "email2":
      token_path = `${ __dirname }/token2.json`
      content = fs.readFileSync( `${ __dirname }/credentials2.json` )
  }
  const credentials = JSON.parse( content )
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2( client_id, client_secret, redirect_uris[ 0 ] )
  const token = fs.readFileSync( token_path )
  oAuth2Client.setCredentials( JSON.parse( token ) )
  return oAuth2Client
}

// Get email by query and return email response if it was sent in the last minute
async function waitForEmail( query, auth, wait_time = 15 ) {
  const gmail = google.gmail( { version: "v1", auth } )
  for( let count = 0 ; count < wait_time; count++ ) {
    const gmail_list_response = await gmail.users.messages.list( { userId: "me", maxResults: 1, q: query } )
    if( gmail_list_response.data.resultSizeEstimate > 0 ) {
      const message_id = gmail_list_response[ "data" ][ "messages" ][ 0 ][ "id" ]
      const gmail_get_response = await gmail.users.messages.get( { "userId": "me", "id": message_id } )
      const index = gmail_get_response.data.payload.headers.findIndex( ( item ) => item.name == "Date" )
      const sent_date = new Date( gmail_get_response.data.payload.headers[ index ].value )
      const start_time = ( Date.now() - 60000 )
      const end_time = Date.now()
      if( sent_date.getTime() < end_time && sent_date.getTime() > start_time ) {
        return gmail_get_response
      }
    }
    await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) )
  }
  throw new Error( "Exceeded maximum wait time" )
}

async function getEmailById( email_id, auth ) {
  const gmail = google.gmail( { version: "v1", auth } )
  const gmail_get_response = await gmail.users.messages.get( { "userId": "me", "id": email_id } )
  return gmail_get_response
}

module.exports = {
  waitForEmail,
  getEmailById,
  getAuth,
}
