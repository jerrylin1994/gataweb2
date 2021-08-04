
assert = require 'assert'
moment = require 'moment-timezone'
utils = require '../utils'

describe 'Helpers - Date', () ->
  $date = null

  before ( callback ) ->
    utils.resolve [ '$date' ], ( err, results ) ->
      return callback( err ) if err
      { $date } = results
      return callback()

  describe 'getSecondsToNextCronDate', () ->
    it "should return the second the next cron date", () ->
      # @todo timezone not required here
      date = moment.tz( Date.UTC( 2015, 9, 16, 16, 1, 0 ), "America/Toronto" ).toDate()

      result = $date.getSecondsToNextCronDate( '0 0 * * *', date )
      assert.equal( result, 43140 )

      result = $date.getSecondsToNextCronDate( '*/5 * * * *', date )
      assert.equal( result, 240 )

  describe 'getDatesFromPeriod', () ->
    it "should handle minutes", () ->
      period = '2015-06-28T13:11:00-04:00/PT4H5M'
      [ start_date, end_date ] = $date.getDatesFromPeriod( period )

      assert.equal( start_date.toISOString(), '2015-06-28T17:11:00.000Z' )
      assert.equal( end_date.toISOString(),   '2015-06-28T21:16:00.000Z' )

    it "should work without hours", () ->
      period = '2015-06-28T13:11:00-04:00/PT59M'
      [ start_date, end_date ] = $date.getDatesFromPeriod( period )

      assert.equal( start_date.toISOString(), '2015-06-28T17:11:00.000Z' )
      assert.equal( end_date.toISOString(),   '2015-06-28T18:10:00.000Z' )

  describe 'getActiveDateRangeFromOpenTimes', () ->
    it "should iterate to find the next date range", () ->
      timezone = 'America/Vancouver'
      open_times =
        [
          { from_day: 'SU', from_time: '11:00', to_day: 'SU', to_time: '18:00' }
          { from_day: 'TU', from_time: '11:00', to_day: 'TU', to_time: '18:00' }
          { from_day: 'WE', from_time: '11:00', to_day: 'WE', to_time: '21:00' }
          { from_day: 'TH', from_time: '11:00', to_day: 'TH', to_time: '18:00' }
          { from_day: 'FR', from_time: '11:00', to_day: 'FR', to_time: '18:00' }
          { from_day: 'SA', from_time: '11:00', to_day: 'SA', to_time: '18:00' }
        ]

      base_date = moment().tz( timezone ).set( { year: 2016, month: 8, date: 16 } )

      # Friday morning, 01:00 - should be closed
      now = base_date.set( { hour: 1, minute: 0 } ).toDate()
      active_range = $date.getActiveDateRangeFromOpenTimes( open_times, now, timezone )
      assert.ok( active_range.start_date.isAfter( now ) )
      assert.equal( active_range.start_date.format(), '2016-09-16T11:00:00-07:00' )

      # Friday morning, 12:00 - should be open
      now = base_date.set( { hour: 12, minute: 0 } ).toDate()
      active_range = $date.getActiveDateRangeFromOpenTimes( open_times, now, timezone )
      assert.ok( active_range.start_date.isBefore( now ) )
      assert.ok( active_range.end_date.isAfter( now ) )
      assert.equal( active_range.start_date.format(), '2016-09-16T11:00:00-07:00' )

      # Friday evening, 19:00 - should be closed
      now = base_date.set( { hour: 19, minute: 0 } ).toDate()
      active_range = $date.getActiveDateRangeFromOpenTimes( open_times, now, timezone )
      assert.ok( active_range.start_date.isAfter( now ) )
      assert.equal( active_range.start_date.format(), '2016-09-17T11:00:00-07:00' )

    xit "should allow multiple ranges per day", () ->

    xit "should allow multi-day ranges", () ->

    xit "should handle daylight savings properly", () ->

  describe 'formatDayOfWeek', () ->
    reference_date = new Date( 2016, 1, 5 )

    it "should detect Today", () ->
      date = new Date( 2016, 1, 5 )
      result = $date.formatDayOfWeek( date, { reference_date: reference_date } )
      assert.equal( result, 'Today' )

    it "should detect Tomorrow", () ->
      date = new Date( 2016, 1, 6 )
      result = $date.formatDayOfWeek( date, { reference_date: reference_date } )
      assert.equal( result, 'Tomorrow' )

    it "should detect next days", () ->
      date = new Date( 2016, 1, 7 )
      result = $date.formatDayOfWeek( date, { reference_date: reference_date } )
      assert.equal( result, 'Sunday' )

    it "should detect Yesterday", () ->
      date = new Date( 2016, 1, 4 )
      result = $date.formatDayOfWeek( date, { reference_date: reference_date } )
      assert.equal( result, 'Yesterday' )

    it "should detect previous days", () ->
      date = new Date( 2016, 1, 1 )
      result = $date.formatDayOfWeek( date, { reference_date: reference_date } )
      assert.equal( result, 'Monday' )
