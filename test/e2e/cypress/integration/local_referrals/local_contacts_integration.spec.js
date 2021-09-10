describe( "LocalReferrals - LocalContacts Integration", () => {
  const base = require( "../../support/base" )
  const local_referrals = require( "../../support/local_referrals" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const dashboard_username = base.createRandomUsername()
  const user_data = require( "../../fixtures/user_data" )
  const local_contacts = require( "../../support/local_contacts" )
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  before( () => {
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber(merchant_name)
    local_referrals.createLocalReferralsMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username )
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        base.addTwilioNumber( merchant_id, Cypress.env("TWILIO_NUMBER") )
      } )
  } )

  beforeEach( () => {
    base.loginDashboard( dashboard_username )
  } )

  it( "Should be able to send advocate invite from contact table", function() {
    const sent_text = `${ merchant_name } - Love our services?`
    local_contacts.createContact( this.merchant_id, user_data.name2, "", dashboard.accounts.twilio.to_phone_number, false )
    cy.visit( `${ dashboard.host }/admin/local-contacts/customers` )
    cy.get( `md-checkbox[aria-label="Select ${ user_data.name2 }"]` )
      .click()
    cy.contains( "button", "Invite Advocates" )
      .click()
    cy.get( ".modal-title" )
      .should( "be.visible" )
      .and( "have.text", "Invite Advocates" )
    cy.contains( "button", "Send Referral Invites" )
      .click()
    cy.contains( "Advocate Invites were successfully sent" )
      .should( "be.visible" )
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text
    } )
      .then( ( response_text ) => {
        assert.isNotEmpty( response_text )
      } )
  } )

  it( "Should be able to enroll advocate and create referral from contact page", function() {
    const advocate_name = user_data.name
    const advocate_email = user_data.email
    const friend_name = user_data.name2
    const friend_email = user_data.email2
    base.createUserEmail()
    local_contacts.createContact( this.merchant_id, advocate_name, advocate_email, "", false )
      .then( ( response ) => {
        const contact_id = response.body.refs.contact_ids[ 0 ]
        cy.visit( `${ dashboard.host }/admin/local-contacts/customers/${ contact_id }` )
      } )

    // enroll contact as advocate
    cy.contains( "button", "Engage" )
      .click()
    cy.contains( "Enroll Advocate" )
      .click()
    cy.get( ".modal-content" )
      .within( () => {
        cy.contains( "Enroll Advocate" )
          .should( "be.visible" )
        cy.get( "input[name=\"name\"]" )
          .invoke( "val" )
          .should( "equal", advocate_name )
        cy.get( "input[name=\"email\"]" )
          .invoke( "val" )
          .should( "equal", advocate_email )
        cy.contains( "button", "Enroll" )
          .click()
      } )

    // assertion: should see success message for adding an advocate
    cy.contains( "Success, Contact was added as an Advocate" )
      .should( "be.visible" )
    cy.reload()
    // assertion: should see activity log for advocate registered
    cy.contains( `${ advocate_name } registered as an Advocate for your LocalReferrals program` )
      .should( "be.visible" )

    // create referral from contact page
    cy.contains( "button", "Engage" )
      .click()
    cy.contains( "Create Referral" )
      .click()

    // assertion: should see Create Referral modal
    cy.get( ".modal-title" )
      .should( "have.text", "Create Referral" )
      .and( "be.visible" )
    // assertions: should see advocate preselected in create referral modal
    cy.get( ".is-selected" )
      .should( "be.visible" )
      .and( "contain.text", advocate_name )
      .and( "contain.text", advocate_email )

    // enter friend information and confirm referral
    cy.get( `input[placeholder="Enter Friends Name"]` )
      .type( friend_name )
    cy.get( `input[placeholder="Enter Friends Email"]` )
      .type( friend_email )
    cy.get( ".processing-period-input" )
      .clear()
      .type( 0 )
    cy.contains( "button", "Confirm" )
      .click()
    // assertion: should see success toast for completing referral
    cy.contains( "Referral Created" )
      .should( "be.visible" )
  } )
} )
