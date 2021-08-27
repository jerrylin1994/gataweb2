describe( "LocalContacts - Edit and Delete Contacts", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const user_data = require( "../../fixtures/user_data" )

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchants()
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_contacts.createLocalContactsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to edit a contact", function() {
    local_contacts.createContact( this.merchant_id, "Joe", "", dashboard.accounts.twilio.to_phone_number, false )
      .then( ( response ) => {
        const contact_id = response.body.refs.contact_ids[ 0 ]
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
      } )

    // edit contact email
    cy.contains( "button", "Edit" )
      .click()
    cy.contains( "Edit Contact Details" )
      .click()
    cy.contains( "Add Email" )
      .click()
    cy.get( "input[name=\"email\"]" )
      .type( user_data.email )
    cy.contains( "button", "Save" )
      .click()

    // assertion: should be able to see success message
    cy.contains( "Contact updated" )
      .should( "be.visible" )

    // assertion: correct email should be in the contact details
    cy.get( "div[ng-if=\"info.primary_email\"" )
      .should( "contain.text", user_data.email )
  } )

  it( "Should be able to delete multiple contacts from LocalContacts table", function() {
    local_contacts.createContact( this.merchant_id, user_data.name, "", dashboard.accounts.twilio.to_phone_number2, false )
    local_contacts.createContact( this.merchant_id, user_data.name2, user_data.email2, "", false )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

    // delete 2 contacts
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name }"]` )
      .click()
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name2 }"]` )
      .click()
    cy.contains( "button", "More" )
      .click()
    cy.contains( "Delete Contacts" )
      .click()

    // assertion: should see correct prompt in the modal
    cy.get( ".modal-content" )
      .within( () => {
        cy.contains( "2 Contacts will be removed." )
          .should( "be.visible" )
      } )
    cy.contains( "button", "Confirm" )
      .click()

    // assertion: should see success message for removing multiple contacts
    cy.contains( "2 contacts deleted" )
      .should( "be.visible" )
  } )

  it( "Should be able to delete a contact from contact details page", function() {
    local_contacts.createContact( this.merchant_id, user_data.name, "test@example.com", "", false )
      .then( ( response ) => {
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ response.body.refs.contact_ids[ 0 ] }` )
      } )

    // delete single contact
    cy.contains( "button", "Edit" )
      .click()
    cy.contains( "Delete Contact" )
      .click()
    cy.contains( "button", "Confirm" )
      .click()

    // assertion: should see success message for deleting contact
    cy.contains( "Contact deleted" )
      .should( "be.visible" )
  } )
} )
