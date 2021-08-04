describe( "LocalVisits - Manual Bookng", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const local_booking = require( "../../support/local_booking" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const { name, email, phone_number, merchant_name } = user_data
  const service_name = "Service name"
  const category_name = "Service Category Name"
  const dashboard_username = base.createRandomUsername()

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_booking.createBookingsMerchantAndDashboardUser( merchant_name, email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_booking.createServiceCategory( merchant_id, category_name )
        local_visits.getVisitsSettings( merchant_id )
          .then( ( response ) => {
            local_booking.createService( merchant_id, service_name, response.body.bookings.service.groups[ 0 ].id )
          } )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/local-visits/bookings` )
  } )

  it( "Should be able to create a manual booking", () => {
    const email_query = `Booking Confirmed ${ category_name } - ${ service_name }`
    let next_available_day
    cy.intercept( "GET", "**/service-schedule/**" )
      .as( "getServiceSchedule" )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_contacts.createContact( merchant_id, name, email, phone_number, false )
      } )
    cy.visit( `${ dashboard.host }/admin/local-visits/bookings` )

    // create a manual booking
    local_booking.clickCreateNewBookingButton()
    // assertion: should see create booking modal
    cy.contains( "h2", "Create Booking" )
      .should( "be.visible" )

    local_booking.selectServiceOnDashboard( service_name, category_name )
    cy.wait( "@getServiceSchedule" )
      .then( ( req ) => {
        next_available_day = Cypress.dayjs( Object.keys( req.response.body )[ 1 ] )
        local_booking.selectScheduleOnDashboard( next_available_day )
      } )
    local_booking.selectTimeOnDashboard()
    local_booking.clickProceedButton()
    local_booking.completeContactInfoOnDashboard( name )
    // assertion: should see success message for booking created
    cy.contains( "Booking Created" )
      .should( "be.visible" )
    // assertions: booking details section should auto populate with created booking
    cy.get( "#event-details-container" )
      .within( () => {
        cy.contains( service_name )
          .should( "be.visible" )
        cy.contains( "Confirmed" )
          .should( "be.visible" )
        cy.contains( next_available_day.format( "dddd, MMMM D, YYYY" ) )
          // .scrollIntoView()
          .should( "be.visible" )
        cy.contains( name )
          .should( "be.visible" )
        cy.contains( phone_number )
          .should( "exist" )
        cy.contains( email )
          .should( "exist" )
      } )
    // assertion: should recieve booking confirmed email
    cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
      .then( ( email ) => {
        assert.isNotEmpty( email )
      } )
  } )
} )
