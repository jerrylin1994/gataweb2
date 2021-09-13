describe( "LocalReviews - LocalContacts Integration", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const local_contacts = require( "../../support/local_contacts" )
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  if( Cypress.config( "baseUrl" ) == "https://stage.onelocal.com" ) {
    context( "Bulk review request test cases", () => {
      const dashboard_username = base.createRandomUsername()
      before( () => {
        base.login( admin_panel, "ac" )
        base.removeTwilioNumber( merchant_name )
        local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            base.addTwilioNumber( merchant_id, Cypress.env( "TWILIO_NUMBER" ) )
          } )
      } )

      beforeEach( () => {
        base.loginDashboard( dashboard_username )
        cy.intercept( "POST", "**/contacts_bulk_action" ).as( "bulk_action" )
      } )

      it( "Should be able to send and recieve bulk sms review requests", function() {
        const contacts = [
          {
            name: "Bob1",
            phone_number: dashboard.accounts.twilio.to_phone_number
          },
          {
            name: "Bob2",
            phone_number: dashboard.accounts.twilio.to_phone_number2
          },
        ]
        local_contacts.createContact( this.merchant_id, contacts[ 0 ].name, "", contacts[ 0 ].phone_number, false )
        local_contacts.createContact( this.merchant_id, contacts[ 1 ].name, "", contacts[ 1 ].phone_number, false )
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
        const sent_text = `Hi ${ contacts[ 0 ].name }, Thanks for choosing ${ merchant_name }`
        const sent_text2 = `Hi ${ contacts[ 1 ].name }, Thanks for choosing ${ merchant_name }`

        // select 2 contacts and send sms review request
        cy.get( `md-checkbox[aria-label="Select ${ contacts[ 0 ].name }"]` )
          .click()
        cy.get( `md-checkbox[aria-label="Select ${ contacts[ 1 ].name }"]` )
          .click()
        cy.contains( "Request Feedback" )
          .click()
        base.getDashboardSession().then( ( response ) => {
          if( ! ( "has_agreed_review_edge_tou" in response.body ) ) {
            cy.get( ".modal-content" )
              .find( ".md-container" )
              .click()
          }
        } )
        cy.contains( "button", "Send" )
          .click()

        // assertion: Should see success message
        cy.contains( "Feedback requests were successfully sent" )
          .should( "be.visible" )
        // assertion: Contact 1 should receive request
        cy.task( "checkTwilioText", {
          account_SID: dashboard.accounts.twilio.SID,
          to_phone_number: contacts[ 0 ].phone_number,
          from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
          sent_text
        } )
          .then( ( text ) => {
            assert.isNotNull( text )
          } )
        // assertion: Contact 2 should receive request
        cy.task( "checkTwilioText", {
          account_SID: dashboard.accounts.twilio.SID,
          to_phone_number: contacts[ 1 ].phone_number,
          from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
          sent_text: sent_text2
        } )
          .then( ( text ) => {
            assert.isNotNull( text )
          } )
      } )

      it.only( "Should be able to send and receive bulk email review requests", function() {
        const email_query = `Thanks for choosing ${ merchant_name }`
        const contact_names = [ "Bill", "Bob" ]
        base.createUserEmail()
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            const email2 = `${ email_config.imap.user.slice( 0, email_config.imap.user.indexOf( "@" ) ) }+1${ email_config.imap.user.slice( email_config.imap.user.indexOf( "@" ) ) }`
            local_contacts.createContact( this.merchant_id, contact_names[ 0 ], email_config.imap.user, "", false )
            local_contacts.createContact( this.merchant_id, contact_names[ 1 ], email2, "", true )
          } )
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
        // select 2 contacts and send email review request
        cy.get( `md-checkbox[aria-label="Select ${ contact_names[ 0 ] }"]` )
          .click()
        cy.get( `md-checkbox[aria-label="Select ${ contact_names[ 1 ] }"]` )
          .click()
        cy.contains( "Request Feedback" )
          .click()
        base.getDashboardSession().then( ( response ) => {
          if( ! ( "has_agreed_review_edge_tou" in response.body ) ) {
            cy.get( ".modal-content" )
              .find( ".md-container" )
              .click()
          }
        } )
        cy.get( "md-select[name=\"priority\"]" )
          .click()
        cy.contains( "Email Preferred" )
          .click()
        cy.wait(3000)
        cy.contains( "button", "Send" )
          .click()

        // assertion: Should see success message
        cy.contains( "Feedback requests were successfully sent" )
          .should( "be.visible" )
        // assertions: both contacts should receive request
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.task( "getLastEmail", { email_config, email_query } )
            cy.task( "getLastEmail", { email_config, email_query } )
          } )
      } )
    } )
  }

  context( "Single contact review request test case", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
    } )

    it( "Should be able to send single request from LocalContacts dashboard", function() {
      const email_query = `Thanks for choosing ${ merchant_name }`
      base.createUserEmail()
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_contacts.createContact( merchant_id, user_data.name, this.email_config.imap.user, dashboard.accounts.twilio.to_phone_number, false )
        } )
      cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
      cy.get( `md-checkbox[aria-label="Select ${ user_data.name }"]` )
        .click()
      cy.contains( "Request Feedback" )
        .click()
      base.getDashboardSession().then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) {
          cy.get( ".modal-content" )
            .find( ".md-container" )
            .click()
        }
      } )
      cy.get( "md-select[name=\"priority\"]" )
        .click()
      cy.contains( "Email Preferred" )
        .click()
      cy.get( ".send-review-requests-modal" )
        .find( "button" )
        .contains( "Send" )
        .click()
      cy.contains( "Feedback request were successfully sent" )
        .should( "be.visible" )

      // assertion: contact should receive review request
      cy.get( "@email_config" )
        .then( ( email_config ) => {
          cy.task( "getLastEmail", { email_config, email_query } )
        } )
    } )
  } )
} )
