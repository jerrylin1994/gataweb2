describe( "My Login application", () => {
  const twilio_tester = require( "../../helpers/twilio_tester" )
  const local_reviews = require( "../../support/local_reviews" )
  const base = require( "../../support/base" )
  const user_data = require( "../../helpers/user_data" )
  const review = "great place best nice staff"
  const db = require( "../../helpers/db" )
  let fb_logged_in = ""

  before( () => {
    // delete previous facebook post
    browser.url( "https://www.facebook.com/pg/Krisp-Klean-1916995865260491/reviews/?ref=page_internal" )
    $( "span=Krisp Klean" ).waitForDisplayed()
    const isReviewPresent = $( `p=${ review }` ).isDisplayed()
    if( isReviewPresent ) {
      $( "#email" ).waitAndType( "jerry.l@onelocal.com" )
      $( "#pass" ).waitAndType( "Hunter94." )
      $( "#loginbutton" ).waitAndClick()
      fb_logged_in = true
      $( "//a[@data-testid=\"post_chevron_button\"][1]" ).waitAndClick()
      $( "span=Delete" ).waitAndClick()
      $( "button=Delete" ).waitAndClick()
      $( "h3=Delete Post?" ).waitForExist( { reverse: true } )
    }

    db.disconnectKrispKleanFbReviewsAcct()
    base.login()
    base.deleteMerchantAndTwilioAccount()
    base.deleteIntercomUsers()
  } )

  it( "Should be able to leave Facebook review have correct review attribution", () => {
    const dashboard_username = base.createRandomUsername()
    const merchant_name = base.createMerchantName()
    const sent_text = `Hi Jerry, Thanks for choosing ${ merchant_name }`
    let merchant_id = ""
    let employee_id = ""

    // create LocalReviews Merchant and dashboard user
    browser.call( () => {
      return local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
        .then( ( response ) => {
          merchant_id = response.merchant_id
          employee_id = response.employee_id
        } )
    } )

    base.loginDashboard( dashboard_username )
    local_reviews.connectFbAccount( merchant_id )

    // enable review attribution
    browser.url( `${ browser.config.admin.host }/merchants/${ merchant_id }/local-reviews` )
    $( "span=Enable Review Attribution" ).waitAndClick()
    $( "button=Save" ).waitAndClick()

    // assertion: should see success message for enabling review attribution
    expect( $( "div=Merchant LocalReviews information has been successfully updated." ) ).toBeDisplayed()

    // send review request
    browser.call( () => {
      return local_reviews.getSurveyTemplates( merchant_id )
        .then( ( response ) => {
          const survey_id = response[ 0 ].id
          return local_reviews.sendReviewRequest( merchant_id, survey_id, employee_id, browser.config.dashboard.accounts.twilio.to_phone_number, "Jerry Lin" )
        } )
    } )

    // open survey and choose to leave feedback with fb
    browser.call( () => {
      return twilio_tester.checkTwilioText( browser.config.dashboard.accounts.twilio.SID, browser.config.dashboard.accounts.twilio.auth_token, browser.config.dashboard.accounts.twilio.to_phone_number, browser.config.dashboard.accounts.twilio.phone_number, sent_text )
        .then( ( response ) => {
          const review_link = response.substring( response.lastIndexOf( ":" ) - 5 )
          browser.url( review_link )
        } )
    } )
    $( "button=Get started" ).waitAndClick()
    expect( $( "h1=Use Google to leave us a review?" ) ).toBeDisplayed()
    $( "button=No" ).waitAndClick()
    expect( $( "h1=Use Facebook to leave us a review?" ) ).toBeDisplayed()
    $( "button=Yes" ).waitAndClick()

    // login to facebook and post a new review
    if( ! fb_logged_in ) {
      $( "#email" ).waitAndType( "jerry.l@onelocal.com" )
      $( "#pass" ).waitAndType( "Hunter94." )
      $( "#loginbutton" ).waitAndClick()
    }
    $( "span=Krisp Klean" ).waitForDisplayed()
    $( "div=Yes" ).waitAndClick()
    $( "button=Post" ).waitForDisplayed()
    $$( ".navigationFocus" )[ 1 ].click()
    browser.keys( [ "g", "r", "e", "a", "t", " ", "p", "l", "a", "c", "e", " ", "b", "e", "s", "t", " ", "n", "i", "c", "e", " ", "s", "t", "a", "f", "f" ] )
    $( "button=Post" ).waitAndClick()
    $( "h3=Krisp Klean" ).waitForExist( { reverse: true } )

    // pull new reviews in admin panel
    browser.url( `${ browser.config.admin.host }/merchants/${ merchant_id }/local-reviews` )
    $( "button=Pull New Reviews" ).waitAndClick()

    // assertion: should be see success message for pulling new reviews
    expect( $( "div=The reviews has been pulled." ) ).toBeDisplayed()

    // go to reviews tab in dashboard
    browser.url( `${ browser.config.dashboard.host }/admin/local-reviews/reviews` )
    $( ".ol-table" ).waitForDisplayed()

    // assertions: reviews table stats should be correct including review attribution
    expect( $( "//tr[@ng-repeat=\"review in reviews\"][1]/td[2]" ) ).toHaveTextContaining( "WDIO" )
    expect( $( "//tr[@ng-repeat=\"review in reviews\"][1]/td[3]" ) ).toHaveTextContaining( "Jerry Lin" )
    expect( $( "//tr[@ng-repeat=\"review in reviews\"][1]/td[4]/img" ) ).toHaveAttr( "src", `${ browser.config.dashboard.host }/assets/review-edge/face-positive.svg` )
    expect( $( "//tr[@ng-repeat=\"review in reviews\"][1]/td[5]/img" ) ).toHaveAttr( "src", `${ browser.config.dashboard.host }/assets/review-edge/logo-facebook.svg` )
    expect( $( "//tr[@ng-repeat=\"review in reviews\"][1]/td[6]" ) ).toHaveTextContaining( review )
  } )
} )
