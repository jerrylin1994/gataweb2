describe( "LocalContacts - Duplicate Contacts", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_contacts.createLocalContactsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to add duplicate contact and see duplicate warning", function() {
    let contact_id1 = ""
    let contact_id2 = ""
    local_contacts.createContact( this.merchant_id, user_data.name, "", user_data.phone_number, false )
      .then( ( response ) => {
        contact_id1 = response.body.refs.contact_ids[ 0 ]
      } )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

    // add duplicate contact
    cy.contains( "Add Contacts" )
      .click()
    cy.contains( "Manual Entry" )
      .click()
    cy.get( "input[name=\"name\"]" )
      .type( user_data.name )
    cy.get( "input[name=\"mobile\"]" )
      .type( user_data.phone_number )
    cy.get( "button[type = \"submit\"]" )
      .click()

    // assertion: should see duplicate contact warning
    cy.contains( "1 Contact(s) already exist with this number" )
      .should( "be.visible" )
    cy.contains( " Click here to view or press Add Contact to continue." )
      .should( "be.visible" )
    cy.intercept( "POST", "**/actions" )
      .as( "createContact" )
    cy.get( "button[type = \"submit\"]" )
      .click()

    // assertion: should see success message for adding duplicate contact
    cy.contains( "Contact Created" )
      .should( "be.visible" )
    cy.get( "@createContact" )
      .then( ( xhr ) => {
        contact_id2 = xhr.response.body.refs.contact_ids[ 0 ]
        local_contacts.deleteContacts( this.merchant_id, [ contact_id2, contact_id1 ] )
      } )
  } )

  it( "Should be able to view/resolve duplicate contacts", function() {
    const name2 = "John"
    local_contacts.createContact( this.merchant_id, user_data.name, "", dashboard.accounts.twilio.to_phone_number, false )
    local_contacts.createContact( this.merchant_id, name2, "", dashboard.accounts.twilio.to_phone_number, true )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

    // assertion: error alert for duplicate contact should be visible on LocalContacts dashboard
    cy.contains( "You have 1 contact with duplicate information." )
      .should( "be.visible" )
    cy.contains( "Click here to view/resolve" )
      .click()

    // assertion: duplicate contacts modal should be visible and have correct information
    cy.get( ".duplicate-contacts-modal" )
      .should( "be.visible" )

    cy.contains( `${ dashboard.accounts.twilio.to_phone_number }` )
      .should( "be.visible" )
      .siblings( "td" )
      .eq( 0 )
      .should( "have.text", "2" )

    // view duplicate contacts
    cy.contains( "button", "View" )
      .click()

    // assertions: search field should have correct number and contacts table should show duplicate contacts
    cy.get( "#_search" )
      .invoke( "val" )
      .should( "equal", `${ dashboard.accounts.twilio.to_phone_number }` )
    cy.get( "table" )
      .within( () => {
        cy.contains( user_data.name )
          .should( "be.visible" )
        cy.contains( name2 )
          .should( "be.visible" )
      } )

    // dismiss duplicate
    cy.contains( "Click here to view/resolve" )
      .click()
    cy.contains( "button", "Dismiss" )
      .click()
    cy.contains( "button", "Close" )
      .click()

    // assertion: duplicate contact error alert should not exist
    cy.contains( "You have 2 contacts with duplicate information." )
      .should( "not.be.exist" )
  } )
} )
