describe( "Local Referrals - Sharing Page Options", () => {
  const faker = require( "faker" )
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const user_data = require( "../../fixtures/user_data" )

  context( "Qualification All/Friend - Test cases", () => {
    it( "Part 1 - Qualification all: Should see correct sharing options for advocate invite page", function() {
      // before
      cy.writeFile( "cypress/helpers/local_referrals/sharing_page.json", { } )
      const dashboard_username = base.createRandomUsername()
      const advocate_name = faker.name.firstName()
      base.login( admin_panel, "ac" )
      base.deleteMerchantAndTwilioAccount()
      base.deleteIntercomUsers()
      local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
      base.loginDashboard( dashboard_username )

      // send advocate invite
      cy.get( "@merchant_id" )
        .then( ( merchant_id ) => {
          local_referrals.sendAdvocateInvite( merchant_id, advocate_name, user_data.email )
        } )

      // assertion: should recieve advocate invite email with invite link
      cy.task( "checkEmail", { query: `${ advocate_name }, Earn Rewards By Referring Your Friends from: noreply@my-referral.co`, email_account: "email1" } )
        .then( ( email ) => {
          assert.isNotEmpty( email )
          cy.task( "getEmailElementAttribute", { email_id: email.data.id, email_account: "email1", element_text: "Invite Friends", element_attribute_name: "href", element_tag: "a" } )
            .then( ( advocate_link ) => {
              cy.readFile( "cypress/helpers/local_referrals/sharing_page.json" )
                .then( ( data ) => {
                  data.advocate_link = advocate_link
                  data.merchant_id = this.merchant_id
                  cy.writeFile( "cypress/helpers/local_referrals/sharing_page.json", data )
                  cy.visit( advocate_link )
                } )
            } )
        } )
      cy.contains( "Submit" )
        .click()

      // assertions: see sharing options: Email, Sharing link
      cy.get( `input[placeholder="Friend's Name"]` )
        .should( "be.visible" )
      cy.get( `input[placeholder="Friend's Email"]` )
        .should( "be.visible" )
      cy.contains( "a", "Or Click Here To Share With A Link" )
        .should( "be.visible" )
    } )

    it( "Part 2 - Qualification friend: Should be able to change LocalReferral Qualification to Friend", () => {
      base.login( admin_panel, "ac" )
      cy.readFile( "cypress/helpers/local_referrals/sharing_page.json" )
        .then( ( data ) => {
          assert.isDefined( data.merchant_id, "Merchant should have been created" )
          cy.visit( `${ admin_panel.host }/merchants/${ data.merchant_id }/local-referrals` )
        } )
      cy.contains( "General" )
        .click()

      // change qualification to friend
      cy.contains( "Qualification" )
        .children()
        .select( "Friend" )
      cy.contains( "button", "Save" )
        .click()

      // assertion: should see success message for saving settings
      cy.contains( "Merchant LocalReferrals information has been successfully updated." )
        .should( "be.visible" )
    } )

    it( "Part 3 - Qualification friend: Should see correct invite options on advocate invite page", () => {
      cy.readFile( "cypress/helpers/local_referrals/sharing_page.json" )
        .then( ( data ) => {
          assert.isDefined( data.advocate_link, "Advocate invite link should be found" )
          cy.visit( data.advocate_link )
        } )

      // assertions: should see sharing options: Email, Fb, Sharing link
      cy.contains( "button", "Email" )
        .should( "be.visible" )
      cy.contains( "button", "Facebook" )
        .should( "be.visible" )
      cy.contains( "Your Sharing Link" )
        .should( "be.visible" )
    } )
  } )
} )
