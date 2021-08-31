describe( "Admin Panel - LocalCheckin", () => {
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const base = require( "../../support/base" )
  // const local_messages = require( "../../support/local_messages" )
  const user_data = require( "../../fixtures/user_data" )
  const phone_number = Cypress.config( "baseUrl" ).includes( "stage" ) ? "14377471955" : "14377472898"
  const merchant_name = "Test Automation LocalCheckin"
  before( () => {
    base.login( admin_panel, "ac" )
    // base.deleteMerchantAndTwilioAccount()
    // base.deleteMerchants( merchant_name )
    base.deleteIntercomUsers()
    const merchant_name = `Test Automation ${ Cypress.env("TWILIO_NUMBER") }`
      base.removeTwilioNumber( merchant_name )
      base.addMerchant( merchant_name, user_data.email )
           .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
          base.addTwilioNumber( merchant_id, Cypress.env("TWILIO_NUMBER") )
          cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }` )
    } )
  })

    // base.addMerchant( merchant_name, user_data.email )
    //   .then( ( response ) => {
    //     const merchant_id = response.body.id
    //     base.addTwilioNumber( merchant_id, phone_number )
    //     cy.wrap( merchant_id ).as( "merchant_id" )
    //     cy.visit( `${ admin_panel.host }/merchants/${ merchant_id }` )
    //   } )
  // } )

  beforeEach( () => {
    base.login( admin_panel, "ac" )
  } )

  it( "Should be able to enable LocalCheckin", function() {
    cy.contains( "a", "LocalVisits" )
      .click()
      base.getPhoneNumber(this.merchant_id)
      .then((response)=>{
        cy.log(response.body[0].value)
      })
    cy.contains( "Status" )
      .children( "select" )
      .select( "Live" )
    cy.get( `div[heading="Check-In"]` )
      .contains( "Enabled" )
      .click()
    cy.contains( "button", "Save" )
      .click()
    cy.contains( "Visits settings updated" )
      .should( "be.visible" )
    base.loginDashboardAsOnelocalAdmin( "ac", this.merchant_id )
    cy.visit( `${ dashboard.host }` )
    cy.contains( "LocalVisits" )
      .click()
    // assertion: should see Manual check in button on LocalVisits page
    cy.contains( "button", "Manual Check In" )
      .should( "be.visible" )
  } )
} )
