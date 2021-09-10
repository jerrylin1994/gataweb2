describe( "LocalVisits - Build Form", () => {
  const base = require( "../../support/base" )
  const local_visits = require( "../../support/local_visits" )
  const admin_panel = Cypress.env( "admin" )
  const dashboard = Cypress.env( "dashboard" )
  const user_data = require( "../../fixtures/user_data" )
  const mc_question_name = "Residence"
  const mc_question = "Where do you live?"
  const mc_answers = [ "Ontario", "Quebec", "PEI" ]
  const mc_other_asnwer = "Alberta"
  const merchant_name = `Test Automation ${ Cypress.env( "TWILIO_NUMBER" ) }`

  it( "Part 1 - Should be able to add, edit, and delete a MC question", () => {
    cy.writeFile( "cypress/helpers/local_visits/build_form.json", {} )
    const dashboard_username = base.createRandomUsername()
    base.login( admin_panel, "ac" )
    base.removeTwilioNumber( merchant_name )
    local_visits.createCheckInMerchantAndDashboardUser( merchant_name, user_data.email, dashboard_username, Cypress.env( "TWILIO_NUMBER" ) )
    base.loginDashboard( dashboard_username )
    cy.visit( `${ dashboard.host }/admin/settings/local-visits/check-in/forms` )
    cy.contains( "Form" )
      .click()

    // add a multiple choice question
    cy.contains( "Add a Question" )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Add a Question" )
      .and( "be.visible" )
    cy.contains( "Multi Choice" )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Add Multi Choice" )
      .and( "be.visible" )
    cy.get( "textarea" )
      .type( mc_question )
    cy.contains( "Display on dashboard" )
      .click()
    cy.get( `input[name="question_name"]` )
      .type( mc_question_name )
    cy.get( "#multi-choice-option-item-input-0" )
      .type( mc_answers[ 0 ] )
    cy.contains( "Add Option" )
      .click()
    cy.get( "#multi-choice-option-item-input-1" )
      .type( mc_answers[ 1 ] )
    // allow multiple answers
    cy.contains( "Allow multiple answers" )
      .click()
    // include other option
    cy.contains( `Include "Other" option` )
      .click()
    // change question to required
    cy.contains( "Required" )
      .click()
    cy.contains( "Confirm" )
      .click()
    // assertion: should see success toast for adding question
    cy.contains( "Question added" )
      .should( "be.visible" )
    cy.contains( "close" )
      .click()

    // edit a question
    cy.contains( mc_question )
      .parents( ".check-in-form__component-item-container" )
      .find( `img[src="/assets/dashboard/icon-edit-grey-pencil-underline.svg"]` )
      .click()
    cy.get( ".modal-title" )
      .should( "have.text", "Edit Multi Choice" )
      .and( "be.visible" )
    cy.contains( "Add Option" )
      .click()
    cy.get( "#multi-choice-option-item-input-2" )
      .type( mc_answers[ 2 ] )
    cy.contains( "Confirm" )
      .click()
    // assertion: should see sucess toast for editing a question
    cy.contains( "Question edited" )
      .should( "be.visible" )

    // delete a question
    cy.contains( "What is your name?" )
      .parents( ".check-in-form__component-item-container" )
      .find( `img[src="/assets/dashboard/icon-trash-light.svg"]` )
      .click()
    // assertion: should see sucess toast for deleting a question
    cy.contains( "Question removed" )
      .should( "be.visible" )

    // send check in invite
    cy.get( "@merchant_id" )
      .then( ( merchant_id ) => {
        local_visits.sendCheckInInvite( merchant_id, dashboard.accounts.twilio.to_phone_number )
      } )
    // assertion: should receive check in invite text
    cy.task( "checkTwilioText", {
      account_SID: dashboard.accounts.twilio.SID,
      auth_token: dashboard.accounts.twilio.auth_token,
      to_phone_number: dashboard.accounts.twilio.to_phone_number,
      from_phone_number: Cypress.env( "TWILIO_NUMBER" ),
      sent_text: "Please begin your check-in"
    } )
      .then( ( response_text ) => {
        assert.isNotEmpty( response_text )
        cy.readFile( "cypress/helpers/local_visits/build_form.json" )
          .then( ( data ) => {
            data.check_in_link = response_text.split( ": " )[ 1 ]
            data.dashboard_username = dashboard_username
            cy.writeFile( "cypress/helpers/local_visits/build_form.json", data )
          } )
      } )
  } )

  it( "Part 2 - Should be able to complete new modified check-in form", () => {
    cy.readFile( "cypress/helpers/local_visits/build_form.json" )
      .then( ( data ) => {
        assert.isDefined( data.check_in_link, "Should have received check-in link" )
        cy.visit( data.check_in_link )
      } )
    cy.contains( "Get Started" )
      .click()
    // assertion: should see new added mc question
    cy.contains( "Where do you live?" )
      .should( "be.visible" )
    // assertion: submit button should be disabled for an unanswered required question
    cy.contains( "Submit" )
      .should( "be.visible" )
      .and( "be.disabled" )
    for( const answer of mc_answers ) {
      cy.contains( answer )
        .click()
    }
    // check allow "Other" option
    cy.contains( "Other" )
      .click()
    cy.get( "textarea" )
      .type( mc_other_asnwer )
    cy.contains( "Submit" )
      .click()
    // assertion: should see registration completed page
    cy.contains( "Registration Completed" )
      .should( "be.visible" )
    cy.readFile( "cypress/helpers/local_visits/build_form.json" )
      .then( ( data ) => {
        data.registration_completed = true
        cy.writeFile( "cypress/helpers/local_visits/build_form.json", data )
      } )
  } )

  it( "Part 3 - Should see visitor and displayed question in the waiting table", () => {
    cy.readFile( "cypress/helpers/local_visits/build_form.json" )
      .then( ( data ) => {
        assert.isTrue( data.registration_completed, "Should have completed check-in form" )
        base.loginDashboard( data.dashboard_username )
      } )
    cy.visit( `${ dashboard.host }/admin/local-visits/check-in` )
    // assertion: waiting tab should have 1 entry
    cy.contains( "Waiting (1)" )
      .should( "be.visible" )
    const waitingTableRowText = base.getTableRowsText( { residence: mc_question_name }, 1 )[ 0 ]
    // assertion: should see mc question and answer on waititng table
    cy.wrap( null )
      .then( () => {
        assert.equal( waitingTableRowText.residence, `${ mc_answers[ 0 ] }, ${ mc_answers[ 1 ] }, ${ mc_answers[ 2 ] }, Other - ${ mc_other_asnwer }` )
      } )
  } )
} )
