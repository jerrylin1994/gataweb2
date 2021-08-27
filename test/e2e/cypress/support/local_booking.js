const dashboard = Cypress.env( "dashboard" )
const admin_panel = Cypress.env( "admin" )
const local_visits = require( "../support/local_visits" )

function createBookingsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number ) {
  local_visits.createVisitsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, phone_number )
  cy.get( "@merchant_id" )
    .then( ( merchant_id ) => {
      enableBooking( merchant_id )
    } )
}

function enableBooking( merchant_id ) {
  cy.request( {
    method: "POST",
    url: `${ admin_panel.host }/admin/merchants/${ merchant_id }/visits/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "merchant_settings_update",
      data: {
        status: "live",
        id: merchant_id,
        bookings: {
          enabled: true
        }
      }
    }
  } )
}

function createServiceCategory( merchant_id, category_name ) {
  cy.request( {
    method: "POST",
    url: `${ dashboard.host }/merchants/${ merchant_id }/visits/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "booking_service_group_create",
      data: {
        is_collapsed: false,
        is_hidden: false,
        label: category_name
      }
    }
  } )
}

function createService( merchant_id, service_name, service_group_id ) {
  cy.request( {
    method: "POST",
    url: `${ dashboard.host }/merchants/${ merchant_id }/visits/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "booking_service_type_create",
      data: {
        service_group_id,
        service_type_model: {
          is_hidden: false,
          label: service_name,
          type: "basic",
          duration: 3600
        }
      }
    }
  } )
}

function selectServiceOnWebBooker( service_name ) {
  cy.contains( service_name )
    .click()
  cy.contains( "Next" )
    .click()
}

function selectTimeOnWebBooker() {
  cy.contains( "12:00 PM" )
    .click()
  cy.wait( 500 ) // added as cypress will find the next button from previous page sometimes
  cy.contains( "Next" )
    .click()
}

function selectScheduleOnWebBooker( day ) {
  if( day.get( "month" ) == Cypress.dayjs().get( "month" ) ) {
    cy.findByLabelText( day.format( "MMMM D, YYYY" ) )
      .parent()
      .should( "be.enabled" )
      .click()
  } else {
    cy.get( ".react-calendar__navigation__next-button" )
      .click()
    cy.findByLabelText( day.format( "MMMM D, YYYY" ) )
      .parent()
      .should( "be.enabled" )
      .click()
  }
}

function completeContactInfoOnWebBooker( name, email, phone_number ) {
  cy.findAllByLabelText( "Full Name *" )
    .type( name )
  cy.findByLabelText( "Email *" )
    .type( email )
  cy.findByLabelText( "Mobile *" )
    .type( phone_number )
}

function completeBookingForm() {
  cy.contains( "Complete Booking" )
    .click()
}

function clickCreateNewBookingButton() {
  cy.contains( "Create" )
    .click()
  cy.contains( "New Booking" )
    .click()
}

function selectServiceOnDashboard( service_name, category_name ) {
  cy.findByPlaceholderText( "-- Select a Service --" )
    .click()
  cy.contains( `${ category_name } - ${ service_name }` )
    .click()
}

function selectTimeOnDashboard() {
  cy.findByPlaceholderText( "-- Select a Service Time --" )
    .click()
  cy.contains( "12:00 PM" )
    .click()
}

function selectScheduleOnDashboard( service_date ) {
  cy.findByLabelText( "Open calendar" )
    .click()
  cy.findByLabelText( service_date.format( "dddd MMMM D YYYY" ) )
    .should( "be.visible" )
    .click()
}

function completeContactInfoOnDashboard( name ) {
  cy.get( `input[placeholder="Enter customer name, email or phone"]` )
    .type( name )
  cy.contains( name )
    .click()
  cy.contains( "Confirm" )
    .click()
}

function clickProceedButton() {
  cy.contains( "Proceed" )
    .click()
}

function selectStaffOnDashboard( name ) {
  cy.findByPlaceholderText( "-- Select a Staff Member --" )
    .click()
  cy.contains( name )
    .click()
}

function addNewClient( name, phone_number, email ) {
  cy.contains( "Add a New Client" )
    .click()
  cy.findByLabelText( "Full Name" )
    .type( name )
  cy.findByLabelText( "Email" )
    .type( email )
  cy.findByLabelText( "Mobile" )
    .type( phone_number )
}

function clickConfirmButton() {
  cy.contains( "Confirm" )
    .click()
}

module.exports = {
  createBookingsMerchantAndDashboardUser,
  createServiceCategory,
  createService,
  selectScheduleOnWebBooker,
  selectServiceOnWebBooker,
  selectTimeOnWebBooker,
  completeContactInfoOnWebBooker,
  completeBookingForm,
  clickCreateNewBookingButton,
  selectServiceOnDashboard,
  selectTimeOnDashboard,
  selectScheduleOnDashboard,
  completeContactInfoOnDashboard,
  clickProceedButton,
  selectStaffOnDashboard,
  addNewClient,
  clickConfirmButton,
}
