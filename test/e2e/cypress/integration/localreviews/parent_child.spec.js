describe( "LocalReviews - Parent Child", () => {
  const dashboard = Cypress.env( "dashboard" )
  const review_date = "Jul 22, 2020"
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const yelp_id = "https://www.yelp.ca/biz/wendys-daly-city"
  const children = [
    {
      name: "Jerry",
      email: "jerry.l@onelocal.com",
      review_message: "Great Review!",
      merchant_name: "Stage Cypress Automation (Child)"
    },
    {
      name: "Jerry Lin",
      email: "jerry.l+2@onelocal.com",
      review_message: "Great Review 2!",
      merchant_name: "Stage Cypress Automation 2 (Child)"
    }
  ]
  function selectChild1() {
    cy.get( "#location-selector-toggle" )
      .click()
    cy.get( "md-checkbox[aria-label=\"Stage Cypress Automation (Child)\"]" )
      .click()
  }
  function assertChild2NotExistInTable() {
    cy.get( ".ol-table" )
      .within( () => {
        cy.contains( children[ 1 ].merchant_name )
          .should( "not.exist" )
      } )
  }
  function assertDashboardTabStats( child ) {
    cy.contains( child.merchant_name )
      .should( "be.visible" )
    cy.contains( child.review_message )
      .should( "be.visible" )
    cy.contains( child.name )
      .should( "be.visible" )
    cy.contains( review_date )
      .should( "be.visible" )
  }
  function assertLeaderboardTableHeaderCount( count ) {
    cy.get( ".grouped-th" )
      .then( ( elements ) => {
        assert.equal( elements.length, count )
      } )
  }
  function getLocationTableRowsText( headers, rows ) {
    const rowTextArray = []
    for( let i = 1; i <= rows; i++ ) {
      const rowText = {}
      for( const property in headers ) {
        cy.contains( "th", headers[ property ] ).invoke( "index" )
          .then( ( header_index ) => {
            cy.get( "tr" )
              .eq( i + 1 )
              .within( () => {
                cy.get( "td" )
                  .eq( header_index )
                  .invoke( "text" )
                  .then( ( text ) => {
                    rowText[ property ] = text
                  } )
              } )
          } )
      }
      rowTextArray.push( rowText )
    }
    return rowTextArray
  }
  function getLeaderboardTableRowText( headers, rows ) {
    const rowTextArray = []
    for( let i = 1; i <= rows; i++ ) {
      const rowText = {}
      for( const property in headers ) {
        cy.contains( "th", headers[ property ] ).invoke( "index" )
          .then( ( header_index ) => {
            cy.get( "tr" )
              .eq( i + 2 )
              .within( () => {
                cy.get( "td" )
                  .eq( header_index )
                  .invoke( "text" )
                  .then( ( text ) => {
                    rowText[ property ] = text
                  } )
              } )
          } )
      }
      rowTextArray.push( rowText )
    }
    return rowTextArray
  }

  beforeEach( () => {
    base.login( dashboard, "parent" )
  } )

  it( "Dashboard tab - Should be able to see new completed review and stats", () => {
    local_reviews.deleteConnectedAccount( dashboard.accounts.child.merchant_id, "yelp" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )

    // assertion: should be able to see both reviews in recent reviews section
    cy.get( ".recent-reviews-item" )
      .eq( 0 )
      .within( () => {
        assertDashboardTabStats( children[ 1 ] )
      } )
    cy.get( ".recent-reviews-item" )
      .eq( 1 )
      .within( () => {
        assertDashboardTabStats( children[ 0 ] )
      } )

    // assertion: should be able to see correct stats in the review cards section
    cy.get( ".reviews-card" )
      .eq( 0 )
      .within( () => {
        cy.get( ".stat-text" )
          .eq( 0 )
          .should( "have.text", "2" )
        cy.get( ".stat-text" )
          .eq( 1 )
          .should( "have.text", "100" )
        cy.get( ".stat-text" )
          .eq( 2 )
          .should( "have.text", "100" )
      } )
  } )

  it( "Reviews tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/reviews?**" )
      .as( "getReviews" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/reviews`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getReviews" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 6 )

    const tableRowsText = base.getTableRowsText( { date: "Date", location: "Location", contact: "Contact", comment: "Comment" }, 2 )
    const tableRowsImgSrc = base.getTableRowsImgSrc( { sentiment: "Sentiment", source: "Source" }, 2 )

    // assertion: should see correct stats for both child merchants
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].date, review_date )
          assert.equal( tableRowsText[ i ].location, children[ 1 - i ].merchant_name )
          assert.equal( tableRowsText[ i ].contact, children[ 1 - i ].name )
          assert.include( tableRowsText[ i ].comment, children[ 1 - i ].review_message )
          assert.equal( tableRowsImgSrc[ i ].sentiment, "/assets/review-edge/face-positive.svg" )
          assert.equal( tableRowsImgSrc[ i ].source, "/assets/review-edge/logo-reviewedge.svg" )
        } )
      } )

    // assertion: stats in the review details modal should be correct for child 2
    cy.contains( review_date )
      .click()
    cy.get( ".review-details-modal" )
      .should( "be.visible" )
    cy.get( "input[name=\"reviewer_name\"]" )
      .should( "have.value", children[ 1 ].name )
    cy.get( "input[name=\"source\"]" )
      .should( "have.value", "Feedback Request" )
    cy.get( "input[name=\"rating\"]" )
      .should( "have.value", "Positive" )
    cy.contains( "textarea", children[ 1 ].review_message )
      .should( "be.visible" )
  } )

  it( "Reviews tab - Should be able to filter by location", () => {
    cy.intercept( "GET", "**/reviews?**" )
      .as( "getReviews" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/reviews`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getReviews" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    const tableRowsText = base.getTableRowsText( { location: "Location", contact: "Contact", comment: "Comment" }, 1 )
    selectChild1()

    // assertions: Should only see stats for child 1
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].location, children[ 1 ].merchant_name )
        assert.equal( tableRowsText[ 0 ].contact, children[ 1 ].name )
        assert.include( tableRowsText[ 0 ].comment, children[ 1 ].review_message )
      } )
    cy.get( ".reviews-table-container" )
      .within( () => {
        cy.contains( children[ 1 ].merchant_name )
          .should( "not.exist" )
      } )
  } )

  it( "Surveys tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/survey_templates**" )
      .as( "getSurveys" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/surveys`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getSurveys" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 7 )

    const tableRowsText = base.getTableRowsText( { name: "Name", location: "Location", date_created: "Date Created", request_sent: "# of Requests Sent", open_rate: "Open Rate", response_count: "# of Responses", completion_rate: "Completion Rate" }, 2 )

    // assertions: survey tab table should have correct stats for both childs
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].name, "1. Online Review" )
          assert.equal( tableRowsText[ i ].location, children[ i ].merchant_name )
          assert.equal( tableRowsText[ i ].date_created, review_date )
          assert.equal( tableRowsText[ i ].request_sent, "1" )
          assert.equal( tableRowsText[ i ].open_rate, "1 (100 %)" )
          assert.equal( tableRowsText[ i ].response_count, "1" )
          assert.equal( tableRowsText[ i ].completion_rate, "1 (100 %)" )
        } )
      } )
  } )

  it( "Surveys tab - Should be able to filter by location", () => {
    cy.visit( `${ dashboard.host }/admin/local-reviews/surveys`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.intercept( "GET", "**/survey_templates**" )
      .as( "getSurveys" )
    selectChild1()
    cy.wait( "@getSurveys" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    const tableRowsText = base.getTableRowsText( { name: "Name", location: "Location", date_created: "Date Created", request_sent: "# of Requests Sent", open_rate: "Open Rate", response_count: "# of Responses", completion_rate: "Completion Rate" }, 1 )

    // assertions: Should only see stats for child 1
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].name, "1. Online Review" )
        assert.equal( tableRowsText[ 0 ].location, children[ 0 ].merchant_name )
        assert.equal( tableRowsText[ 0 ].date_created, review_date )
        assert.equal( tableRowsText[ 0 ].request_sent, "1" )
        assert.equal( tableRowsText[ 0 ].open_rate, "1 (100 %)" )
        assert.equal( tableRowsText[ 0 ].response_count, "1" )
        assert.equal( tableRowsText[ 0 ].completion_rate, "1 (100 %)" )
      } )
    assertChild2NotExistInTable()
  } )

  it( "Requests tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/survey_requests?**" )
      .as( "getSurveyRequests" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/requests`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getSurveyRequests" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 6 )

    const tableRowsText = base.getTableRowsText( { date_sent: "Date Sent", location: "Location", sent_to: "Sent To", sent_by: "Sent By", template: "Template", opened: "Opened" }, 2 )

    // assertion: requests tab table should have correct stats for both childs
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].date_sent, review_date )
          assert.equal( tableRowsText[ i ].location, children[ 1 - i ].merchant_name )
          assert.equal( tableRowsText[ i ].sent_to, `${ children[ 1 - i ].name }${ children[ 1 - i ].email }` )
          assert.include( tableRowsText[ i ].sent_by, "Manual" )
          assert.include( tableRowsText[ i ].sent_by, "Jerry Lin" )
          assert.equal( tableRowsText[ i ].template, "1. Online Review" )
          assert.equal( tableRowsText[ i ].opened, review_date )
        } )
      } )
  } )

  it( "Requests tab - Should be able to filter by location", () => {
    cy.visit( `${ dashboard.host }/admin/local-reviews/requests`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.intercept( "GET", "**/survey_requests**" )
      .as( "getSurveyRequests" )
    selectChild1()
    cy.wait( "@getSurveyRequests" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    const tableRowsText = base.getTableRowsText( { date_sent: "Date Sent", location: "Location", sent_to: "Sent To", sent_by: "Sent By", template: "Template", opened: "Opened" }, 1 )
    // assertions: Should only see stats for child 1
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].location, children[ 0 ].merchant_name )
        assert.equal( tableRowsText[ 0 ].sent_to, `${ children[ 0 ].name }${ children[ 0 ].email }` )
      } )
    assertChild2NotExistInTable()
  } )

  it( "Locations tab - Should see correct stats", () => {
    cy.intercept( "GET", "**/location_stats" )
      .as( "getLocationStats" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/dashboard`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )

    cy.contains( "Locations" )
      .click()
    cy.wait( "@getLocationStats" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertion: table header count should be correct
    base.assertTableHeaderCount( 8 )

    const tableRowsText = getLocationTableRowsText( { location: "Location", positive_sentiment: "Positive Sentiment", nps: "NPS" }, 2 )

    // assertion: locations tab table should have correct stats for both childs
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].location, children[ i ].merchant_name )
          assert.equal( tableRowsText[ i ].positive_sentiment, "100 %" )
          assert.equal( tableRowsText[ i ].nps, "100" )
        } )
      } )
  } )

  it( "Locations tab - Should be able to filter by location", () => {
    cy.intercept( "GET", "**/location_stats" )
      .as( "getLocationStats" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/locations`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    selectChild1()
    cy.wait( "@getLocationStats" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    const tableRowsText = getLocationTableRowsText( { location: "Location", positive_sentiment: "Positive Sentiment", nps: "NPS" }, 1 )

    // assertions: Should only see stats for child 1
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].location, children[ 0 ].merchant_name )
        assert.equal( tableRowsText[ 0 ].positive_sentiment, "100 %" )
        assert.equal( tableRowsText[ 0 ].nps, "100" )
      } )
    assertChild2NotExistInTable()
  } )

  it( "Leaderboard - Should see correct stats", () => {
    cy.intercept( "**/review_edge/leaderboard" )
      .as( "getLeaderboard" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/analytics/leaderboard`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getLeaderboard" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // assertions: Should only see stats for child 1
    assertLeaderboardTableHeaderCount( 9 )

    const tableRowsText = getLeaderboardTableRowText( { sent_by: "Sent By", location: "Location", all_time: "All Time", open_rate: "Open Rate", positive_score: "Positive", neutral_score: "Neutral", negative_score: "Negative" }, 2 )

    // assertion: leaderboard stats should be correct for both childs
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].sent_by, "Jerry Lin" )
          assert.equal( tableRowsText[ i ].location, children[ i ].merchant_name )
          assert.equal( tableRowsText[ i ].all_time, "1" )
          assert.equal( tableRowsText[ i ].open_rate, "100 %" )
          assert.equal( tableRowsText[ i ].positive_score, "100 %" )
          assert.equal( tableRowsText[ i ].neutral_score, "0 %" )
          assert.equal( tableRowsText[ i ].negative_score, "0 %" )
        } )
      } )
  } )

  it( "Leaderboard  tab - Should be able to filter by location", () => {
    cy.intercept( "**/leaderboard" ).as( "getLeaderboard" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/analytics/leaderboard`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getLeaderboard" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    selectChild1()
    const tableRowsText = getLeaderboardTableRowText( { location: "Location" }, 1 )

    // assertion: should only see leaderboard stats for child 1
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].location, children[ 0 ].merchant_name )
      } )
    assertChild2NotExistInTable()
  } )

  it( "Should be able to connect Yelp account to child merchant from parent merchant", () => {
    local_reviews.deleteConnectedAccount( dashboard.accounts.child.merchant_id, "yelp" )
    base.loginDashboardAsOnelocalAdmin( "ac", dashboard.accounts.parent.merchant_id )
    cy.visit( `${ dashboard.host }/admin/settings/local-reviews/accounts`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.contains( children[ 0 ].merchant_name )
      .siblings()
      .then( ( elements ) => {
        cy.wrap( elements[ 2 ] ).within( () => {
          cy.contains( "Connect" )
            .click()
        } )
      } )

    // connect yelp account
    cy.get( "input[name=\"location_id\"]" )
      .type( yelp_id )
    cy.get( "md-select[name=\"type\"]" )
      .click()
    cy.contains( "Yelp" )
      .click()
    cy.contains( "Confirm" )
      .click()

    // assertion: should see success message
    cy.contains( "Added connected account" )
      .should( "be.visible" )

    // go to connected accounts section of child
    base.login( dashboard, "child" )
    cy.visit( `${ dashboard.host }/admin/settings/local-reviews/accounts` )
    cy.contains( "Yelp" )
      .parents( ".reviewedge-connected-account" )
      .within( () => {
        // assertion: yelp page should be connected on child merchant
        cy.contains( "Connected" )
          .should( "be.visible" )
      } )
  } )
} )
