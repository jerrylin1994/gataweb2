describe( "LocalMessages - Tags", () => {
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

  it( "Should be able to create, edit, and delete a tag from settings page", () => {
    const tag_name = "tag1"
    const tag_name_edited = "tag2"
    const tag_color = "#a4cf30"
    const tag_color_edited = "#fd9a00"
    cy.visit( `${ dashboard.host }/admin/settings/local-messages` )
    cy.contains( "Tags" )
      .click()

    // add a new tag
    cy.contains( "Create Tag" )
      .click()
    cy.get( `input[name="name"]` )
      .type( tag_name )
    cy.get( `md-select[name="color"]` )
      .click()
    cy.get( `md-option[value="${ tag_color }"]` )
      .click()
    cy.contains( "button", "Save" )
      .click()
    // assertion: should see success message for adding a tag
    cy.contains( "Conversation Tag Created" )
      .should( "be.visible" )
    // should see added tag in tag list
    cy.get( `ol-tag[ol-color="${ tag_color }"]` )
      .should( "contain.text", tag_name )

    // edit tag
    cy.get( `img[ng-click="openCreateOrEditConversationTagModal( tag )"]` )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Edit Conversation Tag" )
    cy.get( `input[name="name"]` )
      .clear()
      .type( tag_name_edited )
    cy.get( `md-select[name="color"]` )
      .click()
    cy.get( `md-option[value="${ tag_color_edited }"]` )
      .click()
    cy.contains( "button", "Save" )
      .click()
    // assertion: should see success message for editing a tag
    cy.contains( "Conversation Tag Updated" )
      .should( "be.visible" )
    // should see edited tag in tag list
    cy.get( `ol-tag[ol-color="${ tag_color_edited }"]` )
      .should( "contain.text", tag_name_edited )

    // delete a tag
    cy.get( `img[ng-click="openRemoveConversationTagModal( tag )"]` )
      .click()
    // assertions: delete tag modal should have correct info
    cy.get( ".modal-title" )
      .should( "have.text", "Confirmation" )
    cy.get( ".modal-body" )
      .should( "have.text", "Are you sure you want to delete this conversation tag?" )
    cy.contains( "button", "Yes" )
      .click()
    // assertion: should see success message for deleting a tag
    cy.contains( "Conversation Tag Deleted" )
      .should( "be.visible" )
    // assertion: should see message indicating there are no tags
    cy.contains( "No Conversation Tags" )
      .should( "be.visible" )
  } )

  it( "Should be able to create, add, and remove a tag in a conversation", function() {
    const tag_color = "#e362e3"
    const tag_name = "tag3"
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )
      .then( ( response ) => {
        cy.visit( `${ dashboard.host }/admin/local-messages/unassigned/${ response.body.conversation_id }` )
      } )

    // create a tag
    cy.contains( "button", "Add Tag" )
      .click()
    cy.contains( "Manage Tags" )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Conversation Tags" )
    cy.contains( "button", "Create Tag" )
      .click()
    cy.get( `input[name="name"]` )
      .type( tag_name )
    cy.get( `md-select[name="color"]` )
      .click()
    cy.get( `md-option[value="${ tag_color }"]` )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.intercept( "GET", "**/tags" )
      .as( "getTags" )
    cy.wait( "@getTags" )
    cy.wait( 500 ) // allow the dashboard to update with new tag

    // add tag to conversation
    cy.contains( "button", "Add Tag" )
      .click()
    // assertion: should see tag in add tag conversation container
    cy.contains( tag_name )
      .should( "be.visible" )
      .click()
    // assertion: should see correct tag added message in convo
    cy.contains( `You added the tag "${ tag_name }" to this conversation` )
      .should( "be.visible" )
    // assertion: should see tag in conversation tags section
    cy.contains( "Conversation Tags" )
      .parent( ".conversation-details__section" )
      .within( () => {
        cy.contains( tag_name )
          .should( "be.visible" )
        // remove tag from convo
        cy.get( ".ol-tag__remove" )
          .click()
        // assertion: should not see tag in conversation tags section
        cy.contains( tag_name )
          .should( "not.exist" )
      } )
    // assertion should see removed tag from convo message
    cy.contains( `You removed the tag "${ tag_name }" from this conversation` )
      .should( "be.visible" )

    // view the manage tag modal
    cy.contains( "button", "Add Tag" )
      .click()
    cy.contains( "Manage Tags" )
      .click()
    // assertion: should see created tag in conversation tags modal
    cy.get( ".modal-body" )
      .get( `ol-tag[ol-color="${ tag_color }"]` )
      .should( "contain.text", tag_name )
  } )
} )
