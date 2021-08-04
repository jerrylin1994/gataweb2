describe( "LocalMessages - Templates and Notes", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_messages.createLocalMessagesMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to create, edit, and delete a message template", function() {
    const template_name = "template #1"
    const template_name_edited = "template #1 - edited"
    const template_message = "This is template message from"
    const template_message_edited = "This is template message from - edited"
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )
      .then( ( response ) => {
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
      } )

    // create message template
    cy.get( `md-icon[ol-tooltip-text="Insert a message template"]` )
      .click()
    cy.contains( "+ Create Message Template" )
      .click()
    // assertion: modal title should be create message template modal
    cy.get( ".modal-title" )
      .should( "have.text", "Create Message Template" )
      .and( "be.visible" )
    cy.get( "#message-template-name-input" )
      .type( template_name )
    cy.get( "#message-template-text" )
      .type( template_message )
    cy.get( `md-select[aria-label="Insert Dynamic Tag"]` )
      .click()
    cy.contains( "[Employee Full Name]" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.get( ".modal-backdrop" ) // added due to flake where sometimes the next clear command would not actually clear the message input
      .should( "be.visible" )
    cy.get( ".modal-backdrop" ) // added due to flake where sometimes the next clear command would not actually clear the message input
      .should( "not.exist" )
    // assertion: message input box should contain added template
    cy.get( `form[name="$ctrl.form.message"]` )
      .within( () => {
        cy.get( ".ql-editor" )
          .should( "have.text", `${ template_message }Cypress` )
          .clear()
      } )

    // insert template
    cy.get( `md-icon[ol-tooltip-text="Insert a message template"]` )
      .click()
    cy.get( "ol-message-template-picker" )
      .contains( template_name )
      .click()
    // assertion: message input box should contain added template
    cy.get( `form[name="$ctrl.form.message"]` )
      .within( () => {
        cy.get( ".ql-editor" )
          .should( "have.text", `${ template_message }Cypress` )
          .clear()
      } )

    // view message template modal
    cy.get( `md-icon[ol-tooltip-text="Insert a message template"]` )
      .click()
    cy.contains( "Manage" )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Message Templates" )
      .and( "be.visible" )
    cy.contains( template_name )
      .click()
    // assertion: message template modal should contain the added template message
    cy.get( ".message-template-text" )
      .should( "have.text", `${ template_message }Cypress` )
      .and( "be.visible" )

    // edit template
    cy.contains( "button", "Edit" )
      .click()
    cy.get( "#message-template-name-input" )
      .clear()
      .type( template_name_edited )
    cy.get( "#message-template-text" )
      .clear()
      .type( template_message_edited )
    cy.contains( "button", "Save" )
      .click()
    // assertions: should see edited template name and message in message template modal
    cy.get( ".message-template-name" )
      .should( "have.text", template_name_edited )
      .and( "be.visible" )
    cy.get( ".message-template-text" )
      .should( "have.text", template_message_edited )
      .and( "be.visible" )

    // insert template from message template modal
    cy.contains( "button", "Insert" )
      .click()
    // assertion: should see edited template message in convo input box
    cy.get( `form[name="$ctrl.form.message"]` )
      .within( () => {
        cy.get( ".ql-editor" )
          .should( "have.text", template_message_edited )
      } )

    // delete a template
    cy.get( `md-icon[ol-tooltip-text="Insert a message template"]` )
      .click()
    cy.contains( "Manage" )
      .click()
    cy.contains( template_name_edited )
      .click()
    cy.contains( "button", "Remove" )
      .click()
    cy.contains( "button", "Yes" )
      .click()
    // assertion: should not see deleted template
    cy.get( ".message-templates-items" )
      .within( () => {
        cy.contains( "Followup SMS" )
          .should( "be.visible" )
        cy.contains( template_name_edited )
          .should( "not.exist" )
      } )
  } )

  it( "Should be able to add an internal note to a conversation", function() {
    const note = "This is a note"
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number2 )
      .then( ( response ) => {
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
      } )

    // add a note
    cy.contains( "Internal Note" )
      .click()
    cy.get( `div[data-placeholder="Type your note, only you and your teammates will see it."]` )
      .type( note )
    cy.contains( "button", "Add Note" )
      .click()
    // assertion: should see added note in the conversation
    cy.get( ".conversation-items" )
      .within( () => {
        cy.contains( note )
          .should( "be.visible" )
        cy.contains( "Cypress- Internal Note" )
          .should( "be.visible" )
      } )
  } )
} )
