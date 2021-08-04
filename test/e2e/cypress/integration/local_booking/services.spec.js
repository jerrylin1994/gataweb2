describe( "LocalVisits - Services", () => {
  const base = require( "../../support/base" )
  const local_booking = require( "../../support/local_booking" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const { name, email, phone_number, merchant_name } = user_data
  const category_name = "Massage"
  const category_description = "Massage Category"
  const service_name = "Hot Stone Massage"
  const service_description = "30 minutes hot stone"
  const service_price = "30"
  const service_duration = "60"

  it( "Part 1 - Should be able to add new service category and service", () => {
    const dashboard_username = base.createRandomUsername()
    cy.writeFile( "cypress/helpers/local_booking/services.json", {} )
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_booking.createBookingsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    base.loginDashboard( dashboard_username )

    // go to services settings page
    cy.visit( `${ dashboard.host }/admin/settings/local-visits` )
    cy.contains( "Bookings" )
      .click()
    cy.contains( "Services" )
      .click()
    // assertion: should see placeholder text when no service and groups have been added
    cy.contains( "Create categories to group together the different kinds of services you will be offering" )
      .should( "be.visible" )

    // add a new service category
    cy.contains( "Add New Service Category" )
      .click()
    // assertion: should see add new service category modal
    cy.contains( "h2", "Add New Service Category" )
      .should( "be.visible" )
    // assertion: should see correct placeholder text for category name
    cy.findByLabelText( "Category Name" )
      .type( category_name )
      .should( "have.attr", "placeholder" )
      .and( "contain", "Enter name of service category" )
    // assertion: should see correct placeholder text for category description
    cy.findByLabelText( "Category Description (For Internal Use)" )
      .type( category_description )
      .should( "have.attr", "placeholder" )
      .and( "contain", "What kind of service categories should be placed here" )
    cy.contains( "Confirm" )
      .click()
    // assertion: should see success message for category add
    cy.contains( `${ category_name } has been successfully added` )
      .should( "be.visible" )
    cy.contains( "close" )
      .click()
    // should see added category on service page
    cy.contains( category_name )
      .should( "be.visible" )

    // add a new service
    cy.contains( /^add$/ )
      .click()
    // assertion: should see add new service modal
    cy.contains( "Add New Service" )
      .should( "be.visible" )
    // assertion: should see correct placeholder text for service name
    cy.findByLabelText( "Service Name" )
      .type( service_name )
      .should( "have.attr", "placeholder" )
      .and( "contain", "Enter name of service" )
    // assertion: should see correct placeholder text for service description
    cy.findByLabelText( "Service Description" )
      .type( service_description )
      .should( "have.attr", "placeholder" )
      .and( "contain", "Short description of service" )
    // assertion: should see correct placeholder text for price
    cy.findByLabelText( "Price ($)" )
      .type( service_price )
      .should( "have.attr", "placeholder" )
      .and( "contain", "0.00" )
    // assertion: should see correct placeholder text for duration
    cy.findByLabelText( "Duration (Minutes)" )
      .clear()
      .type( service_duration )
      .should( "have.attr", "placeholder" )
      .and( "contain", "60" )
    // assertion: category should be automatically selected as massage
    cy.findAllByPlaceholderText( "--Select A Service Category--" )
      .should( "include.text", "Massage" )
    cy.contains( "Confirm" )
      .click()
    // assertion: should seee success message for service add
    cy.contains( "Service saved successfully" )
      .should( "be.visible" )
    // assertions: should see new added service on the services page
    cy.contains( service_name )
      .should( "be.visible" )
    cy.contains( service_price )
      .should( "be.visible" )
    cy.contains( service_duration )
      .should( "be.visible" )

    // edit the category to be displayed on web booker
    cy.contains( /^Massage$/ )
      .siblings( "div" )
      .find( `[src="/assets/dashboard/icon-edit-dark-grey-pencil-underline.svg"]` )
      .click()
    cy.contains( "Display in Web Booker" )
      .click()
    cy.contains( "Confirm" )
      .click()
    cy.contains( `${ category_name } has been successfully updated` )
      .should( "be.visible" )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            cy.readFile( "cypress/helpers/local_booking/services.json" )
              .then( ( data ) => {
                data.dashboard_username = dashboard_username
                data.booking_link = `${ dashboard.booking_link }/${ response.body.slug }`
                cy.writeFile( "cypress/helpers/local_booking/services.json", data )
              } )
          } )
      } )
  } )

  it( "Part 2 - Should be able to create booking on web booker", () => {
    let next_available_day
    cy.intercept( "GET", "**/visits-bookings-service-schedule/**" )
      .as( "getServiceSchedule" )
    cy.readFile( "cypress/helpers/local_booking/services.json" )
      .then( ( data ) => {
        assert.isDefined( data.booking_link, "Booking link should exist" )
        cy.visit( data.booking_link )
      } )
    // assertions: should see category/service name, price and duration on web booker
    cy.contains( category_name )
      .should( "be.visible" )
    cy.contains( `$${ service_price }` )
      .should( "be.visible" )
    cy.contains( `${ service_duration } min` )
      .should( "be.visible" )

    // select a service
    local_booking.selectServiceOnWebBooker( service_name )

    // assertion: should see select date and time page
    cy.contains( "Schedule a date and time for your service." )
      .should( "be.visible" )

    // complete rest of booking
    cy.wait( "@getServiceSchedule" )
      .then( ( req ) => {
        next_available_day = Cypress.dayjs( Object.keys( req.response.body )[ 1 ] )
        local_booking.selectScheduleOnWebBooker( next_available_day )
      } )
    local_booking.selectTimeOnWebBooker()
    local_booking.completeContactInfoOnWebBooker( name, email, phone_number )
    local_booking.completeBookingForm()

    // assertion: should see booking complete page
    cy.contains( "Booking Created!" )
      .should( "be.visible" )

    cy.readFile( "cypress/helpers/local_booking/services.json" )
      .then( ( data ) => {
        data.booking_created = true
        data.booking_date = next_available_day
        cy.writeFile( "cypress/helpers/local_booking/services.json", data )
      } )
  } )

  it( "Part 3 - Should be able to see created booking in inbox", () => {
    let booking_date
    cy.readFile( "cypress/helpers/local_booking/services.json" )
      .then( ( data ) => {
        assert.isTrue( data.booking_created, "Booking should have been created" )
        base.loginDashboard( data.dashboard_username )
        booking_date = data.booking_date
      } )
    cy.visit( `${ dashboard.host }/admin/local-visits/bookings` )
    cy.contains( "Inbox" )
      .click()
    // assertion: inbox table should have correct number of headers
    base.assertTableHeaderCount( 6 )
    const tableRowText = base.getTableRowsText( { date: "Date", name: "Name", contact: "Contact", service: "Service", status: "Status" }, 1 )

    // assertion: inbox table data should be correct
    cy.wrap( null )
      .then( () => {
        assert.include( tableRowText[ 0 ].date, `${ Cypress.dayjs( booking_date ).format( "ddd, MMM D, YYYY" ) }12:00 PM - 1:00 PM` )
        assert.equal( tableRowText[ 0 ].name, name )
        assert.include( tableRowText[ 0 ].contact, email )
        assert.include( tableRowText[ 0 ].contact, phone_number )
        assert.equal( tableRowText[ 0 ].service, service_name )
        assert.equal( tableRowText[ 0 ].status, "Pending" )
      } )
  } )
} )
