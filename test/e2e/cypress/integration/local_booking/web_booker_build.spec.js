describe( "LocalVisits - Web booker build", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const local_booking = require( "../../support/local_booking" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const service_page_title = "Service page title"
  const service_page_description = "Service page description"
  const schedule_page_title = "Schedule page title"
  const schedule_page_description = "Schedule page description"
  const add_contact_info_page_title = "Add contact info page title"
  const add_contact_info_page_description = "Add contact info page description"
  const booking_created_page_title = "Booking Created page title"
  const booking_created_page_description = "Booking Created page description"
  const service_name = "Service name"
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`
  
  function editPageTitleAndDescription( card_name, page_title, page_description ) {
    cy.contains( card_name )
      .parents( ".web-booker-build__component-item-container" )
      .within( () => {
        cy.get( `[src="/assets/dashboard/icon-edit-orange-pencil-underline.svg"]` )
          .click()
      } )
    // assertion: should see correct modal title
    cy.contains( "h2", card_name )
      .should( "be.visible" )
    cy.findByLabelText( "Page Title" )
      .clear()
      .type( page_title )
    cy.findByLabelText( "Message (Optional)" )
      .type( page_description )
    cy.contains( "Confirm" )
      .click()
  }
  function assertServiceTitleUpdateAndSuccessfulBookerCardEdit( service_page_title ) {
    cy.contains( service_page_title )
      .should( "be.visible" )
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    cy.contains( "close" )
      .click()
  }

  it( "Part 1 - Should be able to edit page title and description for services, schedule, add contact info, and booking created page", () => {
    cy.writeFile( "cypress/helpers/local_booking/web_booker_build.json", {} )
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber(merchant_name)
    local_booking.createBookingsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    base.loginDashboard( dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_booking.createServiceCategory( merchant_id, "Service Category Name" )
        local_visits.getVisitsSettings( merchant_id )
          .then( ( response ) => {
            local_booking.createService( merchant_id, service_name, response.body.bookings.service.groups[ 0 ].id )
          } )
      } )

    // go to web booker settings page
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/bookings` )
    cy.contains( "Web Booker" )
      .click()

    editPageTitleAndDescription( "Select Services Page", service_page_title, service_page_description )
    // assertion: should be able to edit service page title and description
    assertServiceTitleUpdateAndSuccessfulBookerCardEdit( service_page_title )

    editPageTitleAndDescription( "Select Schedule Page", schedule_page_title, schedule_page_description )
    // assertion: should be able to edit schedule page title and description
    assertServiceTitleUpdateAndSuccessfulBookerCardEdit( schedule_page_title )

    editPageTitleAndDescription( "Add Contact Info Page", add_contact_info_page_title, add_contact_info_page_description )
    // assertion: should be able to edit add contact info page title and description
    assertServiceTitleUpdateAndSuccessfulBookerCardEdit( service_page_title )

    editPageTitleAndDescription( "Booking Created Page", booking_created_page_title, booking_created_page_description )
    // assertion: should be able to edit booking created page title and description
    assertServiceTitleUpdateAndSuccessfulBookerCardEdit( booking_created_page_title )

    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            cy.readFile( "cypress/helpers/local_booking/web_booker_build.json" )
              .then( ( data ) => {
                data.dashboard_username = dashboard_username
                data.merchant_id = merchant_id
                data.booking_link = `${ dashboard.booking_link }/${ response.body.slug }`
                cy.writeFile( "cypress/helpers/local_booking/web_booker_build.json", data )
              } )
          } )
      } )
  } )

  it( "Part 2 - Should see edited page titles and descriptions on the web booker", () => {
    cy.intercept( "GET", "**/visits-bookings-service-schedule/**" )
      .as( "getServiceSchedule" )
    cy.readFile( "cypress/helpers/local_booking/web_booker_build.json" )
      .then( ( data ) => {
        assert.isDefined( data.booking_link, "Booking link should exist" )
        cy.visit( data.booking_link )
      } )
    // assertions: should see edited service page title and description
    cy.contains( service_page_title )
      .should( "be.visible" )
    cy.contains( service_page_description )
      .should( "be.visible" )
    local_booking.selectServiceOnWebBooker( service_name )
    // assertions: should see edited schedule page title and description
    cy.contains( schedule_page_title )
      .should( "be.visible" )
    cy.contains( schedule_page_description )
      .should( "be.visible" )
    cy.wait( "@getServiceSchedule" )
      .then( ( req ) => {
        const next_available_day = Cypress.dayjs( Object.keys( req.response.body )[ 1 ] )
        local_booking.selectScheduleOnWebBooker( next_available_day )
      } )
    local_booking.selectTimeOnWebBooker()
    // assertions: should see edited add contact info page title and description
    cy.contains( add_contact_info_page_title )
      .should( "be.visible" )
    cy.contains( add_contact_info_page_description )
      .should( "be.visible" )
  } )
} )
