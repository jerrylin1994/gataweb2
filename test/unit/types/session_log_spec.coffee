
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'
{ ObjectID } = require 'mongodb'

xdescribe "Types - SessionLog", () ->
  injector = (require '../utils.coffee').getInjector()

  SessionLog = null

  before ( callback ) ->
    utils.resolve [ 'SessionLog' ], ( err, results ) ->
      return callback( err ) if err
      { SessionLog } = results

      return callback()

  describe 'validate', () ->
    it "should validate a session log document", ( callback ) ->
      session_log_doc =
        _id: new ObjectID(),
        merchant_id: new ObjectID(),
        user_id: new ObjectID(),
        created:
          at: new Date(),
          by:
            ref: "employees",
            id: new ObjectID()
        type:
          value: "logout",
          label: "Logout"

      SessionLog.validate session_log_doc, ( err, reply ) ->
        assert.ifError err
        return callback()
