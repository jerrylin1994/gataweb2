describe( "LocalReferrals - Parent Child", () => {
  const dashboard = Cypress.env( "dashboard" )
  const admin_panel = Cypress.env( "admin" )
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const user_data = require( "../../fixtures/user_data" )
  const parent_username = base.createRandomUsername()
  const child_merchant_names = [ base.createMerchantName(), base.createMerchantName() ]
  const child_merchant_slug = []
  const advocate_name = user_data.name
  const advocate_email = user_data.email
  const friend_name = user_data.name2
  const friend_email = user_data.email2
  function getTableRowsText( headers, rows ) {
    const rowTextArray = []
    for( let i = 1; i <= rows; i++ ) {
      const rowText = {}
      for( const property in headers ) {
        cy.contains( "th", headers[ property ] ).invoke( "index" )
          .then( ( header_index ) => {
            cy.get( "tr" )
              .eq( i )
              .within( () => {
                cy.get( "td" )
                  .eq( header_index + 1 )
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
  function selectChild1() {
    cy.get( "#location-selector-toggle" )
      .click()
    cy.get( `md-checkbox[aria-label="${ child_merchant_names[ 0 ] }"]` )
      .click()
  }
  function assertChild2NotExistInTable() {
    cy.get( ".ol-table" )
      .within( () => {
        cy.contains( child_merchant_names[ 1 ] )
          .should( "not.exist" )
      } )
  }
  function assertChild1IsVisibleInTable() {
    cy.get( ".ol-table" )
      .within( () => {
        cy.contains( child_merchant_names[ 0 ] )
          .should( "be.visible" )
      } )
  }
  function addChildLocation( parent_merchant_id, child_merchant_id ) {
    return cy.request( {
      method: "PUT",
      url: `${ Cypress.env( "admin" ).host }/admin/merchants/${ parent_merchant_id }/subsidiary`,
      headers: {
        accept: "application/json"
      },
      body: {
        add: true,
        merchant_id: child_merchant_id
      }
    } )
  }
  function createParentDashboardUser( user_merchant_ids, username ) {
    return cy.request( {
      method: "POST",
      url: `${ Cypress.env( "dashboard" ).host }/merchants/${ user_merchant_ids[ 2 ] }/auth/actions`,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json"
      },
      body: {
        "type": "account_create",
        "data": {
          "user_type": "admin",
          "user_role_ids": [],
          user_merchant_ids,
          "login_type": "username",
          username,
          "password": "qwerty"
        }
      }
    } )
  }
  function createParentLocalReferralsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username, user_merchant_ids ) {
    return base.addMerchant( merchant_name, user_email )
      .then( ( response ) => {
        const parent_merchant_id = response.body.id
        cy.log( parent_merchant_id )
        user_merchant_ids.push( response.body.id )
        cy.wrap( parent_merchant_id ).as( "merchant_id" )
        local_referrals.enableLocalReferrals( parent_merchant_id )
        base.loginDashboardAsOnelocalAdmin( "ac", parent_merchant_id )
        createParentDashboardUser( user_merchant_ids, dashboard_username )
          .then( ( response ) => {
            base.updateDashboardUserPassword( parent_merchant_id, response.body.refs.account_ids[ 0 ] )
          } )
      } )
  }

  before( function() {
    base.login( admin_panel, "ac" )
    local_referrals.createLocalReferralsMerchantAndDashboardUser( child_merchant_names[ 0 ], user_data.email, base.createRandomUsername() )
      .then( () => {
        cy.wrap( this.merchant_id )
          .as( "child1_merchant_id" )
        local_referrals.setAdvocateAndFriendReward( this.merchant_id, advocate_reward_name, friend_reward_name )
      } )
    local_referrals.createLocalReferralsMerchantAndDashboardUser( child_merchant_names[ 1 ], user_data.email, base.createRandomUsername() )
      .then( () => {
        cy.wrap( this.merchant_id )
          .as( "child2_merchant_id" )
        local_referrals.setAdvocateAndFriendReward( this.merchant_id, advocate_reward_name, friend_reward_name )
      } )
    cy.wrap( null )
      .then( () => {
        createParentLocalReferralsMerchantAndDashboardUser( base.createMerchantName(), user_data.email, parent_username, [ this.child1_merchant_id, this.child2_merchant_id ] )
          .then( () => {
            local_referrals.setAdvocateAndFriendReward( this.merchant_id, advocate_reward_name, friend_reward_name )
            addChildLocation( this.merchant_id, this.child1_merchant_id )
            addChildLocation( this.merchant_id, this.child2_merchant_id )
          } )
      } )
    cy.get( "@child1_merchant_id" )
      .then( ( child1_merchant_id ) => {
        base.getMerchantById( child1_merchant_id )
          .then( ( response ) => {
            child_merchant_slug[ 0 ] = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, advocate_email, child_merchant_slug[ 0 ] )
              .then( ( response ) => {
                local_referrals.signUpAsFriend( friend_name, friend_email, child_merchant_slug[ 0 ], response.body.referrer_token )
              } )
          } )
      } )
    cy.get( "@child2_merchant_id" )
      .then( ( child2_merchant_id ) => {
        base.getMerchantById( child2_merchant_id )
          .then( ( response ) => {
            child_merchant_slug[ 1 ] = response.body.slug
            local_referrals.signUpAsAdvocate( advocate_name, advocate_email, child_merchant_slug[ 1 ] )
              .then( ( response ) => {
                local_referrals.signUpAsFriend( friend_name, friend_email, child_merchant_slug[ 1 ], response.body.referrer_token )
              } )
          } )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( parent_username )
  } )

  it( "Referral tab - should be able to view child referral details from parent context", () => {
    cy.intercept( "GET", "**/referral_magic/referrals**" )
      .as( "getReferrals" )
    cy.visit( `${ dashboard.host }/admin/local-referrals/referrals`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getReferrals" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    cy.contains( child_merchant_names[ 0 ] )
      .parents( "tr" )
      .contains( Cypress.dayjs().format( "MMM D, YYYY" ) )
      .click()
    // assertions: referral details page should have friend and advocate details
    cy.contains( "Friend Details" )
      .parent( "section" )
      .within( () => {
        cy.contains( friend_name )
          .should( "be.visible" )
        cy.contains( "Friend Email" )
          .siblings( "input" )
          .should( "have.value", friend_email )
        cy.contains( /^Promo$/ )
          .siblings( "input" )
          .should( "have.value", friend_reward_name )
      } )

    cy.contains( "Advocate Details" )
      .parent( "section" )
      .within( () => {
        cy.contains( advocate_name )
          .should( "be.visible" )
        cy.contains( "Advocate Email" )
          .siblings( "input" )
          .should( "have.value", advocate_email )
        cy.contains( /^Reward$/ )
          .siblings( "input" )
          .should( "have.value", advocate_reward_name )
      } )
  } )

  it( "Referrals tab - Should see child merchants on referral table and be able to filter by location", () => {
    cy.intercept( "GET", "**/referral_magic/referrals**" )
      .as( "getReferrals" )
    cy.visit( `${ dashboard.host }/admin/local-referrals/referrals`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getReferrals" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: referrals table should have correct number of headers
    base.assertTableHeaderCount( 7 )
    const tableRowsText = getTableRowsText( { updated: "Updated", status: "Status", location: "Location", advocate: "Advocate", friend: "Friend", service_date: "Service Date" }, 2 )
    // assertions: referral table should have both child merchants
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].updated, Cypress.dayjs().format( "MMM D, YYYY" ) )
          assert.equal( tableRowsText[ i ].status, "Incoming(Qualified)" )
          assert.equal( tableRowsText[ i ].location, child_merchant_names[ 1 - i ] )
          assert.include( tableRowsText[ i ].advocate, `${ advocate_name }${ advocate_email }` )
          assert.equal( tableRowsText[ i ].friend, `${ friend_name }${ friend_email }` )
          assert.equal( tableRowsText[ i ].service_date, "-" )
        } )
      } )

    // filter by child 1
    selectChild1()
    cy.wait( "@getReferrals" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: should only see child 1 in table
    assertChild2NotExistInTable()
    assertChild1IsVisibleInTable()
  } )

  it( "Advocates tab - Should see child merchants on advocate table and be able to filter by location", () => {
    cy.intercept( "GET", "**/referral_magic/advocates**" )
      .as( "getAdvocates" )
    cy.visit( `${ dashboard.host }/admin/local-referrals/advocates`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getAdvocates" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: advocate table should have correct number of headers
    base.assertTableHeaderCount( 6 )
    const tableRowsText = base.getTableRowsText( { advocate: "Advocate", advocate_link_code: "Advocate Promo Code / Link", location: "Location", friends_referred: "# Of Friends Referred", friends_purchased: "# Of Friends Who Purchased", rewards_earned: "# Of Rewards Earned" }, 2 )
    // advocate table should have both child merchants
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i ].advocate, `${ advocate_name }${ advocate_email }` )
          assert.include( tableRowsText[ i ].advocate_link_code, "Copy Link" )
          assert.equal( tableRowsText[ i ].location, child_merchant_names[ i ] )
          assert.equal( tableRowsText[ i ].friends_referred, "1" )
          assert.equal( tableRowsText[ i ].friends_purchased, "0" )
          assert.equal( tableRowsText[ i ].rewards_earned, "0" )
        } )
      } )

    // filter by child 1
    selectChild1()
    cy.wait( "@getAdvocates" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: should only see child 1 in table
    assertChild2NotExistInTable()
    assertChild1IsVisibleInTable()
  } )

  it( "Location tab - Should see child merchants on location table and be able to filter by location", () => {
    cy.intercept( "GET", "**/location_stats" )
      .as( "getLocationStats" )
    cy.visit( `${ dashboard.host }/admin/local-referrals/advocates`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.contains( "a", "Locations" )
      .click()
    cy.wait( "@getLocationStats" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    const child_merchant_names_sorted = [ ...child_merchant_names ].sort()
    const child_merchant_slug_sorted = [ ...child_merchant_slug ].sort()
    // assertion: Location table should have correct number of headers
    base.assertTableHeaderCount( 8 )
    const tableRowsText = base.getTableRowsText( { location: "Location", advocates: "Advocates", referrals: "Referrals", purchases: "Purchases", conversion: "Conversion", advocate_reward: "Reward For Advocate", friend_reward: "Reward For Friend", referral_link: "LocalReferrals link" }, 3 )
    // assertion: location table should have both child merchants
    cy.wrap( null )
      .then( () => {
        assert.equal( tableRowsText[ 0 ].location, "All Locations" )
        assert.equal( tableRowsText[ 0 ].advocates, "2" )
        assert.equal( tableRowsText[ 0 ].referrals, "2" )
        assert.equal( tableRowsText[ 0 ].purchases, "0" )
        assert.equal( tableRowsText[ 0 ].conversion, "0 %" )
        assert.equal( tableRowsText[ 0 ].advocate_reward, "-" )
        assert.equal( tableRowsText[ 0 ].friend_reward, "-" )
        assert.equal( tableRowsText[ 0 ].referral_link, "-" )
      } )
    cy.wrap( null )
      .then( () => {
        [ 0, 1 ].forEach( ( i ) => {
          assert.equal( tableRowsText[ i + 1 ].location, child_merchant_names_sorted[ i ] )
          assert.equal( tableRowsText[ i + 1 ].advocates, "1" )
          assert.equal( tableRowsText[ i + 1 ].referrals, "1" )
          assert.equal( tableRowsText[ i + 1 ].purchases, "0" )
          assert.equal( tableRowsText[ i + 1 ].conversion, "0 %" )
          assert.equal( tableRowsText[ i + 1 ].advocate_reward, advocate_reward_name )
          assert.equal( tableRowsText[ i + 1 ].friend_reward, friend_reward_name )
          assert.equal( tableRowsText[ i + 1 ].referral_link, `…/${ child_merchant_slug_sorted[ i ] }` )
        } )
      } )

    // filter by child 1
    selectChild1()
    cy.wait( "@getLocationStats" )
    cy.contains( "Loading…" )
      .should( "not.exist" )
    // assertion: should only see child 1 in table
    assertChild2NotExistInTable()
    assertChild1IsVisibleInTable()
  } )

  it( "Analytics tab - Should see stats for child merchants and be able to filter by location", () => {
    cy.visit( `${ dashboard.host }/admin/local-referrals/analytics`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    // assertion: Referrals number should be 2
    cy.get( `ol-stats-card[header-text="Referrals"]` )
      .contains( "span", "2" )
      .should( "be.visible" )
    // assertion: most active advocates table should have correct number of headers
    base.assertTableHeaderCount( 3 )
    // assertion: most active advocate table content should have both child merchants
    cy.get( `ol-stats-card[header-text="Most Active Advocates"]` )
      .within( () => {
        const tableRowText = base.getTableRowsText( { name: "Name", location: "Location", referrals: "# of Referrals" }, 2 )
        cy.wrap( null )
          .then( () => {
            [ 0, 1 ].forEach( ( i ) => {
              assert.equal( tableRowText[ i ].name, advocate_name )
              assert.equal( tableRowText[ i ].location, child_merchant_names[ i ] )
              assert.equal( tableRowText[ i ].referrals, "1" )
            } )
          } )
      } )
    // filter by child 1
    selectChild1()
    // assertion: Referral number should only be 1
    cy.get( `ol-stats-card[header-text="Referrals"]` )
      .contains( "span", "1" )
      .should( "be.visible" )
    // assertions: should only see child 1 in the most active advocate table
    cy.get( ".ol-table-stats" )
      .within( () => {
        cy.contains( child_merchant_names[ 0 ] )
          .click()
          .should( "be.visible" )
        cy.contains( child_merchant_names[ 1 ] )
          .should( "not.exist" )
      } )
  } )

  it( "Reward Tab - Should be able to confirm child referral, redeeem reward from parent context, and filter rewards table by location", () => {
    cy.intercept( "GET", "**/referrals**" )
      .as( "getReferrals" )
    cy.intercept( "GET", "**/rewards**" )
      .as( "getRewards" )
    cy.visit( `${ dashboard.host }/admin/local-referrals/referrals`, { onBeforeLoad: ( win ) => { win.sessionStorage.clear() } } )
    cy.wait( "@getReferrals" )
    cy.contains( "Loading…" )
      .should( "not.exist" )

    // confirm child 1 referral
    cy.contains( child_merchant_names[ 0 ] )
      .parents( "tr" )
      .contains( "button", "Confirm" )
      .click()
    cy.get( "form" )
      .within( () => {
        cy.get( ".processing-period-input" )
          .clear()
          .type( "0" )
        cy.contains( "button", "Confirm" )
          .click()
      } )
    // assertion: should see success message for confirming child 1 referral
    cy.contains( "Referral Confirmed" )
      .should( "be.visible" )

    // redeem child 1 reward
    cy.contains( "a", "Rewards" )
      .click()
    cy.contains( "button", "Redeem" )
      .click()
    cy.contains( "button", "Confirm" )
      .click()
    // assertion: should see success message for redeeming child 1 reward
    cy.contains( "Reward Redeemed" )
      .should( "be.visible" )
    // assertion: reward table should have correct number of headers
    base.assertTableHeaderCount( 7 )
    const rewardTableRowText = base.getTableRowsText( { date: "Date", status: "Status", location: "Location", reward_code: "Reward Code", advocate: "Advocate", advocate_reward: "Reward For Advocate" }, 1 )[ 0 ]
    // assertion: reward table should have have child 1 reward
    cy.wrap( null )
      .then( () => {
        assert.equal( rewardTableRowText.date, Cypress.dayjs().format( "MMM D, YYYY" ) )
        assert.equal( rewardTableRowText.status, "Redeemed" )
        assert.equal( rewardTableRowText.location, child_merchant_names[ 0 ] )
        assert.equal( rewardTableRowText.advocate, `${ advocate_name }${ advocate_email }` )
        assert.equal( rewardTableRowText.advocate_reward, advocate_reward_name )
      } )

    // filter by child 1
    selectChild1()
    cy.wait( "@getRewards" )
    cy.contains( "Loading…" )
      .should( "not.be.visible" )
    // assertion: should only see child 1 in table
    assertChild2NotExistInTable()
    assertChild1IsVisibleInTable()
  } )
} )
