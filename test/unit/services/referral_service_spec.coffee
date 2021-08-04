
_       = require 'underscore'
assert  = require 'assert'

utils   = require '../utils'

xdescribe 'Service - Referrals', () ->
  service = null

  before ( callback ) ->
    utils.resolve [ 'referral_service' ], ( err, results ) ->
      return callback( err ) if err?
      service = results.referral_service

      # @todo call service.createMocksByMerchant for a test merchant

      return callback()

  describe 'createCustomerReferral', () ->
    it "should succeed for a new user", ( callback ) ->
      return callback()

    it "should fail for an existing user", ( callback ) ->
      return callback()
