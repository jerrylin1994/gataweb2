
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'
chai    = require 'chai'
expect  = chai.expect

utils = require '../utils'
{ ObjectID } = require 'mongodb'

xdescribe 'Helpers - Redis', () ->

  $cache = null
  $error = null
  last_error = null

  before ( callback ) ->
    $injector = utils.getInjector()

    ($injector.instantiate '$error') ( err, service ) ->
      return callback( err ) if err

      $error = service

      # Replace handleError in the injection so we can test for errors
      $error.handleError = ( err ) ->
        last_error = err

      ($injector.instantiate '$cache', { $error: $error }) ( err, service ) ->
        return callback( err ) if err
        $cache = service

        return callback()

  describe "basic command", () ->
    key = "test:#{ Math.random() }"

    afterEach ( callback ) ->
      $cache.del key, ( err, reply ) ->
        return callback( err ) if err?
        return callback( null )

    it "should proxy the redis command", ( callback ) ->
      $cache.set key, 'content here', ( err, response ) ->
        return callback( err ) if err?

        $cache.get key, ( err, reply ) ->
          return callback( err ) if err?
          expect( reply ).to.be.equal('content here')
          return callback null

  describe 'hmove', () ->
    key = "test:#{ Math.random() }"

    afterEach ( callback ) ->
      $cache.del key, ( err, reply ) ->
        return callback( err ) if err?
        return callback( null )


    it 'should move a key', ( callback ) ->
      value = Math.random()

      $cache.multi()
        .hset key, 'original', value
        .hmove key, 'original', 'new'
        .hmget key, 'original', 'new'
        .exec ( err, replies ) ->
          assert.ifError( err )

          [ hset_reply, hmove_reply, hmget_reply ] = replies
          [ original_value, new_value ] = hmget_reply

          assert.equal( hmove_reply, 1, 'hmove return success' )
          assert.equal( original_value, null, 'original missing' )
          assert.equal( new_value, value, 'new there' )
          return callback()

  describe 'hdelif', () ->
    key = "test:#{ Math.random() }"

    afterEach ( callback ) ->
      $cache.del key, ( err, reply ) ->
        return callback( err ) if err?
        return callback( null )

    it 'should delete the field if match', ( callback ) ->
      value = Math.random()

      $cache.multi()
        .hset key, 'value', value
        .hdelif key, 'value', value
        .hget key, 'value'
        .exec ( err, replies ) ->
          assert.ifError( err )

          [ hset_reply, hdelif_reply, hget_reply ] = replies

          assert.equal( hdelif_reply, 1, 'hdelif return success' )
          assert.equal( hget_reply, null, 'field not deleted' )

          return callback()

    it 'should not delete the field if not match', ( callback ) ->
      value = Math.random()

      $cache.multi()
        .hset key, 'value', value
        .hdelif key, 'value', Math.random()
        .hget key, 'value'
        .exec ( err, replies ) ->
          assert.ifError( err )

          [ hset_reply, hdelif_reply, hget_reply ] = replies

          assert.equal( hdelif_reply, 0, 'hdelif return failue' )
          assert.equal( hget_reply, value, 'field deleted' )

          return callback()

  describe 'zmvif', () ->
    key1 = "test:#{ Math.random() }"
    key2 = "test:#{ Math.random() }"

    it 'should move if matched', ( callback ) ->
      value = Math.random()
      timestamp = (new Date).getTime()

      $cache.multi()
        .zadd( key1, timestamp, value )
        .zmvif( key1, key2, value, timestamp )
        .zrange( key1, 0, -1 )
        .zrange( key2, 0, -1 )
        .del( key1, key2 )
        .exec ( err, replies ) ->
          assert.ifError( err )
          [ zadd_reply, zmvif_reply, zrange1_reply, zrange2_reply ] = replies

          assert.equal( zmvif_reply, 1 )
          assert.equal( zrange1_reply.length, 0 )
          assert.equal( zrange2_reply.length, 1 )

          return callback()

    it "should not move if isn't matched", ( callback ) ->
      value = Math.random()
      timestamp = (new Date).getTime()

      $cache.multi()
        .zadd( key1, timestamp, value )
        .zmvif( key1, key2, value, timestamp + 1 )
        .zrange( key1, 0, -1 )
        .zrange( key2, 0, -1 )
        .del( key1, key2 )
        .exec ( err, replies ) ->
          assert.ifError( err )
          [ zadd_reply, zmvif_reply, zrange1_reply, zrange2_reply ] = replies

          assert.equal( zmvif_reply, 0 )
          assert.equal( zrange1_reply.length, 1 )
          assert.equal( zrange2_reply.length, 0 )

          return callback()

  describe 'update_provider_if', () ->
    key = "test:#{ Math.random() }"

    afterEach ( callback ) ->
      $cache.del key, ( err, reply ) ->
        return callback( err ) if err?
        return callback( null )

    it 'should fail with wrong type', ( callback ) ->
      $cache.set key, 1, ( err, reply ) ->
        $cache.update_provider_if key, 'status_key', 'dispatching', ( err, reply ) ->
          assert.ok( err )
          return callback()

    it 'should work with hashes', ( callback ) ->
      hash_values =
        status_key: 'dispatching'
        fulfillment_id: "#{ new ObjectID() }"

      $cache.hmset key, hash_values, ( err, reply ) ->
        $cache.update_provider_if key, hash_values, 'ready', ( err, reply ) ->
          assert.ifError( err )
          assert.equal( reply, 'OK', 'not OK' )

          $cache.hgetall key, ( err, new_hash ) ->
            assert.ifError( err )
            assert.deepEqual( new_hash, { status_key: 'ready' } )
            return callback()

    it 'should block on mismatch', ( callback ) ->
      hash_values =
        status_key: 'dispatching'
        fulfillment_id: "#{ new ObjectID() }"

      $cache.hmset key, hash_values, ( err, reply ) ->
        $cache.reset_provider_if key, { fulfillment_id: "#{ new ObjectID() }" }, 'ready', ( err, reply ) ->
          assert.ifError( err )
          assert.equal( reply, 0 )
          return callback()

  describe 'unlock', () ->
    key = "test:#{ Math.random() }"

    afterEach ( callback ) ->
      $cache.del key, ( err, reply ) ->
        return callback( err ) if err?
        return callback( null )

    it 'should unlock a key', ( callback ) ->
      value = Math.random()

      $cache.multi()
        .set( key, value, 'EX', 5 )
        .unlock( key, value )
        .get( key )
        .exec ( err, replies ) ->
          assert.ifError( err )
          assert.equal( replies[ 1 ], 1, 'unlock returns success' )
          assert.equal( replies[ 2 ], null, 'lock should have been cleared' )
          return callback()

    it 'should fail if lock has been rewritten', ( callback ) ->
      value = Math.random()

      $cache.multi()
        .set( key, value, 'EX', 5 )
        .unlock( key, value + '1' )
        .get( key )
        .exec ( err, replies ) ->
          assert.equal( replies[ 1 ], 0, 'unlock returns failue' )
          assert.equal( replies[ 2 ], value, 'lock should not have been cleared' )
          return callback()

  describe 'lua scripts', () ->
    it 'should be accessible on multi', () ->
      assert( $cache.multi().unlock, 'unlock defined' )

  describe 'error handling', () ->
    it 'should log errors in multi', ( callback ) ->
      # Note: Redis has different handling for errors it can detect prior to running the command (ie. wrong number of args)
      $cache.multi()
        .get( 'undefined key' )
        # This will throw an exception at runtime because 'PX' requires another param
        .set( 'key', 'value', 'PX' )
        .exec ( err, replies ) ->
          assert.equal( replies[ 1 ], last_error )
          return callback()

  describe 'pubsub', () ->
    test_pattern = ( pattern, channel, should_match, test_message, callback ) ->

      timeout = null
      test_message ?= 'message_' + (new Date()).getTime()

      listener = ( event_channel, message ) ->

        if !message?
          message = event_channel
          event_channel = null

        if should_match
          expect( message ).to.deep.equal( test_message )
          clearTimeout( timeout )
          return callback null
        else
          return callback new Error("#{ channel } should not match to pattern #{ pattern }")

      timeout = setTimeout () ->
        if should_match
          return callback new Error("#{ channel } should match to pattern #{ pattern }")
        else
          $cache.removeListener pattern, listener
          return callback null
      , 500

      $cache.once pattern, listener

      process.nextTick ->
        $cache.emit channel, test_message

    test_patterns = ( patterns, should_match, callback ) ->
      async.eachSeries(
        patterns
        , ( test, callback ) ->
          { channel, pattern } = test
          return test_pattern pattern, channel, should_match, null, callback
        , callback
      )


    it "should receive message with pattern '*' if matching", ( callback ) ->
      test_patterns([
        pattern: 'pattern_test1:*'
        channel: 'pattern_test1:1234'
      ,
        pattern: 'pattern_test2:*:sub_pattern:*'
        channel: 'pattern_test2:1234:sub_pattern:1'
      ,
        pattern: 'pattern_test3:*:sub_pattern:*'
        channel: 'pattern_test3:1234:sub_pattern:1:test'
      ,
        pattern: 'pattern_test4:*:sub_pattern:*:test'
        channel: 'pattern_test4:1234:sub_pattern:1:test'
      ], true, callback)

    it "should not receive message with pattern '*' if not matching", ( callback ) ->
      test_patterns([
        pattern: 'pattern_test5:*'
        channel: 'pattern_test5'
      ,
        pattern: 'pattern_test6:*:sub_pattern'
        channel: 'pattern_test6:1234:sub_patternnnnnnnn'
      ,
        pattern: 'pattern_test7:*:sub_pattern:*'
        channel: 'pattern_test7:1234:sub_patternnnnnnn:1:test'
      ], false, callback)

    it "should receive message with payload if matching", ( callback ) ->
      payload_message =
        key1: 'value1'
        key2: 'value2'
        key3: ['value3']

      return test_pattern 'pattern_test8', 'pattern_test8', true, payload_message, callback

    it "should not receive message with payload if not matching", ( callback ) ->
      return test_pattern 'pattern_test9', 'pattern', false, null, callback

  # Time series helpers
  # ===================

  describe 'tincr', () ->
    test_key = 'timeseries_test'

    it "Should add keys with expiry", ( callback ) ->
      timestamp = (new Date()).getTime()
      timestamps = (timestamp - offset for offset in [ 0..3600000 ] by 2000)

      async.each(
        timestamps

        ( timestamp, callback ) ->
          $cache.tincr test_key, timestamp, callback

        ( err, results ) ->

          validation_tasks =
            minutes: ( callback ) ->
              # Grab last hour of minutes
              $cache.tcard test_key, 'minute', timestamp - 3600000, timestamp, callback

            hours: ( callback ) ->
              # Grab last hour of minutes
              $cache.tcard test_key, 'hour', timestamp - 3600000, timestamp, callback

          async.parallel validation_tasks, ( err, results ) ->
            return callback err if err
            assert.equal( results.minutes, timestamps.length )
            assert.equal( results.hours, timestamps.length )
            return $cache.pdel "#{ test_key }:*", callback
      )
