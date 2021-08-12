// cypress/plugins/email-account.js
const imaps = require( "imap-simple" )
const simpleParser = require( "mailparser" ).simpleParser
async function makeEmailAccount () {
  const nodemailer = require( "nodemailer" )
  delete require.cache[require.resolve('nodemailer')];
  const testAccount = await nodemailer.createTestAccount()

  const email_config = {
    imap: {
      user: testAccount.user,
      password: testAccount.pass,
      host: "imap.ethereal.email",
      port: 993,
      tls: true,
      authTimeout: 10000,
    },
  }
  return email_config
}

async function getLastEmail( emailConfig, email_query ) {
  // makes debugging very simple
  console.log( "getting the last email" )
  console.log( emailConfig )

  try {
    const connection = await imaps.connect( emailConfig )

    // grab up to 50 emails from the inbox
    await connection.openBox( "INBOX" )
    const searchCriteria = [ "UNSEEN",[ "SUBJECT", email_query ] ]
    const fetchOptions = {
      bodies: [ "" ],
    }
    const messages = await connection.search( searchCriteria, fetchOptions )
    // and close the connection to avoid it hanging
    connection.end()

    if( ! messages.length ) {
      console.log( "cannot find any emails" )
      return null
    }
    console.log( "there are %d messages", messages.length )
    // grab the last email
    const mail = await simpleParser(
      messages[ messages.length - 1 ].parts[ 0 ].body,
    )

    // and returns the main fields
    return {
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }
  } catch( e ) {
    console.error( e )
    return null
  }
}

module.exports = {
  makeEmailAccount,
  getLastEmail }
