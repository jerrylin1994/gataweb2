
// import { recurse } from 'cypress-recurse'
// Cypress.testFilter( [ "@smoke" ], () => {
//   describe( "LocalReviews - Email Reviews", () => {
//     const base = require( "../../support/base" )
//     const user_data = require( "../../fixtures/user_data" )
//     const local_reviews = require( "../../support/local_reviews" )
//     const admin_panel = Cypress.env( "admin" )
//     const dashboard = Cypress.env( "dashboard" )
//     const review_message = "Great review yay!"
//     it( "Should be able to send email review request", function() {
//       cy.writeFile( "cypress/helpers/local_reviews/phone-reviews.json", {} )
//       cy.task('getUserEmail').then((email) => {
//         // expect(email).to.be.a('string')
//         // userEmail = email
//         cy.log(email.imap.user)
//         cy.wrap(email)
//           .as("email")
//         // bork = email.imap

//       })
//       cy.intercept( "POST", "**/review_edge/survey_requests" ).as( "sendSurvey" )
//       const dashboard_username = base.createRandomUsername()
//       const merchant_name = base.createMerchantName()
//       const email_query = `Thanks for choosing ${ merchant_name } from: noreply@quick-feedback.co`
//       cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", {} )
//       base.login( admin_panel, "ac" )
//       base.deleteMerchantAndTwilioAccount()
//       base.deleteIntercomUsers()
//       local_reviews.createLocalReviewsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )

//       base.loginDashboard( dashboard_username )
//       cy.visit( dashboard.host )
//       cy.get( "a[href = \"/admin/local-reviews\"]" )
//         .click()

//       cy.contains( "Request Feedback" )
//         .click()
//       cy.get( "input[name = \"name\"]" )
//         .type( user_data.name )
//         cy.get("@email")
//         .then((email)=>{
//           cy.get( "input[name = \"contact\"]" )
//         .type( email.imap.user )
//         })
//       // cy.get( "input[name = \"contact\"]" )
//       //   .type( user_data.email )
//       base.getDashboardSession()
//         .then( ( response ) => {
//           if( ! ( "has_agreed_review_edge_tou" in response.body ) ) { cy.get( ".md-container" ).click() }
//         } )
//       cy.contains( "button[type = \"submit\"]", "Send" )
//         .click()
//       // cy.contains( `A feedback request was sent to ${ user_data.email }` )
//       //   .should( "be.visible" )
//       cy.wait(2000)
//       cy.get( "@sendSurvey" )
//         .then( ( xhr ) => {
//           cy.wrap( xhr.request.body.template_id ).as( "survey_id" )
//         } )
//       cy.get("@email")
//         .then((email)=>{
//           recurse(
//             () => cy.task("getLastEmail",{
//                 emailConfig:email
//               }),
//             Cypress._.isObject, // keep retrying until the task returns an object
//             {
//               timeout: 60000,
//               delay: 5000,
//             },
//           ).its('html')
//           .then((html) => {
//             cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
//                 .then( ( data ) => {
//                   data.html = html
//                   cy.writeFile( "cypress/helpers/local_reviews/phone-reviews.json", data )
//                 } )
//               cy.visit("https://stage.onelocal.com")
//             cy.document({ log: false }).invoke({ log: false }, 'write', html)
//           })
//           // cy.task("getLastEmail",{
//           //   emailConfig:bork
//           // })
//           // .then((result)=>{
//           //   cy.log(result)
//           // })
//         })
//       // cy.task( "checkEmail", { query: email_query, email_account: "email1" } )
//       //   .then( ( email ) => {
//       //     assert.isNotEmpty( email )
//       //     cy.task( "isElementPresentInEmail", { email_id: email.data.id, email_account: "email1", element_text: "POWERED BY" } )
//       //       .then( ( result ) => assert.isTrue( result, "Powered by Onelocal footer should be found in the email" ) )
//       //     cy.task( "getReviewEmailStarHref", { email_id: email.data.id, email_account: "email1" } )
//       //       .then( ( five_star_link ) => {
//       //         assert.isNotEmpty( five_star_link, "5 star link should have been found in email" )
//       //         cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
//       //           .then( ( data ) => {
//       //             data.survey_link_exists = true,
//       //             data.dashboard_username = dashboard_username,
//       //             data.survey_link = five_star_link,
//       //             data.merchant_id = this.merchant_id
//       //             data.survey_id = this.survey_id
//       //             cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", data )
//       //           } )
//       //       } )
//       //   } )
//     } )

