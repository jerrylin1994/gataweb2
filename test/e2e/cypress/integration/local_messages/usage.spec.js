describe( "LocalMessages - Usage", () => {
  const base = require( "../../support/base" )
  const local_messages = require( "../../support/local_messages" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const dashboard_username = base.createRandomUsername()
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  function setMonthlySMSLimit( merchant_id ) {
    cy.request( {
      method: "PUT",
      url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
      headers: {
        accept: "application/json"
      },
      body: {
        settings: {
          messenger: {
            status: "live",
            limits: {
              monthly: {
                sms_out_count: 2
              }
            }
          }
        }
      }
    } )
  }

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_messages.createLocalMessagesMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to view LocalMessage Usage", function() {
    // set monthly limit to 2 and send 1 sms message
    setMonthlySMSLimit( this.merchant_id )
    local_messages.sendDashboardMessage( this.merchant_id, dashboard.accounts.twilio.to_phone_number )

    // view usage tracker
    cy.visit( `${ dashboard.host }/admin/settings/local-messages` )
    cy.contains( "Usage" )
      .click()
    // assertion: should see correct stat for messages sent for current month
    cy.contains( "1 / 2 SMS" )
      .should( "be.visible" )
    // assertion: sms tracker bars should have correct widths
    cy.get( ".messenger-usage-stats__sms-out-tracker-used" )
      .should( "have.attr", "style", "width: 50%;" )
    cy.get( ".messenger-usage-stats__sms-out-tracker-remaining" )
      .should( "have.attr", "style", "width: 50%;" )
  } )
} )
