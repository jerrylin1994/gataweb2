describe( "LocalContacts - Custom Contact Fields", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )

  beforeEach( () => {
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_contacts.createLocalContactsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to add/edit/delete a contact field", () => {
    const custom_field = "Mandatory Custom Field"
    const custom_field_edited = "Mandatory Custom Field - edited"
    cy.visit( `${ dashboard.host }/admin/settings` )
    cy.contains( "Contact Fields" )
      .click()

    // create custom contact field
    cy.contains( "button", "Create Contact Field" )
      .click()
    cy.get( "input[name=\"contact_field_name\"]" )
      .type( custom_field )
    cy.get( "md-checkbox[name=\"required\"]" )
      .click()
    cy.contains( "button", "Save" )
      .click()

    // assertions: should see success message and custom contact field in the table
    cy.contains( "Contact Field Created" )
      .should( "be.visible" )
    cy.contains( custom_field )
      .should( "be.visible" )

    // edit custom contact field
    cy.get( "img[ng-click=\"openCreateOrEditContactFieldModal( field )\"]" )
      .click()
    cy.get( "input[name=\"contact_field_name\"]" )
      .clear()
      .type( custom_field_edited )
    cy.contains( "button", "Save" )
      .click()

    // assertions: should see success message and edited contact field in the table
    cy.contains( "Contact Field Updated" )
      .should( "be.visible" )
    cy.contains( custom_field_edited )
      .should( "be.visible" )

    // delete custom contact field
    cy.get( "img[ng-click=\"openRemoveContactFieldModal( field )\"]" )
      .click()
    cy.get( "input[name=\"contact_field_name\"]" )
      .type( custom_field_edited )
    cy.contains( "button", "Delete" )
      .click()

    // assertion: should see success message for contact field deleted
    cy.contains( "Contact Field Deleted" )
      .should( "be.visible" )
    // assertions: should not see deleted custom contact field
    cy.contains( "No Contact Fields" )
      .should( "be.visible" )
    cy.contains( custom_field_edited )
      .should( "not.exist" )
  } )

  it( "Should see custom contact field when adding a new contact", function() {
    const custom_field = "Mandatory Contact Field"
    const custom_field_value = "Toronto"
    local_contacts.createCustomContactField( this.merchant_id, custom_field )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
    cy.contains( "Add Contacts" )
      .click()
    cy.contains( "Manual Entry" )
      .click()

    // assertion: should see contact field in the new contact modal
    cy.get( `label[for^="${ custom_field }"]` )
      .should( "have.text", custom_field )
      .siblings( "input" )
      .type( custom_field_value )
    cy.get( "input[name=\"name\"]" )
      .type( user_data.name )
    cy.get( "input[name=\"mobile\"]" )
      .type( user_data.phone_number )
    cy.get( "button[type = \"submit\"]" )
      .click()
    cy.contains( "Contact Created" )
      .should( "be.visible" )

    // assertion: contact detail page should have added contact field
    cy.get( "div[ng-repeat=\"field in contact_fields.fields\"]" )
      .should( "contain.text", custom_field )
      .and( "contain.text", custom_field_value )
  } )
} )
