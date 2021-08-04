
assert  = require 'assert'
async   = require 'async'
utils   = require '../utils'

describe 'Helpers - Injector', () ->
  injector = null

  config =
    key1: 'value1'

  before () ->
    injector = do require '../../../server/helpers/injector'
    injector.register '$config', config

  describe 'annotate', () ->
    it "should annotate with arguments name", () ->
      annotations = injector.annotate ( $config ) ->
      assert.deepEqual( annotations, [ '$config' ] )

    it "should annotate with $inject property", () ->
      fn = ( a ) ->
      fn.$inject = ['$config']

      annotations = injector.annotate fn
      assert.deepEqual( annotations, [ '$config' ] )

  describe 'get', () ->
    it "should get a register service", ( callback ) ->
      $config = injector.get( '$config' )
      assert.deepEqual( $config, config )
      return callback()

  describe 'invoke', () ->
    fn = ( test_service, callback ) ->
      return callback( null, test_service )

    before () ->
      injector.factory 'test_service', ( $config, callback ) ->
        return callback null, { type: 'test_service', $config: $config }

    it "should resolve dependencies when invoke a function", ( callback ) ->
      ( injector.invoke fn ) ( err, result ) ->
        return callback( err ) if err?
        assert.deepEqual( result, { type: 'test_service', $config: config } )
        return callback()

    it "should return the same instance for factory", ( callback ) ->
      tasks =
        test_service1: injector.invoke fn
        test_service2: injector.invoke fn

      async.parallel tasks, ( err, results ) ->
        return callback( err ) if err?
        assert.equal( results.test_service1, results.test_service2 )
        return callback()

    it "should detect dependency cycles", ( callback ) ->
      return callback()

  describe "resolve", () ->
    before ( callback ) ->
      # @todo get normal injector
      return callback()

    it "should resolve dependencies only once", ( callback ) ->
      return callback()

    it "should have merchant injectors", ( callback ) ->
      return callback()

    it "dependency in merchant injectors should resolve separately", ( callback ) ->
      return callback()

    it "should not have access to other merchant types in injector", ( callback ) ->
      return callback()
