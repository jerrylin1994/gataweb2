
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils   = require '../utils'

{ ObjectID } = require 'mongodb'

describe 'Types - Review', () ->
  Review = null

  before ( callback ) ->
    utils.resolve [ 'Review' ], ( err, results ) ->
      return callback( err ) if err
      { Review } = results

      return callback()

  describe 'getPullResults', () ->
    it "should detect new by id", () ->
      # @todo load test data

      connected_account_id = ObjectID( '59f3b55059dfdbc869628a7b' )

      lookup_results =
        review_edge_account_doc:
          _id: connected_account_id
          type: 'google'
        existing_review_docs:
          [
            _id: ObjectID("5a0c10a7f5ac1b38006268d3")
            source: "google"
            connected_account:
              _id: connected_account_id
              review_id: "AIe9_BHR7p0hPy1flx1br0TYdEUBt5zZj447fbfxx_7u_el3FTN8qRumF21Una4bR5Pyr-kGaEuSoFiVOSLBJpj71LFo_q_eaOHBUqNfXOJam8New6hYKzk"
            created:
              at: new Date("2017-11-14T18:42:08.870Z")
              by:
                display_name: "Jenny Lee"
            updated:
              at: new Date("2017-11-14T18:42:08.870Z")
            rating: 100
            sort:
              customer: "jenny lee"
            sentiment: "positive"
          ,
            _id: ObjectID("5a0c10c7f5ac1b3800626cec")
            source: "google"
            connected_account:
              _id: connected_account_id
              review_id: "AIe9_BGlY-BaOO_aND3JZqxJBS1RYF0jJApjFgvZDOU8XLWlBGMs50E4Rd7sIq3-ybQ4peAzeNDI6ZUO0Fq5sUMbRwDO5T3PDGWx48yAM3fZHo91pgtaGKE"
            created:
              at: new Date("2017-11-15T02:44:17.440Z")
              by:
                display_name: "John DePietro"
            updated:
              at: new Date("2017-11-15T02:44:17.440Z")
            rating: 100
            sort:
              customer: "john depietro"
            sentiment: "positive"
          ]
        pull_review_docs:
          [
            _id: ObjectID("5a0c10c7f5ac1b3800626cec")
            source: "google"
            connected_account:
              _id: connected_account_id
              review_id: "AIe9_BGlY-BaOO_aND3JZqxJBS1RYF0jJApjFgvZDOU8XLWlBGMs50E4Rd7sIq3-ybQ4peAzeNDI6ZUO0Fq5sUMbRwDO5T3PDGWx48yAM3fZHo91pgtaGKE"
            created:
              at: new Date("2017-11-15T02:44:17.440Z")
              by:
                display_name: "John DePietro"
            updated:
              at: new Date("2017-11-15T02:44:17.440Z")
            rating: 100
            sort: {
              customer: "john depietro"
            },
            sentiment: "positive"
          ,
            _id: ObjectID( '5a0c10cff5ac1b3800626de8' )
            source: "google"
            connected_account:
              _id: connected_account_id
              review_id: "AIe9_BE2uvj37J0NSRdDbsf5-SBJIDV307Z2N8wS3faXeK6XGoDXjrSsiKxZS8BKzPQWGXBZyLOFNtxloyovF52ylIU_HKFYeikLgqTwxzxLXKQzjHXqcdg"
            created:
              at: new Date( "2017-11-14T14:44:32.486Z" )
              by:
                display_name: "Ellie Sarah Cartman"
            updated:
              at: new Date( "2017-11-14T14:44:32.486Z" )
            rating: 75
            comment: "Accommodating crew, clean lockers, easy controlled access."
            sort:
              customer: "ellie sarah cartman"
            sentiment: "positive"
          ]

      pull_results = Review.getPullResults( lookup_results )

      assert.equal( pull_results.new_review_docs.length, 1 )
      assert.equal( pull_results.updated_review_docs.length, 0 )
      assert.equal( pull_results.deleted_review_docs.length, 1 )

    xit "should detect updates", () ->

    xit "should handle id updates from google", () ->
      # @todo link ticket
