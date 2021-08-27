describe( "LocalVisits - Staff", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const local_booking = require( "../../support/local_booking" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const { name, email } = user_data
  const staff_title = "Massage therapist"
  const category_name = "Best Massage"
  const service_name = "Regular massage"
  const service_name2 = "Hot Stone Massage"
  const merchant_name = "Test Automation Staff"
  const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377475930" : "14377477492"

  it( "Part 1 - Should be able to add a new staff member", function() {
    const dashboard_username = base.createRandomUsername()
    cy.writeFile( "cypress/helpers/local_booking/staff.json", {} )
    base.login( admin_panel, "ac" )
    base.deleteMerchants(merchant_name)
    // base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    base.createUserEmail()
    cy.get( "@email_config" )
      .then( ( email_config ) => {
        local_booking.createBookingsMerchantAndDashboardUser( merchant_name, email_config.imap.user, dashboard_username, phone_number )
      } )
    base.loginDashboard( dashboard_username )

    // create a service category and 2 services
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_booking.createServiceCategory( merchant_id, category_name )
        local_visits.getVisitsSettings( merchant_id )
          .then( ( response ) => {
            local_booking.createService( merchant_id, service_name, response.body.bookings.service.groups[ 0 ].id )
            local_booking.createService( merchant_id, service_name2, response.body.bookings.service.groups[ 0 ].id )
          } )
      } )

    // add staff member and assign to one service only
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/bookings` )
    cy.contains( "Staff Members" )
      .click()
    cy.contains( "Add new staff members to assign for specific booking services for your online web booker" )
      .should( "be.visible" )
    cy.contains( "Add Staff Member" )
      .click()
    cy.findByLabelText( "First Name" )
      .type( name )
    cy.findByLabelText( "Last Name" )
      .type( name )
    cy.findByLabelText( "Staff Title" )
      .type( staff_title )
    cy.findByLabelText( "Email" )
      .type( email )
    cy.findByLabelText( "Phone" )
      .type( user_data.phone_number )
    cy.contains( "Display in Web Booker" )
      .click()
    cy.contains( service_name )
      .click()
    cy.contains( "Save" )
      .click()
    // assertion: should see success message for staff member creation
    cy.contains( "Staff Member created" )
      .should( "be.visible" )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.getMerchantById( merchant_id )
          .then( ( response ) => {
            cy.readFile( "cypress/helpers/local_booking/staff.json" )
              .then( ( data ) => {
                data.email_config = this.email_config
                data.dashboard_username = dashboard_username
                data.is_staff_member_added = true
                data.booking_link = `${ dashboard.booking_link }/${ response.body.slug }`
                cy.writeFile( "cypress/helpers/local_booking/staff.json", data )
              } )
          } )
      } )
  } )

  it( "Part 2 - Should be able to show staff member page", () => {
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        assert.isTrue( data.is_staff_member_added, "Staff member should have been added" )
        base.loginDashboard( data.dashboard_username )
      } )

    // unhide staff member page and enable any staff member option
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/bookings/web-booker` )
    cy.contains( "Select Staff Member Page" )
      .parents( ".web-booker-build__component-item-container" )
      .within( () => {
        // assertion: should see hidden badge on staff member page card
        cy.contains( "Hidden" )
          .should( "be.visible" )
        cy.get( `[src="/assets/dashboard/icon-edit-orange-pencil-underline.svg"]` )
          .click()
      } )
    cy.contains( "Display in Web Booker" )
      .click()
    cy.contains( "Enable 'Any Staff Member'" )
      .click()
    cy.contains( "Confirm" )
      .click()
    // assertion: should see success message for staff member page setting update
    cy.contains( "Settings updated" )
      .should( "be.visible" )
    cy.contains( "Select Staff Member Page" )
      .parents( ".web-booker-build__component-item-container" )
      .within( () => {
        // assertion: should not see hidden badge on staff member card
        cy.contains( "Hidden" )
          .should( "not.exist" )
      } )
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        data.is_staff_member_page_displayed = true
        cy.writeFile( "cypress/helpers/local_booking/staff.json", data )
      } )
  } )

  it( "Part 3 - Should be able to complete booking with staff on web booker", () => {
    const email_query = "Booking is Pending"
    let next_available_day
    cy.intercept( "GET", "**/visits-bookings-service-schedule/**" )
      .as( "getServiceSchedule" )
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        assert.isTrue( data.is_staff_member_page_displayed, "Staff member page should have been unhidden" )
        cy.visit( data.booking_link )
      } )

    // select service with no staff assigned
    local_booking.selectServiceOnWebBooker( service_name2 )
    // assertion: should not see option to select staff
    cy.contains( "Schedule a date and time for your service." )
      .should( "be.visible" )
    cy.reload()

    // select service with staff member assigned
    local_booking.selectServiceOnWebBooker( service_name )
    // assertions: should see staff member page with option to select staff and any staff option
    cy.contains( "Select a staff member for this service." )
      .should( "be.visible" )
    cy.contains( "Any Staff Member" )
      .should( "be.visible" )
    cy.contains( staff_title )
      .should( "be.visible" )
    cy.wait( 1000 ) // added for bug https://app.clickup.com/t/18qxr27
    cy.contains( `${ name } ${ name }` )
      .should( "be.visible" )
      .click()

    // complete rest of booking
    cy.wait( "@getServiceSchedule" )
      .then( ( req ) => {
        next_available_day = Cypress.dayjs( Object.keys( req.response.body )[ 1 ] )
        local_booking.selectScheduleOnWebBooker( next_available_day )
      } )
    local_booking.selectTimeOnWebBooker()
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        local_booking.completeContactInfoOnWebBooker( name, data.email_config.imap.user, phone_number )
      } )
    local_booking.completeBookingForm()

    // assertions: should see confirmation page with staff member
    cy.contains( "Booking Created!" )
      .should( "be.visible" )
    cy.contains( `${ name } ${ name } – ${ staff_title }` )
      .should( "be.visible" )
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        const email_config = data.email_config
        // assertion: should recieve booking pending email
        cy.task( "getLastEmail", { email_config, email_query } )
        data.is_booking_created = true
        cy.writeFile( "cypress/helpers/local_booking/staff.json", data )
      } )
  } )

  it( "Part 4 - Should see booking with staff members created on dashboard", () => {
    cy.readFile( "cypress/helpers/local_booking/staff.json" )
      .then( ( data ) => {
        assert.isTrue( data.is_booking_created, "Booking should have been created" )
        base.loginDashboard( data.dashboard_username )
      } )

    // visit inbox
    cy.visit( `${ dashboard.host }/admin/local-visits/bookings?view=inbox` )
    const tableRowText = base.getTableRowsText( { service: "Service" }, 1 )
    // assertion: should see staff member assigned to service on dashboard
    cy.wrap( null )
      .then( () => {
        assert.include( tableRowText[ 0 ].service, `Assigned to: ${ name } ${ name }` )
      } )
  } )
} )
