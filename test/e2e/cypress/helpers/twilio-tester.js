async function getRecentText( account_SID, auth_token, to_phone_number, from_phone_number ) {
  const client = require( "twilio" )( account_SID, auth_token )
  const response = await client.messages
    .list( {
      from: from_phone_number,
      to: to_phone_number,
      limit: 1
    } )
  return ( response[ 0 ].body )
}

async function waitForText( account_SID, auth_token, to_phone_number, from_phone_number, sent_text, wait_time = 10 ) {
  for( let count = 0; count < wait_time; count++ ) {
    const response_text = await getRecentText( account_SID, auth_token, to_phone_number, from_phone_number )
    if( response_text.includes( sent_text ) ) {
      return response_text
    }
    await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) )
  }
  throw new Error( "Exceeded maximum wait time" )
}

module.exports = {
  waitForText,
}
