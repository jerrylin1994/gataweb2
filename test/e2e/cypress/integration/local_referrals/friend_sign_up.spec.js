describe( "LocalReferrals - Friend Sign Up", () => {
  const faker = require( "faker" )
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const advocate_reward_name = "100 dollars off"
  const friend_reward_name = "50 dollars off"
  const advocate_email = user_data.email
  const old_survey_link = Cypress.config( "baseUrl" ) == "https://stage.onelocal.com" ? `${ dashboard.referral_sharing_link }/test-account-1/DWM215R` : `${ dashboard.referral_sharing_link }/jerry2`
  function assertFriendGiftPageContent() {
    cy.contains( `${ friend_reward_name }` )
      .should( "be.visible" )
    cy.contains( "We’ll be in touch!" )
      .should( "be.visible" )
  }
  function getReferralTableRowsText( headers ) {
    const rowText = {}
    for( const property of Object.keys( headers ) ) {
      cy.contains( "th", headers[ property ] ).invoke( "index" )
        .then( ( header_index ) => {
          cy.get( "tr" )
            .eq( 1 )
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
    return rowText
  }

  context( "Friend sign up via email test cases", () => {
    Cypress.testFilter( [ "@smoke" ], () => {
      it( "Qualification all - Should be able to sign up as a friend via email", () => {
        cy.visit( old_survey_link ) // visit old survey link to avoid restarting test when visiting a domain different from baseUrl
        base.createUserEmail()
        const advocate_name = faker.name.firstName()
        const friend_name = faker.name.firstName()
        const dashboard_username = base.createRandomUsername()
        base.login( admin_panel, "ac" )
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
            base.getMerchantById( merchant_id )
              .then( ( response ) => {
                const merchant_slug = response.body.slug
                local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
                  .then( ( response ) => {
                    cy.visit( `${ dashboard.referral_sharing_link }/${ merchant_slug }/${ response.body.referrer_code }` )
                  } )
              } )
          } )

        // invite friend via email
        cy.get( `input[placeholder="Friend's Name"]` )
          .should( "have.value", "" )
          .type( friend_name )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( `input[placeholder="Friend's Email"]` )
              .should( "have.value", "" )
              .type( email_config.user )
          } )
        cy.contains( "button", "Submit" )
          .click()
        // assertion: should see success message for inviting friend via email
        cy.contains( `You referred ${ friend_name }. Want to keep sharing?` )
          .should( "be.visible" )
        // assertion: friend invite status should be Sent
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.getReferrals( merchant_id, friend_name )
              .then( ( response ) => {
                assert.equal( ( response.body[ 0 ].state.label ), "Incoming", `Friend invite should be "Incoming"` )
                assert.equal( ( response.body[ 0 ].state.detail ), "Sent", `Friend invite detail should be "Sent"` )
              } )
          } )
        // assertion: should see friend invite email
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.task( "getLastEmail", { email_config, email_query: `${ advocate_name } thought you would be interested in our services!` } )
              .then( ( html ) => {
                cy.document( { log: false } ).invoke( { log: false }, "write", html )
              } )
          } )

        cy.contains( "Register Your Interest" )
          .invoke( "attr", "href" )
          .then( ( href ) => {
            cy.request( {
              url: href,
              followRedirect: false
            } )
              .then( ( xhr ) => {
                cy.visit( xhr.redirectedToUrl )
              } )
          } )
        // assertion: friend invite status should be Opened
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.getReferrals( merchant_id, friend_name )
              .then( ( response ) => {
                assert.equal( ( response.body[ 0 ].state.label ), "Incoming", `Friend invite should be "Incoming"` )
                assert.equal( ( response.body[ 0 ].state.detail ), "Opened", `Friend invite detail should be "Opened"` )
              } )
          } )
        // assertions: friend info should be pre filled on the friend sign up page
        cy.get( "#name" )
          .should( "have.value", friend_name )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( "#email" )
              .should( "have.value", email_config.user )
          } )
        // claim gift
        cy.contains( "Sign Up" )
          .click()
        assertFriendGiftPageContent()
        cy.get( "@email_config" )
          .then( ( email_config ) => {
          // assertion: should receive friend sign up email
            cy.task( "getLastEmail", { email_config, email_query: `${ friend_name } we’ll be in touch shortly!` } )
          } )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
          // assertions: friend status should correct
            local_referrals.getReferrals( merchant_id, friend_name )
              .then( ( response ) => {
                assert.equal( ( response.body[ 0 ].state.label ), "Incoming", `Friend invite should be "Incoming"` )
                assert.equal( ( response.body[ 0 ].state.detail ), "Qualified", `Friend invite detail should be "Qaulified"` )
              } )
          } )
      } )
    } )

    Cypress.testFilter( [ ], () => {
      it( "Qualification friend - Should be able to sign up as a friend via email", () => {
      // test fails on prod and prod test due to https://github.com/gatalabs/gata/issues/9455
        cy.visit( old_survey_link ) // visit old survey link to avoid restarting test when visiting a domain different from baseUrl
        base.createUserEmail()
        const advocate_name = faker.name.firstName()
        const friend_name = faker.name.firstName()
        const dashboard_username = base.createRandomUsername()
        base.login( admin_panel, "ac" )
        // base.deleteMerchants()
        // base.deleteMerchantAndTwilioAccount()
        base.deleteIntercomUsers()
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
            local_referrals.setQualificationToFriend( merchant_id )
            base.getMerchantById( merchant_id )
              .then( ( response ) => {
                const merchant_slug = response.body.slug
                local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
                  .then( ( response ) => {
                    cy.visit( `${ dashboard.referral_sharing_link }/${ merchant_slug }/${ response.body.referrer_code }` )
                  } )
              } )
          } )

        // send friend invite via email
        cy.contains( "button", "Email" )
          .click()
        cy.get( ".referral-magic-modal" )
          .should( "be.visible" )
          .within( () => {
            cy.contains( "Share Via Email" )
              .should( "be.visible" )
          } )
        cy.wait( 500 ) // added to help with cypress only typing the email partially
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( "#email" )
              .type( email_config.user )
          } )
        cy.contains( "button", "Send" )
          .click()
        cy.contains( "Success" )
          .should( "be.visible" )
        cy.contains( "Thanks for spreading the word! Continue sharing below" )
          .should( "be.visible" )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
          // assertion: friend invited via email with qualification friend should not show up as an referral when sent the invite
            local_referrals.getReferrals( merchant_id )
              .then( ( response ) => {
                assert.isEmpty( response.body )
              } )
          } )

        cy.get( "@email_config" )
          .then( ( email_config ) => {
          // assertion: should receive friend invite email with claim gift button
            cy.task( "getLastEmail", { email_config, email_query: `${ advocate_name } thought you would be interested in our services!` } )
              .then( ( html ) => {
                cy.document( { log: false } ).invoke( { log: false }, "write", html )
              } )
          } )
        cy.contains( "Register Your Interest" )
          .invoke( "attr", "href" )
          .then( ( href ) => {
            cy.request( {
              url: href,
              followRedirect: false
            } )
              .then( ( xhr ) => {
                cy.visit( xhr.redirectedToUrl )
              } )
          } )

        // sign up as a friend
        // assertion: friend name should be blank
        cy.get( "#name" )
          .should( "have.value", "" )
          .type( friend_name )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( "#email" )
              .should( "have.value", email_config.user )
          } )
        cy.contains( "button", "Sign Up" )
          .click()
        assertFriendGiftPageContent()
        cy.get( "@email_config" )
          .then( ( email_config ) => {
          // assertion: should receive friend invite email
            cy.task( "getLastEmail", { email_config, email_query: `${ friend_name } we’ll be in touch shortly!` } )
          } )

        // assertion: friend referal status should be "Incoming"
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.getReferrals( merchant_id, friend_name )
              .then( ( response ) => {
                assert.equal( ( response.body[ 0 ].state.label ), "Incoming", `Friend invite should be "Incoming"` )
                assert.equal( ( response.body[ 0 ].state.detail ), "Qualified", `Friend invite detail should be "Qualified"` )
              } )
          } )
      } )

      it( "Should be able to send friend referral invite after advocate invite", () => {
        cy.visit( dashboard.host ) // to avoid test restart later on
        base.createUserEmail()
        const dashboard_username = base.createRandomUsername()
        const advocate_name = user_data.name
        const friend_name = user_data.name2
        base.login( admin_panel, "ac" )
        // base.deleteMerchants()
        // base.deleteMerchantAndTwilioAccount()
        base.deleteIntercomUsers()
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        base.loginDashboard( dashboard_username )

        // send advocate invite
        cy.visit( `${ dashboard.host }/admin/local-referrals` )
        cy.contains( "button", "Actions" )
          .click()
        cy.contains( "Send Referral Invites" )
          .click()
        cy.get( `input[type="search"]` )
          .type( advocate_email )
        cy.get( `input[name="name"]` )
          .type( advocate_name )
        cy.contains( "Send Invite" )
          .click()

        // send invite to advocate's friends
        cy.contains( "a", `Send invites to ${ advocate_name }'s friends?` )
          .click()
        cy.contains( "Friend First Name" )
          .siblings( "input" )
          .type( friend_name )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.contains( "Friend Email or Mobile Phone" )
              .siblings( "input" )
              .type( email_config.user )
            cy.contains( "button", "Send Invite" )
              .click()
            cy.contains( "1 Invite Sent" )
              .should( "be.visible" )

            // assertion: friend should receive email invite
            cy.task( "getLastEmail", { email_config, email_query: `${ advocate_name } thought you would be interested in our services!` } )
          } )
      } )
    } )
  } )

  Cypress.testFilter( [ ], () => {
    context( "Friend sign up via sharing link and activity log test cases", () => {
      const advocate_name = user_data.name
      const friend_name = user_data.name2
      it( "Part 1 - Should be able to sign up as a friend via sharing link", () => {
        cy.visit( old_survey_link ) // visit old survey link to avoid restarting test when visiting a domain different from baseUrl
        base.createUserEmail()
        cy.writeFile( "cypress/helpers/local_referrals/friend.json", { } )
        const dashboard_username = base.createRandomUsername()
        base.login( admin_panel, "ac" )
        // base.deleteMerchants()
        // base.deleteMerchantAndTwilioAccount()
        base.deleteIntercomUsers()
        local_referrals.createLocalReferralsMerchantAndDashboardUser( user_data.merchant_name, user_data.email, dashboard_username )
        cy.get( "@merchant_id" )
          .then( ( merchant_id ) => {
            local_referrals.setAdvocateAndFriendReward( merchant_id, advocate_reward_name, friend_reward_name )
            base.getMerchantById( merchant_id )
              .then( ( response ) => {
                const merchant_slug = response.body.slug
                local_referrals.signUpAsAdvocate( advocate_name, advocate_email, merchant_slug )
                  .then( ( response ) => {
                    cy.visit( `${ dashboard.referral_sharing_link }/${ merchant_slug }/${ response.body.referrer_code }` )
                  } )
              } )
          } )

        // get sharing link
        cy.contains( "Or Click Here To Share With A Link" )
          .click()
        // assertion: should see advocoate sharing url on the sharing page
        cy.get( "#advocate-url" )
          .should( "be.visible" )
          .invoke( "val" )
          .then( ( sharing_link ) => {
            cy.visit( sharing_link )
          } )

        // assertions: friend sign up page should have correct content
        cy.contains( `${ advocate_name } thought you would be interested in our services!` )
          .should( "be.visible" )
        cy.contains( `Sign up now and get a ${ friend_reward_name } after your first appointment/project/purchase/service!` )
          .should( "be.visible" )

        // sign up as a friend
        cy.get( "#name" )
          .type( friend_name )
        cy.get( "@email_config" )
          .then( ( email_config ) => {
            cy.get( "#email" )
              .type( email_config.user )
          } )
        cy.contains( "Sign Up" )
          .click()
        // assertion: should see correct content on friend gift page
        cy.contains( "Great! You’ll be receiving your gift card shortly" )
          .should( "be.visible" )
        cy.contains( friend_reward_name )
          .should( "be.visible" )


        cy.get( "@email_config" )
          .then( ( email_config ) => {
            // assertion: should receive friend gift email
            cy.task( "getLastEmail", { email_config, email_query: `${ friend_name } we’ll be in touch shortly!` } )
            // assertion: friend status should be "Incoming"
            cy.get( "@merchant_id" )
              .then( ( merchant_id ) => {
                local_referrals.getReferrals( merchant_id, advocate_name )
                  .then( ( response ) => assert.equal( ( response.body[ 0 ].state.label ), "Incoming", "Referral state should be incoming" ) )
                cy.readFile( "cypress/helpers/local_referrals/friend.json" )
                  .then( ( data ) => {
                    data.friend_registered = true
                    data.merchant_id = merchant_id
                    data.dashboard_username = dashboard_username
                    data.friend_email = email_config.user
                    cy.writeFile( "cypress/helpers/local_referrals/friend.json", data )
                  } )
              } )
          } )
      } )

      it( "Part 2 - Should see correct content on Referrals table", () => {
        cy.readFile( "cypress/helpers/local_referrals/friend.json" )
          .then( ( data ) => {
            assert.isTrue( data.friend_registered, "friend should have been registered" )
            base.loginDashboard( data.dashboard_username )

            cy.intercept( "GET", "**/referral_magic/referrals**" )
              .as( "getReferrals" )
            cy.visit( `${ dashboard.host }/admin/local-referrals/referrals` )
            cy.wait( "@getReferrals" )
            cy.contains( "Loading…" )
              .should( "not.exist" )
            // assertion: referrals table should have correct number of headers
            base.assertTableHeaderCount( 6 )
            const tableRowsText = getReferralTableRowsText( { updated: "Updated", status: "Status", advocate: "Advocate", friend: "Friend", service_date: "Service Date" } )
            // assertions: referral table should have correct content
            cy.wrap( null )
              .then( () => {
                assert.equal( tableRowsText.updated, Cypress.dayjs().format( "MMM D, YYYY" ) )
                assert.equal( tableRowsText.status, "Incoming(Qualified)" )
                assert.include( tableRowsText.advocate, `${ advocate_name }${ advocate_email }` )
                assert.equal( tableRowsText.friend, `${ friend_name }${ data.friend_email }` )
                assert.equal( tableRowsText.service_date, "-" )
              } )
          } )
      } )
      it( "Part 3 - Should see correct activity log for registered friend", () => {
        const activity_date = Cypress.dayjs().format( "ddd MMM DD" )
        cy.intercept( "GET", "**/actions**" )
          .as( "getContactActions" )
        cy.readFile( "cypress/helpers/local_referrals/friend.json" )
          .then( ( data ) => {
            assert.isTrue( data.friend_registered, "friend should have been registered" )
            base.loginDashboard( data.dashboard_username )
          } )

        // view friend activity log
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/` )
        cy.contains( "a", friend_name )
          .click()
        cy.wait( "@getContactActions" )

        // friend referral log
        cy.get( ".contacthub-timeline-item" )
          .eq( 1 )
          .within( () => {
          // assertions: should see correct messages in log
            cy.contains( `${ friend_name } was referred to you by ${ advocate_name }` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
            cy.get( "md-icon" )
              .click()
            cy.contains( "Status: Incoming" )
              .should( "be.visible" )
            cy.contains( `Promo for Friend: $50.00` )
              .should( "be.visible" )
          } )

        // added to contact list via referral invite log
        cy.get( ".contacthub-timeline-item" )
          .eq( 2 )
          .within( () => {
          // assertion: should see correct message in log
            cy.contains( `Added to your contact list: Referred by ${ advocate_name }` )
              .should( "be.visible" )
            cy.contains( activity_date )
              .should( "be.visible" )
          } )
      } )
    } )
  } )
} )
