describe( "LocalContacts - Notes", () => {
  const base = require( "../../support/base" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const user_data = require( "../../fixtures/user_data" )
  const note = "This is a new note"

  before( () => {
    base.login( admin_panel, "ac" )
    local_contacts.createLocalContactsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_contacts.createContact( merchant_id, user_data.name, "", dashboard.accounts.twilio.to_phone_number, false )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
  } )

  it( "Should be able to log a note from contact and view all notes in activity timeline", () => {
    cy.intercept( "GET", "**/actions**" )
      .as( "getNotes" )
    cy.contains( user_data.name )
      .click()

    // log a note from contact details page
    cy.contains( "Click to log a note" )
      .click()

    // assertion: new note modal should be visible
    cy.get( "form[name= \"form.create_note\"]" )
      .should( "be.visible" )

    cy.get( "textarea[placeholder=\"Enter your note here\"]" )
      .type( note )
    cy.contains( "button", "Log Note" )
      .click()

    // assertion: should see success message for logging a note
    cy.contains( "Logged note for 1 contact" )
      .should( "be.visible" )

    // assertion: Should see logged note in contact details and correct time
    cy.get( ".contacthub-stats-section" )
      .within( () => {
        cy.contains( base.getTodayDate() )
          .should( "be.visible" )
        cy.contains( note )
          .should( "be.visible" )
      } )

    cy.contains( "View All Notes" )
      .click()
    cy.wait( "@getNotes" )

    // assertion: Filter should be notes
    cy.get( ".ol-filter-dropdown-value" )
      .should( "contain.text", "Notes" )

    // assertion: logged see logged note in activity timeline
    cy.get( ".contacthub-timeline" )
      .within( () => {
        cy.contains( note )
          .should( "be.visible" )
      } )
  } )

  it( "Should be able to log a note from LocalContacts table", () => {
    // log a note from contacts table
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name }"]` )
      .click()
    cy.contains( "button", "More" )
      .click()
    cy.contains( "Log Note" )
      .click()
    cy.get( "textarea[placeholder=\"Enter your note here\"]" )
      .type( note )
    cy.contains( "button", "Log Note" )
      .click()

    // assertion: should see success message
    cy.contains( "Logged note for 1 contacts" )
      .should( "be.visible" )
  } )
} )
