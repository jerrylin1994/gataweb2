
assert = require 'assert'
utils = require '../utils'

xdescribe 'Helpers - Worker', () ->
  $cache = null
  $worker = null

  before ( callback ) ->
    utils.resolve [ '$cache', '$worker' ], ( err, results ) ->
      return callback( err ) if err
      { $cache, $worker } = results

      $worker.create 't_scheduled', { schedule: '0 0 * * *' }, ( callback ) ->
        console.info 't_scheduled run'
        return callback()

      $worker.create 't_trigger', null, ( args..., callback ) ->
        console.info 't_trigger run', args
        return callback()

      return callback()

  # @todo fix with gatalabs/gata#5517
  xdescribe 'checkScheduledTasks', () ->
    before ( callback ) ->
      # @todo should this helper date the current timestamp for efficiency and testing?
      $worker.checkScheduledTasks ( err ) ->
        return callback( err )

    it "should populate workers", () ->
      assert.ok( $worker.workers[ 't_scheduled' ] )
      assert.ok( $worker.workers[ 't_trigger' ] )

    it "should load keys to redis", ( callback ) ->
      $cache.multi()
        .get( 'worker_schedule:t_scheduled' )
        .pttl( 'worker_schedule:t_scheduled' )
        .zscore( 'workers_scheduled', 't_scheduled' )
        .pttl( 'workers_start' )
        .get( 'worker_schedule:t_trigger' )
        .exec ( err, replies ) ->
          assert.ifError( err )
          [ scheduled_get, scheduled_pttl, scheduled_time, scheduled_trigger, trigger_get ] = replies

          assert.equal( scheduled_get, '0 0 * * *' )
          assert.equal( scheduled_pttl, -1 )
          assert.equal( trigger_get, null )

          return callback()

  describe 'runWorkerIn', () ->
