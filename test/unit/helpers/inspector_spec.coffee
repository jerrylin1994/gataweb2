
_       = require 'underscore'
assert  = require 'assert'

utils = require '../utils'

describe 'Helpers - Inspector', () ->
  injector = (require '../utils.coffee').getInjector()
  $inspector = null

  before ( callback ) ->
    utils.resolve [ '$inspector' ], ( err, results ) ->
      return callback( err ) if err
      $inspector = results.$inspector
      return callback()

  describe 'minLength', () ->
    it "should test minLength validation", ( callback ) ->
      offers_schema =
        type: 'object'
        properties:
          'items_offered':
            type: 'string'
          'eligible_region':
            type: 'object'
            strict: true
            properties:
              'type':
                type: 'string'
                eq: 'GeometryCollection'
              'properties':
                type: 'object'
                optional: true
              'geometries':
                type: 'array'
                minLength: 1

      candidate =
        items_offered: "transit/taxi"
        eligible_region:
          type: "GeometryCollection"
          geometries: []

      $inspector.validate offers_schema, candidate, ( err, result ) ->
        assert.equal( result.valid, false )
        return callback()

  describe 'expand_types', () ->
    it "should extend type", ( ) ->
      schema =
        type: 'currency'

      $inspector.expand_types( schema )
      assert.equal( schema.type, 'object' )

  describe 'sanitize', () ->
    it "should sanitize type", ( ) ->
      currency_schema =
        type: 'currency'

      $inspector.expand_types( currency_schema )
      price = { amount: '10.20', currency: 'CAD' }

      $inspector.sanitize( currency_schema, price )
      assert.equal( price.amount, 10.2 )
