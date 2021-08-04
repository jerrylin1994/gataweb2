
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'

xdescribe "Types - User", () ->
  injector = (require '../utils.coffee').getInjector()

  User = null
  $error = null
  ValidationError = null

  before ( callback ) ->
    utils.resolve [ 'User', '$error' ], ( err, results ) ->
      return callback( err ) if err
      { User, $error } = results
      { ValidationError } = $error
      return callback null

  describe 'validateObject', () ->
    it "should validate email as username", ( callback ) ->
      user_mock =
        username: 'tra_vis.bashir+1@gatalabs.com'
        name:
          given: 'Travis'
          family: 'Bashir'
        contact_points: {}

      User.validateObject user_mock, ( err ) ->
        assert.ifError err
        return callback()

    it "should detect empty username", ( callback ) ->
      empty_username =
        username: ''
        name:
          given: 'Steve'
          family: 'McQueen'
        contact_points: {}

      User.validateObject empty_username, ( err, result ) ->
        assert( err instanceof ValidationError )
        return callback()

    it "should detect special characters in username", ( callback ) ->
      empty_username =
        username: 'steve;'
        name:
          given: 'Stephen'
          family: 'McQueen'
        contact_points: {}

      User.validateObject empty_username, ( err, result ) ->
        assert( err instanceof ValidationError )
        return callback()
