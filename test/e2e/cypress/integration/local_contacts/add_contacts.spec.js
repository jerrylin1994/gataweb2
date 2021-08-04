describe( "LocalContacts - Add Contacts", () => {
  const base = require( "../../support/base" )
  const dayjs = require( "dayjs" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const activity_date = dayjs().format( "ddd MMM DD" )
  const join_date = dayjs().format( "MMM D, YYYY" )
  const user_data = require( "../../fixtures/user_data" )

  context( "Add contact test cases", () => {
    const dashboard_username = base.createRandomUsername()
    before( () => {
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      local_contacts.createLocalContactsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
    } )

    beforeEach( () => {
      base.loginDashboard( dashboard_username )
      cy.visit( dashboard.host )
      cy.get( "a[href = \"/admin/local-contacts/customers\"]" )
        .click()
      cy.contains( "Add Contacts" )
        .click()
    } )

    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Should be able to manually add a contact", () => {
        cy.contains( "Manual Entry" )
          .click()
        cy.get( "input[name=\"name\"]" )
          .type( user_data.name )
        cy.get( "input[name=\"mobile\"]" )
          .type( user_data.phone_number )
        cy.get( "input[name=\"email\"]" )
          .type( user_data.email )
        cy.get( "button[type = \"submit\"]" )
          .click()
        cy.contains( "Contact Created" )
          .should( "be.visible" )

        // manual contact add log
        cy.get( ".contacthub-timeline-item" )
          .eq( 1 )
          .within( () => {
          // assertion: should see correct message in log
            cy.contains( "Added to your contact list: Manually Added by Cypress" )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
          } )

        cy.get( ".contacthub-details-info" )
          .within( () => {
            cy.contains( user_data.email )
              .should( "be.visible" )
            cy.contains( join_date )
              .should( "be.visible" )
          } )
      } )
    } )

    Cypress.testFilter( [], () => {
      it( "Should be able to bulk upload contacts with a note", () => {
        const note = "Bulk upload note"
        cy.intercept( "GET", "**/contacts**" )
          .as( "getContacts" )
        cy.intercept( "GET", "**/actions**" )
          .as( "getContactActions" )
        cy.contains( "Upload Spreadsheet" )
          .click()
        cy.get( ".ol-drag-drop-file-container" )
          .attachFile( "test-bulk.csv", { subjectType: "drag-n-drop" } )
        cy.contains( "Proceed" )
          .click()
        cy.get( "md-select[name=\"mapping_columnemail\"]" )
          .click()
        cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
          .find( "md-option[value=\"primary_email\"]" )
          .click()
        cy.get( "md-select[name=\"mapping_columnphone number\"]" )
          .click()
        cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
        cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
          .find( "md-option[value=\"primary_phone\"]" )
          .click()
        cy.get( "md-select[name=\"mapped_property\"]" )
          .click()
        cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
        cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
          .find( "md-option[value=\"primary_email\"]" )
          .click()
        cy.contains( "Proceed" )
          .click()
        cy.contains( "+ Add Notes" )
          .click()
        cy.get( "textarea[name=\"notes\"]" )
          .type( note )
        cy.contains( "Upload Contacts" )
          .click()
        cy.contains( "Added 2 new contacts" )
          .should( "be.visible" )
        cy.contains( "Close" )
          .click()
        cy.wait( "@getContacts" )
        cy.get( "table" )
          .within( () => {
            cy.contains( "Joe" )
              .should( "be.visible" )
            cy.contains( "John" )
              .should( "be.visible" )
              .click()
          } )
        cy.wait( "@getContactActions" )

        // bulk upload tag log
        cy.get( ".contacthub-timeline-item" )
          .eq( 2 )
          .within( () => {
          // assertions: should see correct messages in log
            cy.contains( "Cypress added tag: Upload: test-bulk.csv" )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
          } )

        // batch import log
        cy.get( ".contacthub-timeline-item" )
          .eq( 3 )
          .within( () => {
          // assertions: should see correct messages in log
            cy.contains( "Added to your contact list: Batch Imported" )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
          } )

        // assertion: should see logged note
        cy.get( ".contacthub-stats-section" )
          .contains( note )
          .should( "be.visible" )
      } )
    } )
  } )

  if( Cypress.config( "baseUrl" ) == "https://stage.onelocal.com" ) {
    context( "Bulk upload with custom contact field test case", () => {
      const dashboard_username = base.createRandomUsername()
      Cypress.testFilter( [ "@smoke" ], () => {
        it( "Should be able to bulk update contact with custom contact field", () => {
          base.login( admin_panel, "ac" )
          base.deleteMerchantAndTwilioAccount()
          base.deleteIntercomUsers()
          local_contacts.createLocalContactsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
          base.loginDashboard( dashboard_username )
          const custom_field = "Bulk upload custom field"
          cy.get( "@merchant_id" )
            .then( ( merchant_id ) => {
              local_contacts.createContact( merchant_id, "Joe", "joe@example.com", "6472859167", false )
                .then( ( response ) => {
                  cy.wrap( response.body.refs.contact_ids[ 0 ] ).as( "contact_id" )
                } )
              local_contacts.createCustomContactField( merchant_id, custom_field )
            } )
          cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )

          // bulk upload contacts
          cy.contains( "Add Contacts" )
            .click()
          cy.contains( "Upload Spreadsheet" )
            .click()
          cy.get( ".ol-drag-drop-file-container" )
            .attachFile( "test-bulk.csv", { subjectType: "drag-n-drop" } )
          cy.contains( "Proceed" )
            .click()
          // map email to custom field
          cy.get( "md-select[name=\"mapping_columnemail\"]" )
            .click()
          cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
            .contains( custom_field )
            .click()
          cy.get( "md-select[name=\"mapping_columnphone number\"]" )
            .click()
          cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
          cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
            .find( "md-option[value=\"primary_phone\"]" )
            .click()
          cy.get( "md-select[name=\"mapped_property\"]" )
            .click()
          cy.wait( 1000 ) // required due to unable to uniquely locate the dropdown
          cy.get( "div[class*=\"md-select-menu-container md-active\"]" )
            .find( "md-option[value=\"primary_phone\"]" )
            .click()
          cy.contains( "md-radio-button", "Update Existing Contacts" )
            .click()
          cy.contains( "Proceed" )
            .click()
          cy.contains( "Upload Contacts" )
            .click()

          // assertion: should see success message for updating one contact
          cy.contains( "Updated 1 existing contacts" )
            .should( "be.visible" )

          cy.contains( "Close" )
            .click()
          cy.get( "@contact_id" )
            .then( ( contact_id ) => {
              cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
            } )

          // assertion: should see custom field updated on the contact
          cy.contains( custom_field )
            .should( "be.visible" )
            .parents( "div" )
            .contains( "joe@example.com" )
            .should( "be.visible" )
        } )
      } )
    } )
  }
} )
