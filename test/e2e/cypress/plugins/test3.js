const Imap = require( "imap" )
const simpleParser = require( "mailparser" ).simpleParser
async function makeEmailAccount() {
  const nodemailer = require( "nodemailer" )
  const test_account = await nodemailer.createTestAccount()
  const email_config = {
    user: test_account.user,
    password: test_account.pass,
    host: "imap.ethereal.email",
    port: 993,
    tls: true,
    authTimeout: 10000,
  }
  return email_config
}

async function deleteNodemailerCache() {
  delete require.cache[ require.resolve( "nodemailer" ) ]
}

async function getLastEmail( email_config, email_query ) {
  console.log( "#$#$@#$@*#$@(#$@*#$@(#$*#$@()$#" )
  const imap = new Imap( email_config )
  console.log( "ERWIWEIEROEWRWEQO" )
  console.log( email_config )
  // console.log(imap)
  imap.connect()
  imap.once( "ready", () => {
    console.log( "AFTER READY" )
    imap.openBox( "INBOX", false, () => {
      console.log( "AFTER INBOX" )
      imap.search( [ "UNSEEN", [ "SUBJECT", email_query ] ], ( err, results ) => {
        console.log( "%$$%$%#$%$#%#$%$#%#$%#$%" )
        // console.log(results)
        console.log( "#$$##@$#@$#$@#$$#@" )
        const f = imap.fetch( results, { bodies: "" } )
        f.on( "message", async ( msg ) => {
          console.log( "MSGMSGMSGMSGMSG" )
          console.log( msg )
          console.log( "MSGMSGMSGMSGMSG" )
          // var mail = await simpleParser(
          //         msg[ msg.length - 1 ].parts[ 0 ].body
          //       )


          //       console.log(mail.html)
          msg.on( "body", ( stream ) => {
            console.log( "STREAMSTREAMSTREAM" )
            console.log( stream )
            console.log( "STREAMSTREAMSTREAM" )
          } )
        } )
      } )


      // console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      // console.log("before connect")
      // console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      // const connection = await imaps.connect( email_config )
      // console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      // console.log("after connect")
      // console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      // await connection.openBox( "INBOX" )
      // const search_criteria = [ "UNSEEN", [ "SUBJECT", email_query ] ]
      // const fetch_options = {
      //   bodies: [ "" ],
      // }
      // for( let count = 0 ; count < 15; count++ ) {
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   console.log(count)
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   console.log("before search")
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   const messages = await connection.search( search_criteria, fetch_options )
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   console.log("after search")
      //   console.log("&^$^%$^%$%^$&$%^^%$^$^&%$%^$^$%")
      //   if( ! messages.length ) {
      //     console.log( "Cannot find any emails" )
      //   } else {
      //     // grab the last email
      //     const mail = await simpleParser(
      //       messages[ messages.length - 1 ].parts[ 0 ].body
      //     )
      //     await connection.addFlags( messages[ 0 ].attributes.uid, "\Seen" )
      //     connection.end()
      //     return mail.html
      //   }
      //   await new Promise( ( resolve ) => setTimeout( resolve, 800 ) )
      // }
      // connection.end()
      // throw new Error( "Could not find email during wait time" )
    } )
  } )
  return "yo"
}
module.exports = {
  makeEmailAccount,
  getLastEmail,
  deleteNodemailerCache
}

