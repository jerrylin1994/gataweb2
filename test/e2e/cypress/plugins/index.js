const gmail = require( "../helpers/gmail-tester" )
const twilio = require( "../helpers/twilio-tester" )
const path = require( "path" )
const dotenv = require( "dotenv" )
const makeEmailAccount = require( "./email-account" )

module.exports = async ( on, config ) => {
  // if( process.env.CIRCLE_NODE_INDEX == 0) {
  //   config.env.TWILIO_NUMBER = "14377476336"
  // }else if (process.env.CIRCLE_NODE_INDEX == 1){
  //   config.env.TWILIO_NUMBER = "14377476234"
  // } else if (process.env.CIRCLE_NODE_INDEX == 2){
  //   config.env.TWILIO_NUMBER = "14377475747"
  // }else if (process.env.CIRCLE_NODE_INDEX == 3){
  //   config.env.TWILIO_NUMBER = "14377475919"
  // }else {
  //   config.env.TWILIO_NUMBER = "YOOOOOOOO"
  // }

  // on('before:run', (details) => {
  //   console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    switch( process.env.CIRCLE_NODE_INDEX ) {
      case "0": 
        config.env.TWILIO_NUMBER = "14377476336"
        break
      case "1": 
        config.env.TWILIO_NUMBER = "14377476234"
        break
      case "2": 
        config.env.TWILIO_NUMBER = "14377475747"
        break
      case "3":
       config.env.TWILIO_NUMBER = "14377475919"
       break
      default: 
      config.env.TWILIO_NUMBER = "14377475230"
    }
  // })l
  
  // check if email exists
  on( "task", {
    async checkEmail( { query, email_account, wait_time } ) {
      const auth = gmail.getAuth( email_account )
      return gmail.waitForEmail( query, auth, wait_time )
    },

    // check if email does not exists
    async checkEmailNotExist( { query, email_account, wait_time } ) {
      const auth = gmail.getAuth( email_account )
      return gmail.waitForEmail( query, auth, wait_time )
        .catch( ( err ) => err.toString() )
    },

    // check if text was received
    async checkTwilioText( { account_SID, to_phone_number, from_phone_number, sent_text, wait_time } ) {
      return twilio.waitForText( account_SID, process.env.TWILIO_TOKEN, to_phone_number, from_phone_number, sent_text, wait_time )
    },

    // check if text was was not received
    async checkTwilioTextNotExist( { account_SID, to_phone_number, from_phone_number, sent_text, wait_time } ) {
      return twilio.waitForText( account_SID, process.env.TWILIO_TOKEN, to_phone_number, from_phone_number, sent_text, wait_time )
        .catch( ( err ) => err.toString() )
    },

    // get attribute of element in email
    //   async getEmailElementAttribute( { email_id, email_account, element_text, element_attribute_name, element_tag } ) {
    //     const auth = gmail.getAuth( email_account )
    //     const email = await gmail.getEmailById( email_id, auth )
    //     const email_html_encoded = email.data.payload.parts[ 1 ].body.data
    //     const email_html_decoded = Buffer.from( email_html_encoded, "base64" ).toString()
    //     const dom = new JSDOM( email_html_decoded )
    //     const elements = dom.window.document.getElementsByTagName( element_tag )
    //     let element_attribute = ""
    //     for( const element of elements ) {
    //       if( element.textContent.includes( element_text ) ) {
    //         element_attribute = element.getAttribute( element_attribute_name )
    //       }
    //     }
    //     return element_attribute
    //   },

    // // get href link of 5th star in review email
    //   async getReviewEmailStarHref( { email_id, email_account } ) {
    //     const auth = gmail.getAuth( email_account )
    //     const email = await gmail.getEmailById( email_id, auth )
    //     const email_html_encoded = email.data.payload.parts[ 1 ].body.data
    //     const email_html_decoded = Buffer.from( email_html_encoded, "base64" ).toString()
    //     const dom = new JSDOM( email_html_decoded )
    //     const five_star_element_href = dom.window.document.querySelectorAll( `img[alt="Star"]` )[ 4 ].parentElement.getAttribute( "href" )
    //     return five_star_element_href
    //   }
    // } )

    // // get href link of 5th star in review email
    // on( "task", {
    //   async getEmailHtml( { email_id, email_account } ) {
    //     const auth = gmail.getAuth( email_account )
    //     const email = await gmail.getEmailById( email_id, auth )
    //     const email_html_encoded = email.data.payload.parts[ 1 ].body.data
    //     const email_html_decoded = Buffer.from( email_html_encoded, "base64" ).toString()
    //     return email_html_decoded
    //   }
    // } )

    // // verifies element with specific text is found in email
    //   async isElementPresentInEmail( { email_id, email_account, element_text } ) {
    //     const auth = gmail.getAuth( email_account )
    //     const email = await gmail.getEmailById( email_id, auth )
    //     const email_html_encoded = email.data.payload.parts[ 1 ].body.data
    //     const email_html_decoded = Buffer.from( email_html_encoded, "base64" ).toString()
    //     const dom = new JSDOM( email_html_decoded )
    //     const a_elements = dom.window.document.getElementsByTagName( "a" )
    //     for( const element of a_elements ) {
    //       if( element.text == element_text ) {
    //         return true
    //       }
    //     }
    //     return false
    //   }
    // } )

    // create user email accountt
    async createUserEmail() {
      const emailAccount = await makeEmailAccount.makeEmailAccount()
      console.log( emailAccount )
      return emailAccount
    },

    // get email html by email subject
    getLastEmail( { email_config, email_query } ) {
      return makeEmailAccount.getLastEmail( email_config, email_query )
    },

    // check if email exists
    checkEmailNotExist( { email_config, email_query } ) {
      return makeEmailAccount.getLastEmail( email_config, email_query )
        .catch( ( err ) => err.toString() )
    },

    getNodeIndex() {
      if( process.env.CIRCLE_NODE_INDEX ) {
        return process.env.CIRCLE_NODE_INDEX
      } return null
    }
  } )

  config.baseUrl.includes( "stage" ) ? dotenv.config( { path: path.join( __dirname, "../config/stg.env" ) } ) : dotenv.config( { path: path.join( __dirname, "../config/prd.env" ) } )
  config.env.INTERCOM_TOKEN = process.env.INTERCOM_TOKEN
  config.env.TWILIO_TOKEN = process.env.TWILIO_TOKEN
  config.env.DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD
  config.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  
  

  // important: return the changed config
  return config
}
