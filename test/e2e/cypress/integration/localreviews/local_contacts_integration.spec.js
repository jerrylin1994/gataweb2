describe( "LocalReviews - LocalContacts Integration", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const local_contacts = require( "../../support/local_contacts" )

  if( Cypress.config( "baseUrl" ) == "https://stage.onelocal.com" ) {
    context( "Bulk review request test cases", () => {
      const merchant_name = base.createMerchantName()
      const dashboard_username = base.createRandomUsername()
      before( () => {
        base.login( admin_panel, "ac" )
        base.deleteMerchantAndTwilioAccount()
        base.deleteIntercomUsers()
        local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      } )

      beforeEach( () => {
        base.loginDashboard( dashboard_username )
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
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
          from_phone_number: dashboard.accounts.twilio.phone_number,
          sent_text
        } )
          .then( ( text ) => {
            assert.isNotNull( text )
          } )
        // assertion: Contact 2 should receive request
        cy.task( "checkTwilioText", {
          account_SID: dashboard.accounts.twilio.SID,
          to_phone_number: contacts[ 1 ].phone_number,
          from_phone_number: dashboard.accounts.twilio.phone_number,
          sent_text: sent_text2
        } )
          .then( ( text ) => {
            assert.isNotNull( text )
          } )
      } )

      it( "Should be able to send and receive bulk email review requests", function() {
        const contacts = [
          {
            name: "Bob3",
            email: user_data.email
          },
          {
            name: "Bob4",
            email: user_data.email2
          },
        ]
        local_contacts.createContact( this.merchant_id, contacts[ 0 ].name, contacts[ 0 ].email, "", false )
        local_contacts.createContact( this.merchant_id, contacts[ 1 ].name, contacts[ 1 ].email, "", false )
        const email_query = `Thanks for choosing ${ merchant_name } from: noreply@quick-feedback.co`
        // select 2 contacts and send email review request
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
        cy.get( "md-select[name=\"priority\"]" )
          .click()
        cy.contains( "Email Preferred" )
          .click()
        cy.contains( "button", "Send" )
          .click()

        // assertion: Should see success message
        cy.contains( "Feedback requests were successfully sent" )
          .should( "be.visible" )
        // assertion: Contact 2 should receive request
        cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
          .then( ( email ) => {
            assert.isNotEmpty( email )
          } )
        // assertion: Contact 2 should receive request
        cy.task( "checkEmail", { query: email_query, email_account: "email2" } )
          .then( ( email ) => {
            assert.isNotEmpty( email )
          } )
      } )
    } )
  }

  context( "Single contact review request test case", () => {
    const merchant_name = base.createMerchantName()
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_contacts.createContact( merchant_id, user_data.name, user_data.email, dashboard.accounts.twilio.to_phone_number, false )
        } )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
      cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
    } )

    it( "Should be able to send single request from LocalContacts dashboard", () => {
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
      cy.task( "checkEmail", { query: `Thanks for choosing ${ merchant_name } from: noreply@quick-feedback.co`, email_account: "email1" } )
        .then( ( email ) => assert.isNotEmpty( email ) )
    } )
  } )
} )
