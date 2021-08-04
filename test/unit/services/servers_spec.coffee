
_       = require 'underscore'
assert  = require 'assert'

utils   = require '../utils'

xdescribe 'Service - Servers', () ->
  servers = null
  $config = null

  before ( callback ) ->
    utils.resolve [ '$config', 'servers' ], ( err, results ) ->
      return callback( err ) if err?
      { $config, servers } = results
      return callback()

  describe 'get', () ->
    it "should detect the current server", ( callback ) ->
      servers.get $config.server_id, ( err, server ) ->
        assert( server?.online, 'is online' )
        return callback()

  describe 'query', () ->
    it "should list the servers", ( callback ) ->
      servers.query {}, ( err, servers ) ->
        assert.ifError( err )
        return callback()
