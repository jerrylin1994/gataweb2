// this module is used to create an token
const { google } = require( "googleapis" )
const fs = require( "fs" )
const readline = require( "readline" )
const token_path = `${ __dirname }/token.json`
const token_path2 = `${ __dirname }/token2.json`
const SCOPES = [ "https://www.googleapis.com/auth/gmail.readonly" ]
let content
function authorize() {
  if( fs.existsSync( `${ __dirname }/token.json` ) ) {
    content = fs.readFileSync( `${ __dirname }/credentials2.json` )
  } else {
    content = fs.readFileSync( `${ __dirname }/credentials.json` )
  }
  const credentials = JSON.parse( content )
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2( client_id, client_secret, redirect_uris[ 0 ] )
  getNewToken( oAuth2Client )
}

function getNewToken( oAuth2Client ) {
  const authUrl = oAuth2Client.generateAuthUrl( {
    access_type: "offline",
    scope: SCOPES,
  } )
  console.log( "Authorize this app by visiting this url:", authUrl )
  const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
  } )
  rl.question( "Enter the code from that page here: ", ( code ) => {
    rl.close()
    oAuth2Client.getToken( code, ( err, token ) => {
      if( err ) { return console.error( "Error retrieving access token", err ) }
      oAuth2Client.setCredentials( token )
      // Store the token to disk for later program executions
      if( fs.existsSync( `${ __dirname }/token.json` ) ) {
        fs.writeFile( token_path2, JSON.stringify( token ), ( err ) => {
          if( err ) { return console.error( err ) }
          console.log( "Token stored to", token_path2 )
        } )
      } else {
        fs.writeFile( token_path, JSON.stringify( token ), ( err ) => {
          if( err ) { return console.error( err ) }
          console.log( "Token stored to", token_path )
        } )
      }
    } )
  } )
  if( fs.existsSync( `${ __dirname }/token.json` ) ) {

  }
}

authorize()
