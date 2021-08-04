assert = require 'assert'
utils = require '../utils'

describe 'Helpers - Pagination', () ->
  $pagination = null

  before ( callback ) ->
    utils.resolve [ '$pagination' ], ( err, results ) ->
      return callback( err ) if err
      { $pagination } = results
      return callback()

  describe 'paginateArray', () ->
    it "should paginate multi pages", () ->
      array = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]
      result = $pagination.paginateArray( array, 2, 5 )
      assert.equal( result.count, 15 )
      assert.equal( result.page, 2 )
      assert.equal( result.per_page, 5 )
      assert.equal( result.length, 5 )
      assert.equal( result[ 0 ], 6 )
      assert.equal( result[ 4 ], 10 )

    it "should paginate single pages", () ->
      array = [ 1, 2, 3, 4 ]
      result = $pagination.paginateArray( array, 1, 5 )
      assert.equal( result.count, 4 )
      assert.equal( result.page, 1 )
      assert.equal( result.per_page, 5 )
      assert.equal( result.length, 4 )
      assert.equal( result[ 0 ], 1 )
      assert.equal( result[ 3 ], 4 )
