
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'

{ ObjectID } = require 'mongodb'

xdescribe "Types - MerchantCampaign", () ->
  injector = (require '../utils.coffee').getInjector()

  MerchantCampaign = null
  $error = null
  ValidationError = null

  before ( callback ) ->
    utils.resolve [ 'MerchantCampaign', '$error' ], ( err, results ) ->
      return callback( err ) if err
      { MerchantCampaign, $error } = results
      { ValidationError } = $error
      return callback null

  describe 'validate', () ->
    it "should validate a new campaign", ( callback ) ->
      candidate =
        id: "#{ new ObjectID() }"
        merchant_id: "#{ new ObjectID() }"
        type: 'customer_referral'
        name: "Simple Referral Program"
        description: "Refer a friend to get $"
        start_date: '2016-08-01T04:00:00.000Z'
        end_date: null
        advocate_reward:
          amount: 5
        referred_reward:
          rate: 0.05

      MerchantCampaign.sanitize( candidate )
      MerchantCampaign.validate candidate, ( err, result ) ->
        assert.ifError( err )
        return callback null
