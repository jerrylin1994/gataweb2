
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'
chai    = require('chai')
expect  = chai.expect

utils = require '../../../utils'

{ ObjectID } = require 'mongodb'

xdescribe "Core / Types - Merchant", () ->
  Merchant = null
  complicated_merchant = null
  complicated_provider = null
  default_merchant = null

  before ( callback ) ->
    utils.resolve [ 'merchants_module' ], ( err ) ->
      return callback( err ) if err
      utils.resolve [ 'core_Merchant' ], ( err, results ) ->
        return callback( err ) if err
        Merchant = results.core_Merchant

        return callback()

  describe 'fromDocument', () ->
    merchant_doc =
      _id: ObjectID('54d6ad6394fb3d3619f68dc0')
      members: []
      roles:
        [
          _id: ObjectID('54d6ad6394fb3d3619f68dc2')
          name: "Manager"
          permissions:
            [
              'admin_drivers'
              'create_booking'
              'admin_settings'
              'admin_billing'
              'admin_users'
            ]
        ,
          _id: ObjectID('54d6ad6394fb3d3619f68dc3')
          name: "Dispatcher"
          permissions:
            [
              'create_booking'
            ]
        ]
      name: "DryCleaning"
      offers:
        [
          item_offered: 'dry_cleaning'
        ]
      location:
        address: null
      email: "contact@drycleaning.com"
      telephone: null
      settings: {}
      reference_prefix: "ALD"

    it 'should default settings', ( callback ) ->
      merchant = Merchant.fromDocument merchant_doc

      assert.equal( merchant.settings.transaction.enabled, false )
      return callback()

  describe 'toPublicJSON', () ->
    merchant_doc =
      _id: ObjectID('54d6ad6394fb3d3619f68dc0')
      members: []
      roles:
        [
          _id: ObjectID('54d6ad6394fb3d3619f68dc2')
          name: "Manager"
          permissions:
            [
              'admin_drivers'
              'create_booking'
              'admin_settings'
              'admin_billing'
              'admin_users'
            ]
        ,
          _id: ObjectID('54d6ad6394fb3d3619f68dc3')
          name: "Dispatcher"
          permissions:
            [
              'create_booking'
            ]
        ]
      name: "DryCleaning"
      offers:
        [
          item_offered: 'dry_cleaning'
        ]
      location:
        address: null
      email: "contact@drycleaning.com"
      telephone: null
      type: 'dry_cleaning'
      timezone: 'America/Toronto'
      settings:
        gatahub:
          enabled: true
        locale: 'en-CA'
        transaction:
          enabled: true
      reference_prefix: "ALD"

  describe 'getAvailabilitySummary', () ->

    it 'should generate the availability summary for merchant with scheduling now', () ->
      merchant_doc =
        settings:
          brick_mortar:
            enabled: true
            open_times: [
              from_day: 'MO'
              to_day: 'MO'
            ,
              from_day: 'WE'
              to_day: 'WE'
            ,
              from_day: 'FR'
              to_day: 'SA'
            ]
          mobile:
            enabled: true
            open_times: [
              from_day: 'TU'
              to_day: 'TU'
            ,
              from_day: 'WE'
              to_day: 'WE'
            ,
              from_day: 'SU'
              to_day: 'MO'
            ]

      availability_summary = Merchant.getAvailabilitySummary( merchant_doc, 'now' )

      assert.deepEqual availability_summary, {
        SU:
          brick_mortar: false
          mobile: true
        MO:
          brick_mortar: true
          mobile: true
        TU:
          brick_mortar: false
          mobile: true
        WE:
          brick_mortar: true
          mobile: true
        TH:
          brick_mortar: false
          mobile: false
        FR:
          brick_mortar: true
          mobile: false
        SA:
          brick_mortar: true
          mobile: false
      }

    it 'should generate the availability summary for merchant with scheduling now with several days period', () ->
      merchant_doc =
        settings:
          brick_mortar:
            enabled: true
            open_times: [
              from_day: 'MO'
              to_day: 'WE'
            ]
          mobile:
            enabled: true
            open_times: [
              from_day: 'FR'
              to_day: 'MO'
            ]

      availability_summary = Merchant.getAvailabilitySummary( merchant_doc, 'now' )

      assert.deepEqual availability_summary, {
        SU:
          brick_mortar: false
          mobile: true
        MO:
          brick_mortar: true
          mobile: true
        TU:
          brick_mortar: true
          mobile: false
        WE:
          brick_mortar: true
          mobile: false
        TH:
          brick_mortar: false
          mobile: false
        FR:
          brick_mortar: false
          mobile: true
        SA:
          brick_mortar: false
          mobile: true
      }

    it 'should generate the availability summary for merchant with weekly scheduling', () ->

      merchant_doc =
        settings:
          brick_mortar:
            enabled: true
          mobile:
            enabled: true

      scheduling_form =
        enabled: true
        fieldsets: [
          scheduling:
            availability: [
              pickup:
                byday: 'MO'
            ,
              pickup:
                byday: 'WE'
            ]
        ]

      availability_summary = Merchant.getAvailabilitySummary( merchant_doc, 'weekly', scheduling_form )

      assert.deepEqual availability_summary, {
        SU:
          brick_mortar: false
          mobile: false
        MO:
          brick_mortar: true
          mobile: true
        TU:
          brick_mortar: false
          mobile: false
        WE:
          brick_mortar: true
          mobile: true
        TH:
          brick_mortar: false
          mobile: false
        FR:
          brick_mortar: false
          mobile: false
        SA:
          brick_mortar: false
          mobile: false
      }
