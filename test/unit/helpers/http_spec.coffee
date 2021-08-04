
assert = require 'assert'
utils   = require '../utils'

xdescribe "Helpers - Http", () ->
  injector = (require '../utils.coffee').getInjector()

  $http = null

  before ( callback ) ->
    utils.resolve [ '$http' ], ( err, results ) ->
      return callback( err ) if err
      { $http } = results
      return callback()

  describe 'parseHeaderInfo', () ->
    it "should parse header info", () ->
      result = $http.parseHeaderInfo "key1=val1;key2=val2;"

      expected_result =
        key1: 'val1'
        key2: 'val2'

      assert.deepEqual( result, expected_result )
