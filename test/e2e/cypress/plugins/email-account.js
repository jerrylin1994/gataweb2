const Imap = require( "imap" )
const nodemailer = require( "nodemailer" )
const Promise = require( "bluebird" )
const simpleParser = require( "mailparser" ).simpleParser
const bluebird = require( "bluebird" )

async function makeEmailAccount() {
  const nodemailer = require( "nodemailer" )
  const test_account = await nodemailer.createTestAccount()
  const email_config = {
    user: test_account.user,
    password: test_account.pass,
    host: "imap.ethereal.email",
    port: 993,
    tls: true,
  }
  return email_config
}

async function deleteNodemailerCache() {
  delete require.cache[ require.resolve( "nodemailer" ) ]
}

async function getLastEmail( email_config, email_query ) {
  const imap = new Imap( email_config )
  bluebird.promisifyAll( imap )

//   function promiseWrapper( event, object ) {
//     return new Promise( ( resolve, reject ) => {
//       object.on( event, ( response ) => resolve( response ) )
//     } )
//   }

  function promiseWrapper2( object ) {
    return new Promise( ( resolve ) => {
        object.on( "message", async ( msg ) => {
            msg.on( "body", async ( stream ) => {
              const parsed = await simpleParser( stream )
              console.log( parsed.html )
              resolve(parsed.html)
            } )
          } )
    } )
  }

  console.log( email_config )
  imap.connect()
  await imap.onceAsync( "ready" )
  console.log( "AFTER READY" )
  await imap.openBoxAsync( "INBOX", false )
  console.log( "AFTER INBOX" )
  for( let count = 0 ; count < 15; count++ ) {
    console.log( `count ${ count }` )
    const results = await imap.searchAsync( [ "UNSEEN", [ "SUBJECT", email_query ] ] )
    if( ! results.length ) {
      console.log( "Cannot find any emails" )
    } else {
      const f = imap.fetch( results, { bodies: "", markSeen: true } )
      console.log( "after fetch" )
      const message = await promiseWrapper2(f)
      imap.end()
      return message

      //** */
      // //   const message = await promiseWrapper("message",f)
      // //   console.log(message)
      // //   message.on("body",async (stream)=>{
      // //   const parsed = await simpleParser(stream)
      // //   console.log(parsed.html);
      //   })
//** */

//** */
    //   f.on( "message", async ( msg ) => {
    //     msg.on( "body", async ( stream ) => {
    //       const parsed = await simpleParser( stream )
    //       console.log( parsed.html )
    //       return parsed.html
    //     } )
    //   } )
      //** */
    }
    await new Promise( ( resolve ) => setTimeout( resolve, 2000 ) )
  }
  imap.end()
  throw new Error( "Could not find email during wait time" )
}


module.exports = {
  makeEmailAccount,
  getLastEmail,
  deleteNodemailerCache
}
