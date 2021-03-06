describe( "Admin Panel - LocalMessages", () => {
  const admin_panel = Cypress.env( "admin" )
  const local_messages = require( "../../support/local_messages" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../support/base" )
  const user_data = require( "../../fixtures/user_data" )

  context( "Enable LocalMessage Test Case", () => {
    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.addMerchant( user_data.merchant_name, user_data.email )
        .then( ( response ) => {
          cy.visit( `${ admin_panel.host }/merchants/${ response.body.id }` )
          cy.wrap( response.body.id )
            .as( "merchant_id" )
        } )
    } )

    Cypress.testFilter( [ "Smoke" ], () => {
      it( "Should be able to set LocalMessage product status to live and add a number to merchant", function() {
      // turn product status to live and add LocalMessage number
        cy.contains( "a", "LocalMessages" )
          .click()
        cy.get( "input[type=\"tel\"]" )
          .type( dashboard.accounts.twilio.phone_number )
        cy.contains( "Status" )
          .children( "select" )
          .select( "Live" )
        cy.contains( "button", "Save" )
          .click()

        // assertion: should see success message for saving a live merchant
        cy.contains( "Merchant Messenger settings have been successfully updated." )
          .should( "be.visible" )

        base.loginDashboardAsOnelocalAdmin( "ac", this.merchant_id )
        cy.visit( `${ dashboard.host }/admin/local-messages` )

        // assertion: should see New message button on the dashboard
        cy.contains( "button", "New Message" )
          .should( "be.visible" )
      } )
    } )
  } )

  context( "Monthly sms limit test case", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      local_messages.createLocalMessagesMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    } )

    Cypress.testFilter( [], () => {
      it( "Should be able to set outbound monthly sms limit", function() {
      // set monthly limit to 1 sms
        cy.visit( `${ admin_panel.host }/merchants/${ this.merchant_id }/local-messages` )
        cy.contains( "Monthly Outbound SMS Limit" )
          .find( "input" )
          .type( "1" )
        cy.contains( "button", "Save" )
          .click()
        // assertion: should see success alert for saving sms monthly limit setting
        cy.contains( "Merchant Messenger settings have been successfully updated." )
          .should( "be.visible" )
        base.loginDashboard( dashboard_username )

        // send first sms
        local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )
          .then( ( response ) => {
            cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
          } )

        // try to send a second sms
        cy.get( "form[name=\"$ctrl.form.message\"]" )
          .within( () => {
            cy.get( ".ql-editor" )
              .type( "hello" )
            cy.get( "button[type=\"submit\"]" )
              .click()
          } )
        // assertion: should see error alert message
        cy.contains( "Sorry, you have reached your outbound SMS limit (This automatically resets at the start of each month). A member of our team will reach out to you shortly." )
          .should( "be.visible" )
        // assertion: should see error message in the message input box
        cy.get( "form[name=\"$ctrl.form.message\"]" )
          .within( () => {
            cy.contains( "You have reached your Outbound SMS limit (This automatically resets at the start of each month). A member of our team will reach out to you shortly, but feel free to message us for immediate assistance! View your LocalMessages usage" )
              .should( "be.visible" )
          } )
      } )
    } )
  } )
} )
