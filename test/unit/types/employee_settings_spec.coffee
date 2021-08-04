
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils   = require '../utils'

{ ObjectID } = require 'mongodb'

describe 'Types - EmployeeSettings', () ->
  EmployeeSettings = null

  before ( callback ) ->
    utils.resolve [ 'EmployeeSettings' ], ( err, results ) ->
      return callback( err ) if err
      { EmployeeSettings } = results

      return callback()

  describe 'fromEmployeeSettingsDocument', () ->
    it "should load empty document", () ->
      merchant = {
        settings: {
          messenger: {
            enabled: true
            status: "live"
          }
        }
      }

      employee_settings = EmployeeSettings.fromEmployeeSettingsDocument( undefined, merchant )
      assert.equal( employee_settings.notifications.messenger_all.email.enabled, true )
