
_       = require 'underscore'
assert  = require 'assert'
chai    = require 'chai'
expect  = chai.expect
async   = require 'async'

utils = require '../utils'

xdescribe 'Helpers - Mongo', () ->
  injector = null

  config =
    key1: 'value1'

  before () ->
    injector = do require '../../../server/helpers/injector'
    injector.register '$config', config

  xdescribe 'config', () ->
    it "should load from $config", ( callback ) ->
      injector = do require '../../../server/helpers/injector'

      injector.register '$config',
        mongo:
          host: '127.0.0.1'
          port: 27017
          db: 'gata'
      injector.factory '$db', require '../../../server/helpers/mongo'

      injector.invoke ( $config, $db ) ->
        expect( $db ).not.to.be.null
        expect( $db.serverConfig.host ).to.equal( $config.mongo.host )
        expect( $db.serverConfig.port ).to.equal( $config.mongo.port )
        return callback()
