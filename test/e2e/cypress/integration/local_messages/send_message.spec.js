describe( "LocalMessages - Send Message", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  // const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377476234" : "14377472898"
  // const merchant_name = "Test Automation Send Message"
  const createRandomText = () => {
    return `text message ${ Math.floor( Math.random() * 100000000 ) }`
  }

  // it.only("dsdsa",()=>{
  //   base.login(admin_panel,"ac")
  //   base.deleteMerchants("Test Automation Machine null Twilio")
  // })
  context( "Send new message test cases", () => {
    before( () => {
      const dashboard_username = base.createRandomUsername()
      cy.wrap( dashboard_username )
        .as( "dashboard_username" )
      base.login( admin_panel, "ac" )
      // base.deleteMerchants(merchant_name)
      // base.deleteIntercomUsers()
      const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`
          base.removeTwilioNumber( merchant_name )
          local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env("TWILIO_NUMBER") )
    } )

    beforeEach( function() {
      base.loginDashboard( this.dashboard_username )
      cy.visit( dashboard.host )
      cy.get( `a[href = "/admin/local-messages/"]` )
        .click()
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to send a new message with text only", () => {
        const sent_text = createRandomText()
        cy.contains( "New Message" )
          .click()
        cy.get( "#new-message-search-field_search" )
          .type( dashboard.accounts.twilio.to_phone_number )
        cy.get( ".ql-editor" )
          .type( sent_text )
        cy.get( ".ol-new-message__form" )
          .contains( "Send" )
          .click()
        cy.contains( "Message sent" )
          .should( "be.visible" )
            cy.task( "checkTwilioText", {
              account_SID: dashboard.accounts.twilio.SID,
              to_phone_number: dashboard.accounts.twilio.to_phone_number,
              from_phone_number: Cypress.env("TWILIO_NUMBER"),
              sent_text
            } )
              .then( ( text ) => {
                assert.isNotEmpty( text )
              } )
      } )
    } )

    Cypress.testFilter( [], () => {
      it( "Should see correct activity log for sending message to new contact", function() {
        cy.intercept( "GET", "**/actions**" )
          .as( "getContactActions" )
        const activity_date = Cypress.dayjs().format( "ddd MMM DD" )
        local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )
          .then( ( response ) => {
            cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ response.body.customer_ids[ 0 ] }` )
          } )

        // assertions: should see added to contact list via outbound sms log
        cy.contains( "Added to your contact list: Outbound SMS" )
          .should( "be.visible" )
          .parent()
          .contains( activity_date )
          .should( "be.visible" )
        // assertion: conversation started log
        cy.contains( `LocalMessages conversation started by Cypress: ${ dashboard.accounts.twilio.to_phone_number }` )
          .should( "be.visible" )
          .parent()
          .within( () => {
            cy.contains( activity_date )
              .should( "be.visible" )
            cy.contains( "a", "View" )
              .should( "be.visible" )
              .click()
          } )
        // assertion: view button should direct to localmessage conversation
        cy.get( ".conversation-title" )
          .should( "contain.text", dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
      } )
    } )
  } )

  context( "Reply to message test cases", () => {
    before( () => {
      const dashboard_username = base.createRandomUsername()
      cy.wrap( dashboard_username )
        .as( "dashboard_username" )
      base.login( admin_panel, "ac" )
      // base.deleteMerchantAndTwilioAccount()
      // base.deleteIntercomUsers()
      // base.deleteMerchants(merchant_name)
      // base.deleteTwilioAccounts(merchant_name)


            const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`
          base.removeTwilioNumber( merchant_name )
          local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env("TWILIO_NUMBER") )
          local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env("TWILIO_NUMBER") )
      // local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, phone_number )
    } )

    beforeEach( function() {
      base.loginDashboard( this.dashboard_username )
      cy.visit( `${ dashboard.host }/admin/local-messages/all` )
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to reply to a conversation", () => {
        const sent_text = createRandomText()
        cy.get( ".ol-conversation-list__list-container" )
          .contains( dashboard.accounts.twilio.to_phone_number.substring( 8, 12 ) )
          .should( "be.visible" )
        cy.get( `form[name="$ctrl.form.message"]` )
          .within( () => {
            cy.get( ".ql-editor" )
              .type( sent_text )
            cy.get( `button[type="submit"]` )
              .click()
          } )
        cy.get( ".conversation-item-group" )
          .contains( sent_text )
          .should( "be.visible" )
            cy.task( "checkTwilioText", {
              account_SID: dashboard.accounts.twilio.SID,
              to_phone_number: dashboard.accounts.twilio.to_phone_number,
              from_phone_number: Cypress.env("TWILIO_NUMBER"),
              sent_text
            } )
              .then( ( text ) => {
                assert.isNotEmpty( text )
              } )

      } )
    } )
  } )

  context( "Mobile - Send new message test case", () => {
    before( () => {
      cy.viewport( "iphone-x" )
      const dashboard_username = base.createRandomUsername()
      cy.wrap( dashboard_username )
        .as( "dashboard_username" )
      base.login( admin_panel, "ac" )
            const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`
          base.removeTwilioNumber( merchant_name )
          local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env("TWILIO_NUMBER") )
          local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env("TWILIO_NUMBER") )
    } )

    beforeEach( function() {
      base.loginDashboard( this.dashboard_username )
      cy.visit( dashboard.host )
      cy.get( ".erp-page-header-nav_toggle" )
        .click()
      cy.get( `a[href = "/admin/local-messages/"]` )
        .click()
    } )

    Cypress.testFilter( [], () => {
      it( "Mobile - Should be able to send a new message", () => {
        const sent_text = createRandomText()
        cy.contains( "New Message" )
          .click()
        // assertion: New Message modal should be visible
        cy.get( ".modal-title" )
          .should( "have.text", "New Message" )
          .and( "be.visible" )
        cy.get( "#new-message-search-field_search" )
          .type( dashboard.accounts.twilio.to_phone_number )
        cy.get( ".ql-editor" )
          .type( sent_text )
        cy.get( ".ol-new-message__form" )
          .contains( "Send" )
          .click()
        cy.contains( "Message sent" )
          .should( "be.visible" )
            cy.task( "checkTwilioText", {
              account_SID: dashboard.accounts.twilio.SID,
              to_phone_number: dashboard.accounts.twilio.to_phone_number,
              from_phone_number: Cypress.env("TWILIO_NUMBER"),
              sent_text
            } )
              .then( ( text ) => {
                assert.isNotEmpty( text )
              } )
          } )
    } )
  } )
} )
