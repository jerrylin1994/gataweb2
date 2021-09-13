const imaps = require( "imap-simple" )
const simpleParser = require( "mailparser" ).simpleParser
async function makeEmailAccount() {
  const nodemailer = require( "nodemailer" )
  const test_account = await nodemailer.createTestAccount()
  const email_config = {
    imap: {
      user: test_account.user,
      password: test_account.pass,
      host: "imap.ethereal.email",
      port: 993,
      tls: true,
      authTimeout: 10000,
    },
  }
  return email_config
}

async function getLastEmail( email_config, email_query ) {
  console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
  console.log("before connect")
  console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
  const connection = await imaps.connect( email_config )
  console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
  console.log("after connect")
  console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
  await connection.openBox( "INBOX" )
  const search_criteria = [ "UNSEEN", [ "SUBJECT", email_query ] ]
  const fetch_options = {
    bodies: [ "" ],
  }
  for( let count = 0 ; count < 15; count++ ) {
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    console.log(count)
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    console.log("before search")
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    const messages = await connection.search( search_criteria, fetch_options )
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    console.log("after search")
    console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
    if( ! messages.length ) {
      console.log( "Cannot find any emails" )
    } else {
      // grab the last email
      const mail = await simpleParser(
        messages[ messages.length - 1 ].parts[ 0 ].body
      )
      await connection.addFlags( messages[ 0 ].attributes.uid, "\Seen" )
      connection.end()
      return mail.html
    }
    await new Promise( ( resolve ) => setTimeout( resolve, 800 ) )
  }
  connection.end()
  throw new Error( "Could not find email during wait time" )
}

module.exports = {
  makeEmailAccount,
  getLastEmail
}
