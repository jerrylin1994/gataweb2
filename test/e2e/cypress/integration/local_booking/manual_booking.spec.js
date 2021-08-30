describe( "LocalVisits - Manual Bookng", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const local_booking = require( "../../support/local_booking" )
  const local_contacts = require( "../../support/local_contacts" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const { name, email } = user_data
  const service_name = "Service name"
  const category_name = "Service Category Name"
  const dashboard_username = base.createRandomUsername()
  const phone_number = Cypress.config( "baseUrl" ).includes( "stage" ) ? "14377475919" : "14377472898"
  const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`

  before( () => {
    base.login( admin_panel, "ac" )
    // base.deleteMerchants( merchant_name )
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    base.removeTwilioNumber( merchant_name )
    local_booking.createBookingsMerchantAndDashboardUser( merchant_name, email, dashboard_username, Cypress.env("TWILIO_NUMBER") )
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

  it( "Should be able to create a manual booking", function() {
    const email_query = `Booking Confirmed`
    let next_available_day
    const contact_phone_number = user_data.phone_number
    base.createUserEmail()
    cy.intercept( "GET", "**/service-schedule/**" )
      .as( "getServiceSchedule" )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_contacts.createContact( merchant_id, name, this.email_config.imap.user, contact_phone_number, false )
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
        cy.contains( contact_phone_number )
          .should( "exist" )
        cy.contains( this.email_config.imap.user )
          .should( "exist" )
      } )
    cy.get( "@email_config" )
      .then( ( email_config ) => {
        // assertion: should recieve booking confirmed email
        cy.task( "getLastEmail", { email_config, email_query } )
          .then( ( html ) => {
            cy.visit( Cypress.config( "baseUrl" ) )
            cy.document( { log: false } ).invoke( { log: false }, "write", html )
          } )
      } )
  } )
} )