//     it("dsadssda",()=>{
//       cy.visit("https://stage.dashboard.onelocal.com")
//       cy.readFile( "cypress/helpers/local_reviews/phone-reviews.json" )
//       .then( ( data ) => {
//         cy.document({ log: false }).invoke({ log: false }, 'write', data.html)
//       } )
//     })
//     it( "Should be able to complete a email review survey", () => {
//       cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
//         .then( ( data ) => {
//           assert.isTrue( data.survey_link_exists, "Survey star link should have been found in email" )
//           cy.visit( data.survey_link )
//           // assertion: opened rate should be 1
//           base.loginDashboard( data.dashboard_username )
//           local_reviews.getSurveyTemplates( data.merchant_id )
//             .then( ( response ) => {
//               assert.equal( response.body[ 0 ].stats.opened_count, 1, "Opened count should be correct" )
//             } )
//         } )
//       cy.get( ".powered-by-onelocal" )
//         .should( "be.visible" )
//       cy.contains( "Use Google to leave us a review?" )
//         .should( "be.visible" )
//       cy.contains( "No" )
//         .click()
//       cy.contains( "Use Facebook to leave us a review?" )
//         .should( "be.visible" )
//       cy.contains( "No" )
//         .click()
//       cy.get( ".survey-textarea-field" )
//         .type( review_message )
//       cy.contains( "Next" )
//         .click()

//       // assertion: should see survey exit page
//       cy.contains( "Thanks for submitting your feedback!" )
//         .should( "be.visible" )
//       cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
//         .then( ( data ) => {
//           data.survey_request_completed = true
//           cy.writeFile( "cypress/helpers/local_reviews/email-reviews.json", data )
//         } )
//     } )

//     it( "Should see correct stats for completed email survey", () => {
//       cy.readFile( "cypress/helpers/local_reviews/email-reviews.json" )
//         .then( ( data ) => {
//           assert.isTrue( data.survey_request_completed, "Review request should have been completed" )
//           base.loginDashboard( data.dashboard_username )
//           cy.intercept( "GET", "**/survey_responses**" )
//             .as( "getSurveyResponses" )
//           cy.visit( `${ dashboard.host }/admin/local-reviews/surveys/${ data.survey_id }/responses` )
//           cy.wait( "@getSurveyResponses" )

//           // assertion: table header count should be correct
//           base.assertTableHeaderCount( 10 )
//           const tableRowText = base.getTableRowsText( { response_date: "Response Date", contact: "Contact", channel: "Channel", sentiment: "Sentiment", request_date: "Request Date", star_rating: "How would you rate your experience with us?", opened_website: "Opened Website", review_comment: "Review Comments", consent: "Consent to Share" }, 1 )

//           // assertion: responses table data should be correct
//           cy.wrap( null )
//             .then( () => {
//               assert.equal( tableRowText[ 0 ].response_date, base.getTodayDate() )
//               assert.equal( tableRowText[ 0 ].contact, user_data.name )
//               assert.equal( tableRowText[ 0 ].channel, "Email Request" )
//               assert.equal( tableRowText[ 0 ].sentiment, "Positive" )
//               assert.equal( tableRowText[ 0 ].request_date, base.getTodayDate() )
//               assert.equal( tableRowText[ 0 ].star_rating, "5" )
//               assert.equal( tableRowText[ 0 ].opened_website, "-" )
//               assert.equal( tableRowText[ 0 ].review_comment, review_message )
//               assert.equal( tableRowText[ 0 ].consent, "Yes" )
//             } )
//         } )
//     } )
//   } )
// } )

const bork = "test"

function yo() {
  console.log( bork )
}

yo()
