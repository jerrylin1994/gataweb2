
assert = require 'assert'
utils = require '../utils'

describe 'Helpers - Chargebee', () ->
  $chargebee = null

  before ( callback ) ->
    utils.resolve [ '$chargebee' ], ( err, results ) ->
      return callback( err ) if err
      { $chargebee } = results
      return callback()

  describe 'validateWebhookEvent', () ->
    it "should validate normal event", () ->
      event =
        id: 'ev_Hr5510iQeBRv85CsP',
        occurred_at: 1513620632,
        source: 'admin_console',
        user: 'neel.lukka@onelocal.com',
        object: 'event',
        api_version: 'v2',
        content:
          customer:
            id: 'Hr5510iQeBRv81CsO',
            first_name: 'Neel',
            last_name: 'Test',
            email: 'neel+test@onelocal.com',
            company: 'OneLocal Test',
            auto_collection: 'on',
            net_term_days: 0,
            allow_direct_debit: false,
            created_at: 1513620632,
            taxability: 'taxable',
            updated_at: 1513620632,
            locale: 'en-CA',
            resource_version: 1513620632622,
            deleted: false,
            object: 'customer',
            card_status: 'no_card',
            promotional_credits: 0,
            refundable_credits: 0,
            excess_payments: 0,
            unbilled_charges: 0,
            preferred_currency_code: 'USD'

      assert( $chargebee.validateWebhookEvent( event ) )
