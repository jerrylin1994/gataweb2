
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'
faker   = require 'faker'

utils = require '../utils'

{ ObjectID } = require 'mongodb'

xdescribe "Types - CustomerReferral", () ->
  injector = (require '../utils.coffee').getInjector()

  CustomerReferral = null
  $error = null
  ValidationError = null

  before ( callback ) ->
    utils.resolve [ 'CustomerReferral', '$error' ], ( err, results ) ->
      return callback( err ) if err
      { CustomerReferral, $error } = results
      { ValidationError } = $error
      return callback null

  describe 'validate', () ->
    it "should validate a new referral", ( callback ) ->
      candidate =
        id: "#{ new ObjectID() }"
        merchant_id: "#{ new ObjectID() }"
        advocate:
          id: "#{ new ObjectID() }"
          name:
            display: faker.name.findName()
        customer:
          id: "#{ new ObjectID() }"
          name:
            display: faker.name.findName()
          email: faker.internet.email()
        merchant_campaign_id: "#{ new ObjectID() }"
        state:
          code: 'incoming'
          label: 'Incoming'
          updated_at: new Date()

      CustomerReferral.sanitize( candidate )
      CustomerReferral.validate candidate, ( err, result ) ->
        assert.ifError( err )
        return callback null
