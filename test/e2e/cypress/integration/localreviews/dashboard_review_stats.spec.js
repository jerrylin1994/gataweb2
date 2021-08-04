describe( "LocalReviews - Dashboard Review Stats", () => {
  const base = require( "../../support/base" )
  const user_data = require( "../../fixtures/user_data" )
  const local_reviews = require( "../../support/local_reviews" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const review_message = "Great review yay!"

  function assertReviewCardStats( i, stat_label, stat_text ) {
    cy.get( ".stat-container" )
      .eq( i )
      .within( () => {
        cy.get( ".stat-label-text" )
          .should( "have.text", stat_label )
          .and( "be.visible" )
        cy.get( ".stat-text" )
          .should( "have.text", stat_text )
          .and( "be.visible" )
      } )
  }

  function assertLeaderboardTableHeaderCount( count ) {
    cy.get( ".grouped-th" )
      .then( ( elements ) => {
        assert.equal( elements.length, count )
      } )
  }

  function getLeaderboardTableRowText( headers ) {
    const rowText = {}
    for( const property in headers ) {
      cy.contains( "th", headers[ property ] ).invoke( "index" )
        .then( ( i ) => {
          cy.get( "td" )
            .eq( i + 1 )
            .invoke( "text" )
            .then( ( text ) => {
              rowText[ property ] = text
            } )
        } )
    }
    return rowText
  }

  it( "Setup - Complete review request", function() {
    const dashboard_username = base.createRandomUsername()
    const merchant_name = base.createMerchantName()
    const sent_text = `Hi ${ user_data.name }, Thanks for choosing ${ merchant_name }`
    const old_survey_link = `${ dashboard.survey_sharing_link }/u/Xmm1vHurmhZEtE`
    cy.visit( old_survey_link ) // visit old survey link to avoid restarting test when visiting a domain different from baseUrl
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
    local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    base.loginDashboard( dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_reviews.getSurveyTemplates( merchant_id )
          .then( ( response ) => {
            const survey_id = response.body[ 0 ].id
            // send survey request
            local_reviews.sendReviewRequest( merchant_id, survey_id, this.employee_id, dashboard.accounts.twilio.to_phone_number, user_data.name )
              .then( ( response ) => {
                cy.writeFile( "cypress/helpers/local_reviews/dashboard-stats.json", {
                  contact_id: response.body.customer.id,
                  dashboard_username
                } )
              } )
          } )
      } )

    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: dashboard.accounts.twilio.phone_number,
      sent_text
    } )
      .then( ( text ) => {
        const review_link = text.substring( text.lastIndexOf( ":" ) - 5 )
        cy.request( {
          url: review_link,
          followRedirect: false
        } )
          .then( ( xhr ) => {
            cy.visit( xhr.redirectedToUrl )
          } )
      } )

    // fill out survey
    cy.contains( "How would you rate your experience with us?" )
      .should( "be.visible" )
    cy.get( ".survey-star-5" )
      .click()
    cy.contains( "Use Google to leave us a review?" )
      .should( "be.visible" )
    cy.contains( "No" )
      .click()
    cy.contains( "Use Facebook to leave us a review?" )
      .should( "be.visible" )
    cy.contains( "No" )
      .click()
    cy.get( ".survey-textarea-field" )
      .type( review_message )
    cy.contains( "Next" )
      .click()
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        data.review_request_completed = true,
        cy.writeFile( "cypress/helpers/local_reviews/dashboard-stats.json", data )
      } )
  } )

  it( "Dashboard tab - Should be able to see new completed review and stats", () => {
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )

    // assertion: should be able to see review in recent reviews section
    cy.get( ".recent-reviews" )
      .within( () => {
        cy.contains( review_message )
          .should( "be.visible" )
        cy.contains( user_data.name )
          .should( "be.visible" )
        cy.contains( base.getTodayDate() )
          .should( "be.visible" )
      } )

    // assertion: should be able to see stats in the highlights section
    cy.get( ".highlights-card" )
      .within( () => {
        cy.contains( "You received 1 new testimonial" )
          .should( "be.visible" )
      } )

    // assertion: should be able to see stats in the review cards section
    assertReviewCardStats( 0, "Total Reviews", "1" )
    assertReviewCardStats( 1, "Request Open Rate", "100" )
    assertReviewCardStats( 2, "Average Feedback Sentiment", "100" )
  } )

  it( "Reviews tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/reviews?**" )
      .as( "getReviews" )
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-reviews/reviews` )
    cy.wait( "@getReviews" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 5 )

    const tableRowText = base.getTableRowsText( { date: "Date", contact: "Contact", comment: "Comment" }, 1 )
    const tableRowImgSrc = base.getTableRowsImgSrc( { sentiment: "Sentiment", source: "Source" }, 1 )

    // assertion: reviews table stats should be correct
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowText[ 0 ].date, base.getTodayDate() )
        assert.equal( tableRowText[ 0 ].contact, user_data.name )
        assert.include( tableRowText[ 0 ].comment, review_message )
        assert.equal( tableRowImgSrc[ 0 ].sentiment, "/assets/review-edge/face-positive.svg" )
        assert.equal( tableRowImgSrc[ 0 ].source, "/assets/review-edge/logo-reviewedge.svg" )
      } )

    // assertion: info in the review details modal should be correct
    cy.contains( base.getTodayDate() )
      .click()
    cy.get( ".review-details-modal" )
      .should( "be.visible" )
    cy.get( "input[name=\"reviewer_name\"]" )
      .should( "have.value", user_data.name )
    cy.get( "input[name=\"source\"]" )
      .should( "have.value", "Feedback Request" )
    cy.get( "input[name=\"rating\"]" )
      .should( "have.value", "Positive" )
    cy.contains( "textarea", review_message )
      .should( "be.visible" )
  } )

  it( "Surveys tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/survey_templates**" )
      .as( "getSurveys" )
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )
    cy.wait( "@getSurveys" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 6 )

    const tableRowText = base.getTableRowsText( { name: "Name", date_created: "Date Created", request_sent: "# of Requests Sent", open_rate: "Open Rate", response_count: "# of Responses", completion_rate: "Completion Rate" }, 1 )

    // assertion: survey tab table should have correct stats
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowText[ 0 ].name, "1. Online Review Star (Gating)" )
        assert.equal( tableRowText[ 0 ].date_created, Cypress.dayjs().format( "MMM D, YYYY" ) )
        assert.equal( tableRowText[ 0 ].request_sent, "1" )
        assert.equal( tableRowText[ 0 ].open_rate, "1 (100 %)" )
        assert.equal( tableRowText[ 0 ].response_count, "1" )
        assert.equal( tableRowText[ 0 ].completion_rate, "1 (100 %)" )
      } )
  } )

  it( "Requests tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/survey_requests?**" )
      .as( "getSurveyRequests" )
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-reviews/requests` )
    cy.wait( "@getSurveyRequests" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 5 )

    const tableRowText = base.getTableRowsText( { date_sent: "Date Sent", sent_to: "Sent To", sent_by: "Sent By", template: "Template", opened: "Opened" }, 1 )

    // assertion: requests tab table should have correct stats
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowText[ 0 ].date_sent, Cypress.dayjs().format( "MMM D, YYYY" ) )
        assert.equal( tableRowText[ 0 ].sent_to, `${ user_data.name }${ dashboard.accounts.twilio.to_phone_number }` )
        assert.include( tableRowText[ 0 ].sent_by, "Manual" )
        assert.include( tableRowText[ 0 ].sent_by, "(Cypress)" )
        assert.equal( tableRowText[ 0 ].template, "1. Online Review Star (Gating)" )
        assert.equal( tableRowText[ 0 ].opened, Cypress.dayjs().format( "MMM D, YYYY" ) )
      } )
  } )

  it( "Survey - Should see correct stats", () => {
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.intercept( "GET", "**/survey_responses**" )
      .as( "getSurveyResponses" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/surveys` )
    cy.contains( "1. Online Review" )
      .click()
    // assertion: summary tab question stats should be correct
    cy.get( ".survey-summary-component-stat" )
      .eq( 1 )
      .within( () => {
        cy.get( ".survey-summary-component-stat-title" )
          .should( "have.text", "Review Triage" )
          .and( "be.visible" )
        cy.get( ".survey-summary-component-stat-segment-item" )
          .eq( 2 )
          .within( () => {
            cy.get( ".survey-summary-component-stat-segment-item-label" )
              .should( "have.text", "Left Testimonial" )
              .and( "be.visible" )
            cy.get( ".survey-summary-component-stat-segment-item-rate" )
              .should( "have.text", "100 %" )
            cy.get( ".survey-summary-component-stat-segment-item-count" )
              .should( "have.text", "(1)" )
              .and( "be.visible" )
          } )
      } )
    cy.get( ".survey-summary-component-stat" )
      .eq( 0 )
      .within( () => {
        cy.get( ".survey-summary-component-stat-title" )
          .should( "have.text", "1. How would you rate your experience with us?" )
          .and( "be.visible" )
        cy.get( ".survey-summary-component-stat-header-details" )
          .should( "include.text", "Response Rate:100 %(1)" )
      } )
    cy.get( ".survey-summary-component-stat-segment-item" )
      .eq( 0 )
      .within( () => {
        // assertions: summary question response percentage should be correct
        cy.contains( "100 %" )
          .should( "be.visible" )
        cy.contains( "(1)" )
          .should( "be.visible" )
      } )

    // go to Responses tab
    cy.contains( "a", "Responses" )
      .click()
    cy.wait( "@getSurveyResponses" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    base.assertTableHeaderCount( 10 )
    const tableRowText = base.getTableRowsText( { response_date: "Response Date", contact: "Contact", channel: "Channel", sentiment: "Sentiment", request_date: "Request Date", star_rating: "How would you rate your experience with us?", opened_website: "Opened Website", review_comment: "Review Comments", consent: "Consent to Share" }, 1 )

    // assertion: responses table data should be correct
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowText[ 0 ].response_date, base.getTodayDate() )
        assert.equal( tableRowText[ 0 ].contact, user_data.name )
        assert.equal( tableRowText[ 0 ].channel, "SMS Request" )
        assert.equal( tableRowText[ 0 ].sentiment, "Positive" )
        assert.equal( tableRowText[ 0 ].request_date, base.getTodayDate() )
        assert.equal( tableRowText[ 0 ].star_rating, "5" )
        assert.equal( tableRowText[ 0 ].opened_website, "-" )
        assert.equal( tableRowText[ 0 ].review_comment, review_message )
        assert.equal( tableRowText[ 0 ].consent, "Yes" )
      } )
  } )

  it( "Leaderboard - Should see correct stats", () => {
    cy.intercept( "**/leaderboard" ).as( "leaderboard" )
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard` )
    cy.contains( "Analytics" )
      .click()
    cy.contains( "Leaderboard" )
      .click()
    cy.wait( "@leaderboard" )

    // assertion: table header count should be correct
    assertLeaderboardTableHeaderCount( 8 )

    const tableRowText = getLeaderboardTableRowText( { sent_by: "Sent By", last_7_days: "Last 7 Days", last_30_days: "Last 30 Days", all_time: "All Time", open_rate: "Open Rate", positive_score: "Positive", neutral_score: "Neutral", negative_score: "Negative" } )

    // assertion: leaderboard stats should be correct
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowText.sent_by, "Cypress" )
        assert.equal( tableRowText.last_7_days, "1" )
        assert.equal( tableRowText.last_30_days, "1" )
        assert.equal( tableRowText.all_time, "1" )
        assert.equal( tableRowText.open_rate, "100 %" )
        assert.equal( tableRowText.positive_score, "100 %" )
        assert.equal( tableRowText.neutral_score, "0 %" )
        assert.equal( tableRowText.negative_score, "0 %" )
      } )
  } )

  it( "Should see correct logs on the activity log", () => {
    const activity_date = Cypress.dayjs().format( "ddd MMM DD" )
    cy.intercept( "GET", "**/actions**" )
      .as( "getContactActions" )
    cy.readFile( "cypress/helpers/local_reviews/dashboard-stats.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_request_completed, "Review was not completed" )
        base.loginDashboard( data.dashboard_username )
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ data.contact_id }` )
      } )
    cy.wait( "@getContactActions" )

    // assertion: should see left a review log
    cy.contains( `${ user_data.name } left a positive review in a Feedback response` )
      .should( "be.visible" )
      .parent()
      .within( () => {
        cy.contains( activity_date )
          .should( "be.visible" )
        cy.contains( "View Response" )
          .click()
      } )
    // assertion: should see survey response modal with correct stats
    cy.get( ".modal-title" )
      .should( "have.text", "Survey Response Details" )
      .and( "be.visible" )
    cy.get( `input[value="${ review_message }"]` )
      .should( "be.visible" )
    cy.contains( "button", "Dismiss" )
      .click()

    // assertion: should see left a feedback response log
    cy.contains( `${ user_data.name } responded to Feedback Request` )
      .should( "be.visible" )
      .parent()
      .within( () => {
        cy.contains( activity_date )
          .should( "be.visible" )
        cy.contains( "View Response" )
          .click()
      } )
    // assertion: should see survey response modal
    cy.get( ".modal-title" )
      .should( "have.text", "Survey Response Details" )
      .and( "be.visible" )
    cy.contains( "button", "Dismiss" )
      .click()

    // assertion: should see sent feedback request log
    cy.contains( `Cypress sent a Feedback Request to ${ user_data.name } at ${ dashboard.accounts.twilio.to_phone_number }` )
      .should( "be.visible" )
      .parent()
      .within( () => {
        cy.contains( activity_date )
          .should( "be.visible" )
      } )

    // assertion: should see added contact log
    cy.contains( "Added to your contact list: Sent Feedback Request" )
      .should( "be.visible" )
      .parent()
      .within( () => {
        cy.contains( activity_date )
          .should( "be.visible" )
      } )
  } )
} )
