describe( "LocalMessages - Conversation Actions", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  context( "Mute test cases", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.removeTwilioNumber( merchant_name )
      local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to receive notification for a unmuted conversation", () => {
        cy.on( "uncaught:exception", () => {
          return false
        } )
        cy.visit( `${ dashboard.host }/admin`, {
          onBeforeLoad( window ) {
            cy.stub( window, "Notification" ).as( "Notification" )
            cy.stub( window.Notification, "permission", "granted" )
          }
        } )
        // assertion added to ensure page is loaded before sending a text to merchant
        cy.contains( "Welcome To Your OneLocal Dashboard" )
          .should( "be.visible" )

        local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
        cy.get( "@Notification", { timeout: 15000 } ).should( "have.been.called" )
      } )

      it( "Should be able to mute a conversation", () => {
        cy.on( "uncaught:exception", () => {
          return false
        } )

        local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
        cy.visit( `${ dashboard.host }/admin/local-messages/all`, {
          onBeforeLoad( window ) {
            cy.stub( window.Notification, "permission", "granted" )
            cy.stub( window, "Notification" ).as( "Notification" )
          }
        } )
        cy.get( "#more-button" )
          .click()
        cy.contains( "Mute" )
          .click()
        cy.contains( "You muted this conversation" )
          .should( "be.visible" )
        cy.visit( dashboard.host )
        local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
        cy.wait( 5000 )
        cy.get( "@Notification" ).should( "have.not.been.called" )
      } )
    } )
  } )

  context( "Assign convo test case", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.removeTwilioNumber( merchant_name )
      local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    } )

    beforeEach( function() {
      base.loginDashboard( dashboard_username )
      local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number2 )
        .then( ( response ) => {
          cy.visit( `${ dashboard.host }/admin/local-messages/all/${ response.body.conversation_id }` )
        } )
    } )

    Cypress.testFilter( [], () => {
      it( "Should be able to assign a conversation", () => {
        // assertions: assigned and unassigned convo number should be correct
        cy.get( `a[href="/admin/local-messages/you"]` )
          .should( "have.text", "You" )

        // assign convo to your self
        cy.get( `a[href="/admin/local-messages/unassigned"]` )
          .should( "have.text", "Unassigned (1)" )
        cy.contains( "ol-select", "Unassigned" )
          .click()
        cy.contains( "li", "Me" )
          .click()

        // assertions: assigned and unassigned convo number should be correct
        cy.get( `a[href="/admin/local-messages/you"]` )
          .should( "have.text", "You (1)" )
        cy.get( `a[href="/admin/local-messages/unassigned"]` )
          .should( "have.text", "Unassigned" )
        // assertion: should see message for assigning convo in the convo details
        cy.contains( "You assigned this conversation to Yourself" )
          .should( "be.visible" )
      } )
    } )
  } )

  context( "Close convo test cases", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`
      base.removeTwilioNumber( merchant_name )
      local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to close a conversation", () => {
        local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number, Cypress.env( "TWILIO_NUMBER" ) )
        cy.visit( `${ dashboard.host }/admin/local-messages/all` )
        cy.get( "conversation-messages" )
          .contains( "check" )
          .click()
        cy.contains( "Closed (1)" )
          .should( "be.visible" )
          .click()
        cy.get( ".ol-conversation-list__list-container" )
          .contains( ( dashboard.accounts.twilio.to_phone_number ).substring( 8, 12 ) )
          .should( "be.visible" )
        cy.contains( "You closed this conversation" )
          .should( "be.visible" )
        cy.contains( "This conversation is Closed. Reopen to send messages." )
          .should( "be.visible" )
      } )
    } )

    Cypress.testFilter( [ ], () => {
      it( "Mobile - Should be able to close a conversation", () => {
        cy.intercept( "POST", "**/action" )
          .as( "postConvoAction" )
        local_messages.sendTwilioMessage( "Hey", dashboard.accounts.twilio.to_phone_number2, Cypress.env( "TWILIO_NUMBER" ) )
        cy.viewport( "iphone-x" )
        cy.visit( `${ dashboard.host }/admin/local-messages/all` )
        cy.contains( ( dashboard.accounts.twilio.to_phone_number2 ).substring( 8, 12 ) )
          .click()
        cy.get( "#more-button" )
          .click()
        cy.get( ".ol-popover-select-items" )
          .contains( "Close" )
          .click()
        cy.wait( "@postConvoAction" )
        cy.wait( 500 )
        cy.contains( "Closed" )
          .click()

        // assertions: should see closed convo in closed tab
        cy.get( ".ol-conversation-list__list-container" )
          .contains( ( dashboard.accounts.twilio.to_phone_number2 ).substring( 8, 12 ) )
          .should( "be.visible" )
      } )
    } )
  } )
} )
