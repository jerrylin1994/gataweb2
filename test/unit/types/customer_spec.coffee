
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'

{ ObjectID } = require 'mongodb'
ObjectId = ObjectID
NumberLong = Number
ISODate = Date

xdescribe "Types - Customer", () ->
  injector = (require '../utils.coffee').getInjector()

  Customer = null

  test_customer_doc =
    _id: ObjectID("575b11777b85e8531b8b55a7")
    user_id: ObjectID("5759ae486ea0e3ba53aef156")
    merchant_id: ObjectID("56bda6a8cbe0ff5b7735c858")
    name:
      given: "Alex"
      family: "McCausland"
    email: "alex.mccausland+1@example.com"
    mobile: "+16479815749"
    contact_points:
      [
        type: 'email'
        value: "alex.mccausland+1@example.com"
      ]
    is_new: true
    created_at: ISODate("2016-06-10T19:13:59.274Z")

  before ( callback ) ->
    utils.resolve [ 'Customer' ], ( err, results ) ->
      return callback( err ) if err
      { Customer } = results
      return callback()

  describe 'generateTextIndex', () ->
    it "should not generate weird text index for tag emails", () ->
      text_index = Customer.generateTextIndex( test_customer_doc )
      text_index.sort()
      target_text_index = [ 'alex mccausland', 'mccausland', "alex.mccausland+1@example.com", 'alex.mccausland@example.com', '+16479815749' ]
      target_text_index.sort()
      assert.deepEqual( text_index, target_text_index )
