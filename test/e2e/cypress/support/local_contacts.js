const base = require( "../support/base" )
import 'cypress-file-upload';

function createLocalContactsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username ) {
  base.addMerchant( merchant_name, user_email )
    .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
      base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
      base.createDashboardUser( merchant_id, dashboard_username )
        .then( ( response ) => {
          base.updateDashboardUserPassword( merchant_id, response.body.refs.account_ids[ 0 ] )
        } )
    } )
}

function createContact( merchant_id, name, email, phone_number, skip_verification ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/contact_hub/actions`,
    headers: {
      accept: "application/json"
    },
    body: {
      type: "contact_create",
      data: {
        name,
        skip_verification,
        mobile: phone_number,
        email
      }
    }
  } )
}

function createCustomContactField( merchant_id, custom_contact_field ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/contact_hub/actions`,
    body: {
      "type": "contact_field_create",
      "data": {
        name: custom_contact_field,
        type: "text",
        required: true
      }
    }
  } )
}

function deleteContacts( merchant_id, customer_ids ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/contacts_bulk_action`,
    body: {
      action: "delete",
      customer_ids,
      args: {}
    }
  } )
}

function createHasEmailFilter( merchant_id, filter_name ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/contact_hub/actions`,
    body: {
      type: "contact_filter_create",
      data: {
        name: filter_name,
        rules: [
          {
            model: "has_mobile",
            op: "true",
            value: null
          }
        ]
      }
    }
  } )
}

module.exports = {
  createLocalContactsMerchantAndDashboardUser,
  createContact,
  createCustomContactField,
  deleteContacts,
  createHasEmailFilter,
}
