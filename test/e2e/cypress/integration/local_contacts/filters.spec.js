describe( "LocalContacts - Filters", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )
  const name1 = "Bruce"
  const name2 = "Wayne"

  before( () => {
    base.login( admin_panel, "ac" )
    local_contacts.createLocalContactsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_contacts.createContact( merchant_id, name1, "", dashboard.accounts.twilio.to_phone_number, false )
        local_contacts.createContact( merchant_id, name2, user_data.email2, "", false )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to add new Has Phone filter", () => {
    const filter_name = "Has Phone"
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

    // create a new filter
    cy.contains( "New Filter" )
      .click()
    cy.get( "md-select[aria-label=\"Property\"]" )
      .click()
    cy.contains( "md-option", "Has Phone Number" )
      .click()
    cy.get( "md-select[aria-label=\"Value\"]" )
      .click()
    cy.contains( "Yes" )
      .click()
    cy.wait( 1000 ) // help with flake where the select menu options are visible on the new filter modal
    cy.contains( "Save Filter" )
      .click()
    cy.get( "input[ng-model=\"contact_filter.name\"]" )
      .type( filter_name )
    cy.get( ".modal-dialog" )
      .within( () => {
        cy.contains( "button", "Save" )
          .click()
      } )

    // assertion: should see success message for saving a filter
    cy.contains( "Filter has been saved" )
      .should( "be.visible" )

    // assertion: filter chip message should be correct
    cy.get( ".md-chip-content" )
      .should( "have.text", "Has Phone Number: Yes " )

    // assertions: should only see the 1 contact with a phone number
    cy.contains( "a", name1 )
      .should( "be.visible" )
    cy.contains( "a", name2 )
      .should( "not.exist" )

    // assertion: tab contact count should be correct
    cy.get( "#tab-item-0" )
      .should( "contains.text", `${ filter_name } (1)` )
  } )

  it( "Should be able to edit a filter", function() {
    const filter_name = "Has Email"
    local_contacts.createHasEmailFilter( this.merchant_id, filter_name )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

    // edit filter
    cy.contains( "md-tab-item", "All" )
      .click()
    cy.contains( filter_name )
      .click()
    cy.contains( "Edit" )
      .click()
    cy.get( "md-select[aria-label=\"Property: Has Phone Number\"]" )
      .click()
    cy.contains( "md-option", "Has Email Address" )
      .click()
    cy.get( "md-select[aria-label=\"Value\"]" )
      .click()
    cy.wait( 500 ) // added as Cypress sometimes finds Yes element detached from dom
    cy.contains( "Yes" )
      .click()
    cy.contains( "button", "Save Changes" )
      .click()

    // assertion: should see success message
    cy.contains( "Filter has been saved" )
      .should( "be.visible" )
    // assertion: filter chip message should be correct
    cy.get( ".md-chip-content" )
      .should( "have.text", "Has Email Address:  Yes " )
    // assertion: should only see contact 2
    cy.contains( "a", name2 )
      .should( "be.visible" )
    cy.contains( "a", name1 )
      .should( "not.exist" )

    // delete a filter
    cy.contains( "Edit" )
      .click()
    cy.contains( "Delete Filter" )
      .click()
    cy.contains( "button", "Confirm" )
      .click()

    // assertion: should see success message
    cy.contains( "Filter has been deleted" )
      .should( "be.visible" )
    // assertion: should see both contacts
    cy.contains( "a", name1 )
      .should( "be.visible" )
    cy.contains( "a", name2 )
      .should( "be.visible" )

    // select all filters
    cy.contains( "md-tab-item", "All" )
      .click()

    // assertion: filter should not be in filter list
    cy.contains( filter_name )
      .should( "not.exist" )
  } )
} )
