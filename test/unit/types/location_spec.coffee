
_       = require 'underscore'
async   = require 'async'
chai    = require('chai')
expect  = chai.expect
{ ObjectID } = require 'mongodb'
utils = require '../utils'

xdescribe "Types - Location", () ->
  injector = (require '../utils.coffee').getInjector()

  Location = null
  $error = null
  ValidationError = null

  before ( callback ) ->
    utils.resolve [ 'Location', '$error' ], ( err, results ) ->
      return callback( err ) if err
      { Location, $error } = results
      { ValidationError } = $error

      return callback()

  describe 'validateObject', () ->
    it "should detect valid object", ( callback ) ->
      location =
        address: "301 Front St W, Toronto, ON M5V 2T6, Canada"
        components:
          [
            long_name: "301"
            short_name: "301"
            types: [ "street_number" ]
          ,
            long_name: "Front St W",
            short_name: "Front St W"
            types: [ "route" ]
          ]
        name: "CN tower"
        note: "Test"
        is_specific: true
        geo:
          lat: 43.642566
          lng: -79.38705700000003

      geo =
        type: "Point"
        coordinates: [ -79.38705700000003, 43.642566 ]

      Location.sanitize location
      expect( location.geo ).to.deep.equal( geo )
      expect( location ).to.have.property('text', 'CN tower (301 Front St W)' )

      Location.validateObject location, ( err, result ) ->
        return callback( err ) if err?
        expect( result.valid ).to.eql true
        return callback()

    it "should detect invalid object", ( callback ) ->
      location =
        address: "301 Front St W, Toronto, ON M5V 2T6, Canada"
        components:
          [
            long_name: "301"
            short_name: "301"
            types: [ "street_number" ]
          ,
            long_name: "Front St W"
            short_name: "Front St W"
            types: [ "route" ]
          ]

      Location.sanitize location
      Location.validateObject location, ( err, result ) ->
        expect( err ).to.exist
        expect( err instanceof ValidationError ).to.eql true
        return callback()

  describe 'fromDocument', () ->
    it "should parse document to object", ( ) ->
      location_doc =
        _id: new ObjectID()
        address: "301 Front St W, Toronto, ON M5V 2T6, Canada"
        components:
          [
            long_name: "301"
            short_name: "301"
            types: [ "street_number" ]
          ,
            long_name: "Front St W"
            short_name: "Front St W"
            types: [ "route" ]
          ]
        name: "CN tower"
        note: "Test"
        geo:
          type: "Point"
          coordinates: [ -79.38705700000003, 43.642566 ]
        text: "CN tower (301 Front St W), Toronto"

      location = Location.fromDocument location_doc

      expect( location ).to.exist
      expect( _.omit( location, 'id' ) ).to.deep.equal( _.omit( location_doc, '_id' ) )
      expect( location ).to.have.property('id', location_doc._id.toString() )

  describe 'toJSON', () ->
    it "should serialize a location to JSON", () ->
      location =
        id: '538f8fa1c6dc5be82ee48870'
        address: "301 Front St W, Toronto, ON M5V 2T6, Canada"
        components:
          [
            long_name: "301"
            short_name: "301"
            types: [ "street_number" ]
          ,
            long_name: "Front St W"
            short_name: "Front St W"
            types: [ "route" ]
          ]
        name: "CN tower"
        note: "Test"
        geo:
          type: "Point"
          coordinates: [ -79.38705700000003, 43.642566 ]
        text: "CN tower (301 Front St W), Toronto"

      location_json = Location.toJSON location

      expect( location_json ).to.exist
      expect( location_json ).to.deep.equal( location )

  describe 'generateTextIndex', () ->
    it "should not be redundant", () ->
      location =
        address: "33 Iceboat Terrace, Toronto, ON M5V 0E5, Canada"
        components:
          [
            "long_name": "33"
            "short_name": "33"
            "types": [
              "street_number"
            ]
          ,
            "long_name": "Iceboat Terrace"
            "short_name": "Iceboat Terr"
            "types": [
              "route"
            ]
          ,
            "long_name": "CityPlace"
            "short_name": "CityPlace"
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
              "country",
              "political"
            ]
          ,
            "long_name": "M5V 0E5"
            "short_name": "M5V 0E5"
            "types": [
              "postal_code"
            ]
          ]
        name: "33 Iceboat Terr"
        geo:
          type: "Point"
          coordinates: [
            -79.39799060000001
            43.64032
          ]
        text: "33 Iceboat Terr (33 Iceboat Terrace), Toronto"

      text_index = Location.generateTextIndex location

      target_index =
        [
          'm5v0e5'
          '33 iceboat terrace toronto'
          'iceboat terrace toronto'
          'toronto'
          '33 iceboat terr toronto'
        ]

      expect( text_index ).to.exist
      expect( text_index ).to.deep.equal( target_index )
