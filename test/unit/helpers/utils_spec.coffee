
assert  = require 'assert'
{ expect } = require 'chai'
{ ObjectID } = require 'mongodb'

describe 'Helpers - Utils', () ->
  $util = require('../../../server/helpers/utils')()

  describe 'generateTokenIndex', () ->
    it 'should handle empty input', () ->
      result = $utils.generateTokenIndex()
      expect( result ).to.be.a( 'array' )
      expect( result ).to.have.length( 0 )

    it 'should handle single token input', () ->
      result = $utils.generateTokenIndex( 'Sven' )
      expect( result ).to.be.a( 'array' )
      expect( result ).to.have.length( 1 )
      expect( result[ 0 ] ).to.equal( 'sven' )

    it 'should handle multiple token input', () ->
      result = $utils.generateTokenIndex( 'Sven Amadaeus Hondernickles' )
      expect( result ).to.be.a( 'array' )
      expect( result ).to.have.length( 3 )

      expect( result.indexOf( 'hondernickles' ) > -1 ).to.equal( true )
      expect( result.indexOf( 'amadaeus hondernickles' ) > -1 ).to.equal( true )
      expect( result.indexOf( 'sven amadaeus hondernickles' ) > -1 ).to.equal( true )

    it 'should ignore spaces', () ->
      result = $utils.generateTokenIndex( ' ' )
      expect( result ).to.be.a( 'array' )
      expect( result ).to.have.length( 0 )

  describe 'generateEmailTokenIndex', () ->
    it 'should make 1 token for normal emails', () ->
      result = $utils.generateEmailTokenIndex( 'user@example.com' )
      assert.equal( result.length, 1 )
      assert.equal( result[ 0 ], 'user@example.com' )

    it 'should not create token for email tag', () ->
      result = $utils.generateEmailTokenIndex( 'user+otheruser@example.com' )
      assert.equal( result.indexOf( 'user+otheruser@example.com' ) > -1, true )
      assert.equal( result.indexOf( 'user@example.com' ) > -1, true )
      assert.equal( result.indexOf( 'otheruser@example.com' ), -1 )

    it 'should return empty array for invalid emails', () ->
      result = $utils.generateEmailTokenIndex( ' ' )
      assert( result instanceof Array )
      assert.equal( result.length, 0 )

  describe 'isDecimalNumber', () ->
    it 'should detect decimal number', () ->
      assert.equal( $utils.isDecimalNumber( '4577' ), true )
      assert.equal( $utils.isDecimalNumber( '45.56' ), true )
      assert.equal( $utils.isDecimalNumber( '-870.8' ), true )

    it 'should detect not decimal number', () ->
      assert.equal( $utils.isDecimalNumber( '45d' ), false )
      assert.equal( $utils.isDecimalNumber( '45,89' ), false )
      assert.equal( $utils.isDecimalNumber( '' ), false )
      assert.equal( $utils.isDecimalNumber( '89.' ), false )

  describe 'isInteger', () ->
    it 'should detect integer number', () ->
      assert.equal( $utils.isInteger( 4 ), true )
      assert.equal( $utils.isInteger( 34 ), true )
      assert.equal( $utils.isInteger( -870 ), true )
      assert.equal( $utils.isInteger( '12' ), true )

    it 'should detect not integer number', () ->
      assert.equal( $utils.isInteger( '45d' ), false )
      assert.equal( $utils.isInteger( 45.89 ), false )
      assert.equal( $utils.isInteger( '' ), false )
      assert.equal( $utils.isInteger( '+23' ), false )
      assert.equal( $utils.isInteger( null ), false )

  describe 'parseLatLng', () ->
    it "should parse correct string", () ->
      result = $utils.parseLatLng '44.3,37.2'

      expected_result =
        lat: 44.3
        lng: 37.2

      assert.deepEqual( result, expected_result )

    it "should fail to parse incorrect string", () ->
      result = $utils.parseLatLng( '44.3' )
      assert.equal( result, null )

      result = $utils.parseLatLng( 'ads,44.3' )
      assert.equal( result, null )

      result = $utils.parseLatLng( '1898989,44.3' )
      assert.equal( result, null )

      result = $utils.parseLatLng()
      assert.equal( result, null )

  describe 'parseName', () ->
    it "should parse a normal string", () ->
      name = $utils.parseName( "Bruce Wayne" )
      assert.deepEqual( name, { display: "Bruce Wayne", given: "Bruce", family: "Wayne" } )

    it "should parse a normal string with weird padding", () ->
      name = $utils.parseName( "   Bruce   Wayne   " )
      assert.deepEqual( name, { display: "Bruce Wayne", given: "Bruce", family: "Wayne" } )

    it "should handle middle names", () ->
      name = $utils.parseName( "Bruce Thomas Wayne" )
      assert.deepEqual( name, { display: "Bruce Thomas Wayne", given: "Bruce Thomas", family: "Wayne" } )

    it "should parse first name", () ->
      name = $utils.parseName( "Batman" )
      assert.deepEqual( name, { display: "Batman", given: "Batman" } )

    it "should parse first name with weird padding", () ->
      name = $utils.parseName( "   Batman  " )
      assert.deepEqual( name, { display: "Batman", given: "Batman" } )

    it "should return input with broken data", () ->
      name = $utils.parseName( null )
      assert.deepEqual( name, null )

  describe 'cloneDeep', () ->
    it "should copy a nested object", () ->
      obj =
        a:
          key: 'value'

      clone = $utils.cloneDeep( obj )

      assert.deepEqual( obj, clone )
      assert.notEqual( obj, clone )
      assert.notEqual( obj.a, clone.a )

    it "should copy an array", () ->
      arr =
        [
          [
            'item1'
          ],
          [
            a:
              key: 'value'
          ]
        ]

      clone = $utils.cloneDeep( arr )

      assert.deepEqual( arr, clone )
      assert.notEqual( arr, clone )
      assert.notEqual( arr[0], clone[0] )

  describe 'defaultsDeep', () ->
    it "should not overwrite values", () ->
      obj =
        a:
          key: 'value'

      obj_defaults =
        a:
          key: 'default'

      $utils.defaultsDeep( obj, obj_defaults )
      assert.equal( obj.a.key, 'value' )

    it "should default values", () ->
      obj =
        a: {}

      obj_defaults =
        a:
          key: 'default'

      $utils.defaultsDeep( obj, obj_defaults )
      assert.equal( obj.a.key, 'default' )

  describe 'fromDocument', () ->
    it "should translate objectIDs", () ->
      doc =
        _id: new ObjectID()
        merchant_id: new ObjectID()
        value: 10

      obj = $utils.fromDocument( doc )
      expected_obj =
        id: "#{ doc._id }"
        merchant_id: "#{ doc.merchant_id }"
        value: 10

      assert.deepEqual( obj, expected_obj )

    it "should be reversable", () ->
      doc =
        _id: new ObjectID()
        merchant_id: new ObjectID()
        value: 10

      obj = $utils.fromDocument( doc )
      doc2 = $utils.toDocument( obj )

      assert.deepEqual( doc, doc2 )

  describe 'parseObjectID', () ->
    it "should parse correct ObjectId", () ->
      id = '57d8134eba50308d27d0528e'
      object_id = ObjectID( id )

      result1 = $utils.parseObjectID( object_id )
      assert.notEqual( result1, null )
      assert.equal( result1.equals( object_id ), true )

      result2 = $utils.parseObjectID( id )
      assert.notEqual( result2, null )
      assert.equal( result2.equals( object_id ), true )

    it "should fail to parse incorrect ObjectId", () ->
      assert.equal( $utils.parseObjectID( 'seb@mail.com' ), null )
      assert.equal( $utils.parseObjectID( '57d8134eba50308d27d0528Z' ), null )
      assert.equal( $utils.parseObjectID(), null )
      assert.equal( $utils.parseObjectID( {} ), null )
      assert.equal( $utils.parseObjectID( 42 ), null )

  describe 'pluckUniqObjectId', () ->
    it "should extract ObjectId when field is a string", () ->
      docs =
        [
          request_id: ObjectID( '58347be7325ba2dc36b590c9' )
        ,
          request_id: '55538f53d0e699ce51da78ae'
        ,
          request_id: ObjectID( '58347be7325ba2dc36b590c9' )
        ,
          request_id: ObjectID( '55538f53d0e699ce51da78ae' )
        ]

      result = $utils.pluckUniqObjectId( docs, 'request_id' )
      assert.notEqual( result, null )
      assert.equal( result.length, 2 )
      assert.equal( result[ 0 ].equals( ObjectID( '58347be7325ba2dc36b590c9' ) ), true )
      assert.equal( result[ 1 ].equals( ObjectID( '55538f53d0e699ce51da78ae' ) ), true )

    it "should extract ObjectId when field is a function", () ->
      docs =
        [
          request_id: ObjectID( '58347be7325ba2dc36b590c9' )
        ,
          request_id: '55538f53d0e699ce51da78ae'
        ,
          request_id: ObjectID( '58347be7325ba2dc36b590c9' )
        ,
          request_id: ObjectID( '55538f53d0e699ce51da78ae' )
        ]

      result = $utils.pluckUniqObjectId( docs, ( doc ) -> doc.request_id )
      assert.notEqual( result, null )
      assert.equal( result.length, 2 )
      assert.equal( result[ 0 ].equals( ObjectID( '58347be7325ba2dc36b590c9' ) ), true )
      assert.equal( result[ 1 ].equals( ObjectID( '55538f53d0e699ce51da78ae' ) ), true )

  describe 'sanitizeHtml', () ->
    it "should remove script tags", () ->
      assert.equal( $utils.sanitizeHtml( '<p>Hello World<script>window.findObjectById = test</script></p>' ), '<p>Hello World</p>' )

  describe 'replaceDynamicValues', () ->
    it "should replace values", () ->
      dynamic_values =
        '[merchant name]': "Jim's"

      assert.equal( $utils.replaceDynamicValues( "Test - [Merchant Name]", dynamic_values ), "Test - Jim's" )

  describe 'embedTextEditorStyles', () ->
    it "should embed text editor styles in the html", () ->
      content = "<p><span class=\"ql-size-huge\">A</span><strong>Bold</strong>Description</p>"
      result =  "<p><span class=\"ql-size-huge\" style=\"font-size: 2.5em;\">A</span><strong>Bold</strong>Description</p>"

      assert.equal( $utils.embedTextEditorStyles( content ), result )

  describe 'getPluralText', () ->
    it "should return plural version of text", () ->
      content = 'review'
      result =  'reviews'

      assert.equal( $utils.getPluralText( 2, content ), result )

  describe 'generateSearchRegexes', () ->
    it "should generate the search regexes", () ->
      text = '+1 (647) 123-1234 '
      search_regexes = $utils.generateSearchRegexes( text )

      assert.equal( search_regexes.length, 2 )
      assert.equal( search_regexes[ 0 ].toString(), "/^\\+1 647 123 1234/" )
      assert.equal( search_regexes[ 1 ].toString(), "/^\\+16471231234/" )

  describe 'isTextIndexMatchingSearchRegexes', () ->
    it "should match the text index that match the search regexes", () ->
      search_regexes = [ /^\+1 647 123 1234/, /^\+16471231234/ ]
      text_index = [
        "6471231234"
        "16471231234"
        "+16471231234"
      ]

      assert.equal( $utils.isTextIndexMatchingSearchRegexes( text_index, search_regexes ), true )

    it "should not match the text index that doesn't match the search regexes", () ->
      search_regexes = [ /^\+1 647 123 1234/, /^\+16471231234/ ]
      text_index = [
        "1231231234"
        "11231231234"
        "+11231231234"
      ]

      assert.equal( $utils.isTextIndexMatchingSearchRegexes( text_index, search_regexes ), false )
