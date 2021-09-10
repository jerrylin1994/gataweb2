describe( "LocalReferrals - Advocate Sign Up", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const advocate_name = user_data.name
  const advocate_email = user_data.email

  Cypress.testFilter( [ ], () => {
    context( "Advocate sign up via sharing link test cases", () => {
      it( "Part 1 - Should see sharing link on LocalReferrals About page", function() {
        cy.writeFile( "cypress/helpers/local_referrals/advocate.json", { } )
        const dashboard_username = base.createRandomUsername()
        base.login( admin_panel, "ac" )
        cy.writeFile( "cypress/helpers/local_referrals/advocate.json", {} )
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
          } )
        base.loginDashboard( dashboard_username )

        // get referral sharing link
        cy.visit( `${ dashboard.host }/admin/local-referrals/about` )
        cy.contains( "Your LocalReferrals Link" )
          .children( "a" )
          .invoke( "text" )
          .then( ( sharing_link ) => {
          // assertion: should see sharing link on about page
            assert.isNotEmpty( sharing_link )
            cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
              .then( ( data ) => {
                data.dashboard_username = dashboard_username
                data.merchant_id = this.merchant_id
                data.sharing_link = sharing_link
                cy.writeFile( "cypress/helpers/local_referrals/advocate.json", data )
              } )
          } )
      } )

      it( "Part 2 - Should be able to sign up as an advocate via sharing link and Advocate sign up and sharing page should have correct content", () => {
        cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
          .then( ( data ) => {
            assert.isDefined( data.sharing_link, "Sharing link should be found" )
            cy.visit( data.sharing_link )
          } )

        // sign up as advocate
        cy.get( "#name" )
          .type( advocate_name )
        cy.get( "#email" )
          .type( advocate_email )
        // assertion: should see correct content on advocate sign up page
        cy.contains( `Refer a friend & get a ${ advocate_reward_name }` )
          .should( "be.visible" )
        cy.contains( `Simply introduce us to your friends with your sharing link and we’ll give them a ${ friend_reward_name } after their first appointment/project/purchase/service!` )
          .should( "be.visible" )
        cy.contains( `You get a ${ advocate_reward_name } following each friend’s first transaction. It’s that easy!` )
          .should( "be.visible" )
        cy.contains( "button", "Submit" )
          .click()
        // assertion: should see success message for signing up as an advocate
        cy.contains( "Success!" )
          .should( "be.visible" )
        // assertion: should see correct content for advocate sharing page
        cy.contains( `Refer friends, & get a ${ advocate_reward_name }` )
          .should( "be.visible" )
        cy.contains( `Send your friends a ${ friend_reward_name } with your sharing link.` )
          .should( "be.visible" )
      } )
    } )
  } )

  Cypress.testFilter( [ "@smoke" ], () => {
    context.only( "Advocate sign up via email, advocate table content, and activity log test cases", () => {
      it( "Part 1 - Should be able to send an email advocate invite", function() {
        cy.visit( `${ dashboard.host }` ) // avoid test restart in the middle of test
        base.createUserEmail()
        const dashboard_username = base.createRandomUsername()
        base.login( admin_panel, "ac" )
        // base.deleteMerchants()
        // base.deleteMerchantAndTwilioAccount()
        base.deleteIntercomUsers()
        cy.writeFile( "cypress/helpers/local_referrals/advocate.json", {} )
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
          } )
        base.loginDashboard( dashboard_username )
        cy.visit( dashboard.host )

        // send advocate invite
        cy.get( `a[href = "/admin/local-referrals/referrals"]` )
          .click()
        cy.get( "#erp-page-header-action-toggle0" )
          .click()
        cy.contains( "Send Referral Invites" )
          .click()
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( `input[type="search"]` )
              .type( email_config.imap.user )
            cy.get( `input[name="name"]` )
              .type( advocate_name )
            cy.contains( "Send Invite" )
              .click()
            // assertion: should see success message for sending invite
            cy.contains( `Sent invite to ${ advocate_name } at ${ email_config.imap.user }` )
              .should( "be.visible" )
          } )
        // view advocate invited table
        cy.intercept( "GET", "**/referral_invites**" )
          .as( "getReferralInvites" )
        cy.visit( `${ dashboard.host }/admin/local-referrals/advocates` )
        cy.contains( "a", "Invited" )
          .click()
        cy.wait( "@getReferralInvites" )
        cy.contains( "Loading…" )
          .should( "not.be.visible" )
        // assertion: advocate invited table should have correct number of headers
        base.assertTableHeaderCount( 5 )
        const tableRowText = base.getTableRowsText( { date: "Date", contact: "Contact", sent_to: "Sent To", sent_by: "Sent By", status: "Status" }, 1 )[ 0 ]
        // assertions: advocate invite table should have correct content
        cy.wrap( null )
          .then( () => {
            assert.equal( tableRowText.date, Cypress.dayjs().format( "MMM D, YYYY" ) )
            assert.equal( tableRowText.contact, advocate_name )
            assert.include( tableRowText.sent_by, "Manual" )
            assert.include( tableRowText.sent_by, "(Cypress)" )
            assert.equal( tableRowText.sent_to, this.email_config.imap.user )
            assert.include( tableRowText.status, `Sent` )
            assert.include( tableRowText.status, `(${ Cypress.dayjs().format( "MMM D, YYYY" ) })` )
          } )

        cy.get( "@email_config" )
          .then( ( email_config ) => {
            // assertion: should receive advocate invite email
            cy.task( "getLastEmail", { email_config, email_query: `${ advocate_name }, earn rewards by referring your friends` } )
              .then( ( html ) => {
                cy.visit( Cypress.config( "baseUrl" ) )
                cy.document( { log: false } ).invoke( { log: false }, "write", html )
              } )
          } )
          // assertions: advocate invite email should have correct content
        cy.contains( `Thank you for choosing us, ${ advocate_name }` )
          .should( "be.visible" )
        cy.contains( "Do you have friends that could use our services?" )
          .should( "be.visible" )
        cy.contains( `Invite them to book with us. When they do, you’ll both earn a ${ friend_reward_name } after their first completed appointment/project/purchase/service!` )
          .should( "be.visible" )
        cy.contains( "Invite Friends" )
          .invoke( "attr", "href" )
          .then( ( href ) => {
            cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
              .then( ( data ) => {
                data.merchant_id = this.merchant_id
                data.dashboard_username = dashboard_username
                data.advocate_invited = true
                data.advocate_sign_up_link = href
                data.advocate_email = this.email_config.imap.user
                cy.writeFile( "cypress/helpers/local_referrals/advocate.json", data )
              } )
          } )
      } )

      it( "Part 2 - Should be able to sign up as an advocate via invite email", () => {
        cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
          .then( ( data ) => {
            assert.isTrue( data.advocate_invited, "Advocate should have been invited" )
            // visit advocate invite link
            cy.visit( data.advocate_sign_up_link )
            // assertions: advocate name and email should be prefilled
            cy.get( "#name" )
              .should( "have.value", advocate_name )
            cy.get( "#email" )
              .should( "have.value", data.advocate_email )
            cy.contains( "Submit" )
              .click()
            // assertions: advocate sharing page should have correct content
            cy.contains( `Send your friends a ${ friend_reward_name } with your sharing link.` )
              .should( "be.visible" )
            data.advocate_registered = true
            cy.writeFile( "cypress/helpers/local_referrals/advocate.json", data )
          } )
      } )

      it( "Part 3 - Should see correct activity log for invited and registered advocate", () => {
        const activity_date = Cypress.dayjs().format( "ddd MMM DD" )
        cy.intercept( "GET", "**/actions**" )
          .as( "getContactActions" )
        cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
          .then( ( data ) => {
            assert.isTrue( data.advocate_registered, "Advocate should have been registered" )
            base.loginDashboard( data.dashboard_username )


            // view advocate activity
            cy.visit( `${ dashboard.host }/admin/local-contacts/customers/` )
            cy.contains( "a", advocate_name )
              .click()
            cy.wait( "@getContactActions" )

            // assertions: should see correct registered as advocate log
            cy.contains( `${ advocate_name } registered as an Advocate for your LocalReferrals program` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )

            // assertions: should see sent advocate invite log
            cy.contains( `Sent advocate invite to ${ advocate_name } at ${ data.advocate_email }` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )

            // assertions: should see added to contact list via advocate invite log
            cy.contains( "Added to your contact list: Sent advocate invite" )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
          } )
      } )

      it( "Part 4 - Should see signed up advocate in registered table", () => {
        cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
          .then( ( data ) => {
            assert.isTrue( data.advocate_registered, "Advocate should have been registered" )
            base.loginDashboard( data.dashboard_username )

            cy.intercept( "GET", "**/advocates**" )
              .as( "getAdvocates" )

            // view advocate registered table
            cy.visit( `${ dashboard.host }/admin/local-referrals/advocates` )
            cy.contains( "a", "Registered" )
              .click()
            cy.wait( "@getAdvocates" )
            cy.contains( "Loading…" )
              .should( "not.be.exist" )
            // assertion: advocate invite table should have correct number of headers
            base.assertTableHeaderCount( 5 )
            // assertions: advocate invite table should have correct content
            const tableRowText = base.getTableRowsText( { advocate: "Advocate", advocate_link_code: "Advocate Promo Code / Link", friends_referred: "# Of Friends Referred", friends_purchased: "# Of Friends Who Purchased", rewards_earned: "# Of Rewards Earned" }, 1 )[ 0 ]
            cy.wrap( null )
              .then( () => {
                assert.equal( tableRowText.advocate, `${ advocate_name }${ data.advocate_email }` )
                assert.include( tableRowText.advocate_link_code, "Copy Link" )
                assert.equal( tableRowText.friends_referred, "0" )
                assert.equal( tableRowText.friends_purchased, "0" )
                assert.equal( tableRowText.rewards_earned, "0" )
              } )

            // assertion: should see advocate link in data-clipboard-text attribute
            cy.contains( "a", "Copy Link" )
              .invoke( "attr", "data-clipboard-text" )
              .then( ( advocate_link ) => {
                assert.isDefined( advocate_link )
                data.advocate_link = advocate_link
                cy.writeFile( "cypress/helpers/local_referrals/advocate.json", data )
              } )
          } )
      } )

      it( "Part 5 - Advocate link from advocate registered table should be correct", () => {
        cy.readFile( "cypress/helpers/local_referrals/advocate.json" )
          .then( ( data ) => {
            assert.isNotEmpty( data.advocate_link, "Advocate link should have been found in advocate table" )
            cy.visit( data.advocate_link )
          } )
        // assertion: should see correct header on advocate sharing page
        cy.contains( `Refer friends, & get a ${ advocate_reward_name }` )
      } )
    } )
  } )
} )
