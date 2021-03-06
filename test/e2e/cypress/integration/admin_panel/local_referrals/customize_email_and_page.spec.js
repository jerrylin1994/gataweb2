describe( "Admin Panel - LocalReferrals - Customize Email and Page", () => {
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../../support/base" )
  const user_data = require( "../../../fixtures/user_data" )
  const local_referrals = require( "../../../support/local_referrals" )
  const advocate_name = user_data.name
  const advocate_invite_email_subject = "Advocate invite email subject - edited"
  const advocate_invite_email_content = "Advocate invite email content - edited"
  const email_cta_text = "Click here in the email"
  const page_cta_text = "Click here in the page"
  const page_content = "Sign up to be a advocate and earn rewards"
  const email_text_color = "#cf0a2d"
  const page_background_color_hex = "#cf0a2d"
  const page_background_color_rgb = "rgb(207, 10, 45)"

  it( "Part 1 - Should be able to customize advocate invite email + sign up page content, cta, and color", () => {
    // before
    base.login( admin_panel, "ac" )
    base.deleteMerchantAndTwilioAccount()
    local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, base.createRandomUsername() )
    cy.writeFile( "cypress/helpers/admin_panel/local-referrals.json", { } )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }/local-referrals` )
      } )

    // edit advocate invite email
    cy.contains( "a", "Emails Settings" )
      .click()
    cy.contains( "a", "Advocate Invite" )
      .click()
    cy.contains( "Subject" )
      .find( "input" )
      .clear()
      .type( advocate_invite_email_subject )
    cy.get( ".ql-editor" )
      .clear()
      .type( advocate_invite_email_content )
    cy.contains( "CTA Text" )
      .find( "input" )
      .clear()
      .type( email_cta_text )
    cy.contains( "button", "Confirm" )
      .click()
    // assertion: should see success message for saving email settings
    cy.contains( "Merchant LocalReferrals information has been successfully updated." )
      .should( "be.visible" )

    // edit email text color
    cy.contains( "Text Color" )
      .find( "input" )
      .clear()
      .type( email_text_color )
    cy.get( `div[heading="Emails Settings"]` )
      .contains( "button", "Save" )
      .click()
    // assertion: should see success message for saving email text color
    cy.contains( "Merchant LocalReferrals information has been successfully updated." )
      .should( "be.visible" )

    // edit advocate invite page
    cy.contains( "a", "Pages" )
      .click()
    cy.contains( "a", "Advocate Signup" )
      .click()
    cy.contains( "CTA Text" )
      .find( "input" )
      .clear()
      .type( page_cta_text )
    cy.get( ".ql-editor" )
      .clear()
      .type( page_content )
    cy.contains( "button", "Confirm" )
      .click()
    // assertion: should see success message for saving advocate page content
    cy.contains( "Merchant LocalReferrals information has been successfully updated." )
      .should( "be.visible" )

    // edit referral page background color
    cy.contains( "Page Background Color" )
      .find( "input" )
      .clear()
      .type( page_background_color_hex )
    cy.get( `div[heading="Pages"]` )
      .contains( "button", "Save" )
      .click()
    // assertion: should see success message for saving page background color
    cy.contains( "Merchant LocalReferrals information has been successfully updated." )
      .should( "be.visible" )

    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        cy.writeFile( "cypress/helpers/admin_panel/local-referrals.json", {
          email_and_page_edited: true,
          merchant_id
        } )
      } )
  } )

  it( "Part 2 - Should be able to see custom cta and content in advocate invite email and sign up page", () => {
    const old_survey_link = `${ dashboard.referral_sharing_link }/test-account-1/DWM215R`
    cy.visit( old_survey_link ) // visit old survey link to avoid restarting test when visiting a domain different from baseUrl
    cy.readFile( "cypress/helpers/admin_panel/local-referrals.json" )
      .then( ( data ) => {
        assert.isTrue( data.email_and_page_edited, "Adovocate Email and Page should have been edited" )
        // send advocate invite
        base.loginDashboardAsOnelocalAdmin( "ac", data.merchant_id )
        local_referrals.sendAdvocateInvite( data.merchant_id, advocate_name, user_data.email )
      } )

    // assertion: should receive advocate invite email with edited email subject and content
    cy.task( "checkEmail", { query: `${ advocate_invite_email_subject } ${ advocate_invite_email_content } from: noreply@my-referral.co`, email_account: "email1" } )
      .then( ( email ) => {
        assert.isNotEmpty( email )
        // assertion: email text color should be the edited color
        cy.task( "getEmailElementAttribute", { email_id: email.data.id, email_account: "email1", element_text: advocate_invite_email_content, element_attribute_name: "style", element_tag: "div" } )
          .then( ( email_text_style ) => {
            assert.include( email_text_style, `color: ${ email_text_color }` )
          } )
        // assertion: should see correct edited cta text in advocate email
        cy.task( "getEmailElementAttribute", { email_id: email.data.id, email_account: "email1", element_text: email_cta_text, element_attribute_name: "href", element_tag: "a" } )
          .then( ( advocate_signup_link ) => {
            assert.isNotEmpty( advocate_signup_link )
            cy.request( {
              url: advocate_signup_link,
              followRedirect: false
            } )
              .then( ( xhr ) => {
                cy.visit( xhr.redirectedToUrl )
              } )
          } )
      } )

    // assertions: should see new cta and page content in the advocate sign up page
    cy.contains( "button", page_cta_text )
      .should( "be.visible" )
    cy.contains( page_content )
      .should( "be.visible" )
    // assertion: advocate signup page background color should be correct
    cy.get( ".referral-magic-background" )
      .should( "have.css", "background-color", page_background_color_rgb )
  } )
} )
