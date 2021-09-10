// describe( "LocalVisits - Services", () => {
//   const base = require( "../../support/base" )
//   const admin_panel = Cypress.env( "admin" )
//   const dashboard = Cypress.env( "dashboard" )
//   const user_data = require( "../../fixtures/user_data" )
//   const name = user_data.name
//   const phone_number = dashboard.accounts.twilio.to_phone_number
//   const item_name = "iPhone"
//   const item_price = "60.00"

//   it( "Part 1 - Should be able to send out payment link", () => {
//     const sent_text = `Hi ${ name }, thank you for visiting Stage Cypress Automation. Please reply \"YES\" to receive your payment link`
//     cy.writeFile( "cypress/helpers/local_payments/staff.json", {} )
//     base.login( admin_panel, "ac" )
//     base.loginDashboard( dashboard.accounts.all_products.username )
//     // base.loginDashboard("asdfgh")
//     cy.visit( `${ dashboard.host }/admin/local-visits/payments` )
//     cy.contains( "Send Payment Link" )
//       .click()
//     cy.contains( "h2", "Send Payment Link" )
//       .should( "be.visible" )
//     cy.findByLabelText( "Full Name" )
//       .type( name )
//     cy.findByLabelText( "Phone Number" )
//       .type( phone_number )
//     cy.findByLabelText( "Item" )
//       .type( item_name )
//     cy.findByLabelText( "Price" )
//       .type( item_price )
//     cy.contains( "Send Link" )
//       .click()
//     cy.contains( "Payment Link Sent" )
//       .should( "be.visible" )
//     const tableRowText = base.getTableRowsText( { contact: "Contact", invoice_number: "Invoice #", last_activity_date: "Last Activity Date", status: "Status", amount: "Amount" }, 1 )
//     // assertion: should see staff member assigned to service on dashboard
//     cy.wrap( null )
//       .then( () => {
//         assert.include( tableRowText[ 0 ].contact, `${ name }` )
//         assert.include( tableRowText[ 0 ].contact, `${ phone_number }` )
//         assert.equal( tableRowText[ 0 ].invoice_number, `-` )
//         assert.equal( tableRowText[ 0 ].last_activity_date, Cypress.dayjs().format( "MMM D, YYYY" ) )
//         assert.include( tableRowText[ 0 ].status, "Unpaid" )
//         assert.equal( tableRowText[ 0 ].amount, `$${ item_price }` )
//       } )
//     cy.task( "checkTwilioText", {
//       account_SID: dashboard.accounts.twilio.SID,
//       to_phone_number: dashboard.accounts.twilio.to_phone_number,
//       from_phone_number: "+14376009645",
//       sent_text
//     } )
//       .then( ( text ) => {
//         assert.isNotEmpty( text )
//       } )
//   } )
// } )
