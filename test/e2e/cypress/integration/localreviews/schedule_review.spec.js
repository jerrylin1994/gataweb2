describe( "LocalReviews - Schedule Review", () => {
  const base = require( "../../support/base" )
  const user_data = require( "../../fixtures/user_data" )
  const local_reviews = require( "../../support/local_reviews" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = base.createMerchantName()
  const contact_name = user_data.name
  const phone_number = Cypress.config( "baseUrl" ).includes ("stage") ? "14377476342" : "14377477492"

  before( () => {
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.addTwilioNumber(merchant_id,phone_number)
        // local_messages.addLocalMessagesTwilioNumber( merchant_id )
        // local_reviews.addPhoneNumber( merchant_id )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to see correct data in Schedule Request settings table", function() {
    // add 1 day and 5 minutes to current time
    const future_date_time = Cypress.dayjs().utc()
      .add( 1, "day" )
      .add( 5, "minutes" )
    const formatted_utc_future_date_time = `${ future_date_time.format( "YYYY-MM-DDTHH:mm:ss.SSS" ) }Z`
    const formatted_local_date_time = future_date_time.local().format( "MMM D, YYYY h:mm A" )

    // send schedule request
    local_reviews.getSurveyTemplates( this.merchant_id )
      .then( ( response ) => {
        const survey_id = response.body[ 0 ].id
        local_reviews.scheduleReviewRequest( this.merchant_id, contact_name, survey_id, formatted_utc_future_date_time, this.employee_id, user_data.email )
      } )
    cy.visit( `${ dashboard.host }/admin/settings/local-reviews` )
    cy.contains( "Scheduled Requests" )
      .click()

    // assertion: should be on the Schedule Requests page in settings
    cy.get( ".erp-page-header-title" )
      .should( "have.text", "Scheduled Requests" )

    // assertion: scheduled request table data should be correct
    cy.get( "tr[ng-repeat=\"scheduled_survey_request in scheduled_survey_requests\"]" )
      .within( () => {
        cy.get( "td" )
          .eq( 1 )
          .should( "have.text", formatted_local_date_time )
        cy.get( "td" )
          .eq( 2 )
          .should( "have.text", `${ contact_name }${ user_data.email }` )
        cy.get( "td" )
          .eq( 3 )
          .should( "have.text", "Manual(Cypress)" )
        cy.get( "td" )
          .eq( 4 )
          .should( "have.text", "1. Online Review Star (Gating)" )
      } )
  } )

  it( "Should be able to send scheduled review", () => {
    // add 1 day and 5 minutes to current time
    const future_date_time = Cypress.dayjs( )
      .second( 0 )
      .millisecond( 0 )
      .add( 1, "day" )
      .add( 5, "minutes" )
    const formatted_future_date_time = future_date_time.format( "MM/DD/YYYY HH:mm" )
    const future_date = formatted_future_date_time.split( " " )[ 0 ]
    const future_time = formatted_future_date_time.split( " " )[ 1 ]
    const formatted_future_utc_date_time = `${ future_date_time.utc().format( "YYYY-MM-DDTHH:mm:ss.SSS" ) }Z`
    cy.intercept( "POST", "**/scheduled_survey_requests" )
      .as( "scheduleSurveyRequests" )
    cy.visit( dashboard.host )
    cy.get( "a[href = \"/admin/local-reviews\"]" )
      .click()
    cy.contains( "Request Feedback" )
      .click()
    cy.get( "input[name = \"name\"]" )
      .type( user_data.name )
    cy.get( "input[name = \"contact\"]" )
      .type( user_data.email2 )
    base.getDashboardSession()
      .then( ( response ) => {
        if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
      } )

    // change send later date
    cy.contains( "+ Send Later (Optional)" )
      .click()
    cy.get( ".md-datepicker-input" )
      .clear()
      .type( future_date )
    cy.get( "input[name=\"time\"]" )
      .type( future_time )
    cy.wait( 1000 )// the typing is too fast so modal does not have time to process the new date
    cy.contains( "button", "Send Later" )
      .click()

    // assertion: scheduled_survey_request api should return correct date set
    cy.wait( "@scheduleSurveyRequests" )
      .then( ( xhr ) => {
        assert.equal( xhr.response.body.schedule.date, formatted_future_utc_date_time )
      } )

    // assertion: should see success toast message
    cy.contains( `Feedback request scheduled for ${ user_data.email2 } (Click to view)` )
      .should( "be.visible" )
  } )

  it( "Should be able to receive a scheduled phone request", function() {
    const sent_text = `Hi ${ contact_name }, Thanks for choosing ${ merchant_name } ${ Math.floor( Math.random() * 100000000 ) }`
    local_reviews.getSurveyTemplates( this.merchant_id )
      .then( ( response ) => {
        const survey_id = response.body[ 0 ].id
        // schedule review request in 13 seconds
        const future_date_time = Cypress.dayjs().utc()
          .add( 13, "seconds" )
        const formatted_utc_future_date_time = `${ future_date_time.format( "YYYY-MM-DDTHH:mm:ss.SSS" ) }Z`
        local_reviews.scheduleReviewRequest( this.merchant_id, contact_name, survey_id, formatted_utc_future_date_time, this.employee_id, dashboard.accounts.twilio.to_phone_number )
      } )

    // assertion: should not receive request within the first 10ish seconds
    cy.task( "checkTwilioTextNotExist", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text
    } )
      .then( ( result ) => {
        assert.equal( result, "Error: Exceeded maximum wait time" )
      } )

    // assertion: should receive request within the next 15ish seconds
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: phone_number,
      sent_text,
      wait_time: 15
    } )
      .then( ( text ) => {
        assert.isNotEmpty( text )
      } )
  } )

  it( "Should be able to receive a scheduled email request", function() {
    const email_query = `Thanks for choosing ${ merchant_name }`
    base.createUserEmail()
    cy.get( "@email_config" )
      .then( ( email_config ) => {
        local_reviews.getSurveyTemplates( this.merchant_id )
          .then( ( response ) => {
            const survey_id = response.body[ 0 ].id
            // schedule review request in 17 seconds
            const future_date_time = Cypress.dayjs().add( 17, "seconds" )
            const formatted_utc_future_date_time = future_date_time.toISOString()
            local_reviews.scheduleReviewRequest( this.merchant_id, contact_name, survey_id, formatted_utc_future_date_time, this.employee_id, email_config.imap.user )
          } )

        // assertion: should not receive request within the first 15ish seconds
        cy.task( "checkEmailNotExist", { email_config, email_query } )
          .then( ( email_result ) => {
            assert.equal( email_result, "Error: Could not find email during wait time" )
          } )

        // assertion: should receive request within the next 15ish seconds
        cy.task( "getLastEmail", { email_config, email_query } )
      } )
  } )
} )
