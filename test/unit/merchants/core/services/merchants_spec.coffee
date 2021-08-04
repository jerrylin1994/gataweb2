
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'
sinon   = require 'sinon'

utils   = require '../../../utils'
{ ObjectID } = require 'mongodb'

xdescribe 'Core / Service - Merchants', () ->
  merchants = null
  Booking = null

  user_doc =
    _id: ObjectID("54f4990c56f2acf563c6427c")
    username: "alex.mccausland@gmail.com"
    name:
      given: "Alex"
      family: "McCausland"
    contact_points:
      email:
        type: "email"
        value: "alex.mccausland@gmail.com"
        verified: true
      mobile:
        value: "+16474576373"
        text: "+1 647-457-6373"
    reset_tokens: []
    locations:
      [
        _id: ObjectID("54f612a3a1bbaa037cab259f")
        address: "542 College St, Toronto, ON M6G 1A9, Canada"
        components:
          [
            "long_name": "542"
            "short_name": "542"
            "types": [
                "street_number"
            ]
          ,
            "long_name": "College St"
            "short_name": "College St"
            "types": [
                "route"
            ]
          ,
            "long_name": "Palmerston",
            "short_name": "Palmerston",
            "types": [
                "neighborhood",
                "political"
            ]
          ,
            "long_name": "Old Toronto",
            "short_name": "Old Toronto",
            "types": [
                "sublocality_level_1",
                "sublocality",
                "political"
            ]
          ,
            "long_name": "Toronto",
            "short_name": "Toronto",
            "types": [
                "locality",
                "political"
            ]
          ,
            "long_name": "Toronto Division",
            "short_name": "Toronto Division",
            "types": [
                "administrative_area_level_2",
                "political"
            ]
          ,
            "long_name": "Ontario",
            "short_name": "ON",
            "types": [
                "administrative_area_level_1",
                "political"
            ]
          ,
            "long_name": "Canada",
            "short_name": "CA",
            "types": [
                "country",
                "political"
            ]
          ,
            "long_name": "M6G 1A9",
            "short_name": "M6G 1A9",
            "types": [
                "postal_code"
            ]
          ]
        geo:
          type: "Point"
          coordinates: [
            -79.41165139999998
            43.6558315
          ]
        name: "542 College St"
        note: "Use the fire escape.  5th window from the left."
        text: "542 College St, Toronto"
        created_at: new Date("2015-03-03T19:59:31.910Z")
        last_used_at: new Date("2015-06-29T23:59:07.199Z")
      ,
        _id: ObjectID("558af2d344f8cf5814a3ce17")
        address: "428 Millwood Rd, Toronto, ON M4S 1K2, Canada"
        components:
          [
            "long_name": "428"
            "short_name": "428"
            "types": [
              "street_number"
            ]
          ,
            "long_name": "Millwood Rd"
            "short_name": "Millwood Rd"
            "types": [
                "route"
            ]
          ,
            "long_name": "Mount Pleasant East"
            "short_name": "Mount Pleasant East"
            "types": [
                "neighborhood"
                "political"
            ]
          ,
            "long_name": "Old Toronto"
            "short_name": "Old Toronto"
            "types": [
                "sublocality_level_1"
                "sublocality"
                "political"
            ]
          ,
            "long_name": "Toronto"
            "short_name": "Toronto"
            "types": [
                "locality"
                "political"
            ]
          ,
            "long_name": "Toronto Division"
            "short_name": "Toronto Division"
            "types": [
                "administrative_area_level_2"
                "political"
            ]
          ,
            "long_name": "Ontario"
            "short_name": "ON"
            "types": [
                "administrative_area_level_1"
                "political"
            ]
          ,
            "long_name": "Canada"
            "short_name": "CA"
            "types": [
                "country"
                "political"
            ]
          ,
            "long_name": "M4S 1K2"
            "short_name": "M4S 1K2"
            "types": [
                "postal_code"
            ]
          ]
        geo:
          type: "Point"
          coordinates: [
            -79.3835335
            43.7026028
          ]
        name: "428 Millwood Rd"
        is_specific: true
        text: "428 Millwood Rd, Toronto"
        created_at: new Date("2015-06-24T18:11:31.953Z")
        last_used_at: new Date("2015-06-30T00:31:04.633Z")
      ]

  before ( callback ) ->
    utils.resolve [ 'merchants_module' ], ( err ) ->
      return callback( err ) if err
      utils.resolve [ 'core_merchants', 'Booking' ], ( err, results ) ->
        return callback( err ) if err
        merchants = results.core_merchants
        { Booking } = results
        return callback()
