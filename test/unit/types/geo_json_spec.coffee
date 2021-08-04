
_       = require 'underscore'
async   = require 'async'
chai    = require('chai')
expect  = chai.expect

utils = require '../utils'

xdescribe "Types - GeoJSON", () ->
  injector = (require '../utils.coffee').getInjector()

  GeoJSON = null

  before ( callback ) ->
    utils.resolve [ 'GeoJSON' ], ( err, results ) ->
      return callback( err ) if err
      { GeoJSON } = results

      return callback()

  describe 'Point', () ->
    # http://geojson.org/geojson-spec.html#id2
    it "should validate the spec example", ( callback ) ->
      GeoJSON.Point.validate { type: "Point", coordinates: [100.0, 0.0] }, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

    it "should fail to validate a Point with improper pair", ( callback ) ->
      GeoJSON.Point.validate { 'type': 'Point', 'coordinates': [0.0] }, ( err, result ) ->
        expect( result.valid ).to.equal( false )
        return callback()

    it "should parse correct string", ( ) ->
      result = GeoJSON.Point.parseFromString '44.3,37.2'

      expected_result =
        type: 'Point'
        coordinates: [ 37.2, 44.3 ]

      expect(result).to.deep.equal(expected_result)

    it "should fail to parse incorrect string", ( ) ->
      result = GeoJSON.Point.parseFromString '44.3'
      expect(result).to.be.null

      result = GeoJSON.Point.parseFromString 'ads,44.3'
      expect(result).to.be.null

      result = GeoJSON.Point.parseFromString '1898989,44.3'
      expect(result).to.be.null

      result = GeoJSON.Point.parseFromString()
      expect(result).to.be.null


  describe 'Polygon', () ->
    # http://geojson.org/geojson-spec.html#id4
    polygon_id4 =
      'type': 'Polygon'
      'coordinates': [ [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ] ]

    it "should succeed with valid Polygon", ( callback ) ->
      GeoJSON.Polygon.validate polygon_id4, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

    it "should fail if first and last point don't match", ( callback ) ->
      GeoJSON.Polygon.validate { 'type': 'Polygon', 'coordinates': [ [ [100.0, 0.0], [101.0, 0.0] ] ] }, ( err, result ) ->
        expect( result.valid ).to.equal( false )
        return callback()

    it "should fail if an empty Polygon", ( callback ) ->
      GeoJSON.Polygon.validate { 'type': 'Polygon', 'coordinates': [] }, ( err, result ) ->
        expect( result.valid ).to.equal( false )
        return callback()

    it "should allow meta data", ( callback ) ->
      polygon = Object.assign { properties: { name: 'tested' } }, polygon_id4

      GeoJSON.Polygon.validate polygon, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

  describe 'GeometryCollection', () ->
    # http://geojson.org/geojson-spec.html#geometrycollection
    it "should validate the spec example", ( callback ) ->
      collection1 =
        type: "GeometryCollection"
        geometries:
          [
            type: "Point"
            coordinates: [100.0, 0.0]
          ,
            type: "LineString"
            coordinates: [ [101.0, 0.0], [102.0, 1.0] ]
          ]

      GeoJSON.GeometryCollection.validate collection1, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

    it "should allow optional properties", ( callback ) ->
      collection2 =
        type: "GeometryCollection"
        properties:
          name: 'test1'
        geometries:
          [
            type: "Point"
            coordinates: [100.0, 0.0]
          ,
            type: "LineString"
            coordinates: [ [101.0, 0.0], [102.0, 1.0] ]
          ]

      GeoJSON.GeometryCollection.validate collection2, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

  describe 'validate', () ->
    it "should validate multiple types against the spec", ( callback ) ->
      GeoJSON.validate { type: "Point", coordinates: [100.0, 0.0] }, ( err, result ) ->
        expect( result.valid ).to.equal( true )
        return callback()

    it "should fail on unknown type", ( callback ) ->
      GeoJSON.validate { type: "AwesomePoint", coordinates: [100.0, 0.0] }, ( err, result ) ->
        expect( result.valid ).to.equal( false )
        return callback()
