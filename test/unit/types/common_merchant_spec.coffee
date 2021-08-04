
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'

describe "Types - CommonMerchant", () ->
  injector = (require '../utils.coffee').getInjector()

  CommonMerchant = null
  ValidationError = null

  before ( callback ) ->
    utils.resolve [ 'CommonMerchant', '$error' ], ( err, results ) ->
      return callback( err ) if err
      { CommonMerchant } = results
      { ValidationError } = results.$error
      return callback null

  describe 'createDocument', () ->
    it "should create a new Commonmerchant from chargebee data", ( callback ) ->
      CommonMerchant.sanitize( candidate )
      CommonMerchant.validate candidate, ( err, result ) ->
        assert.ifError( err )
        return callback null
