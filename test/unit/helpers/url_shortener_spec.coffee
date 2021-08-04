assert = require 'assert'

utils  = require '../utils'

xdescribe 'Helpers - Url Shortener', () ->

  $db = null
  $url_shortener = null

  before ( callback ) ->
    utils.resolve [ '$db', '$url_shortener' ], ( err, results ) ->
      return callback( err ) if err?
      { $db, $url_shortener } = results
      return callback( null )

      $db.dropDatabase ( err ) ->
        return callback( err ) if err?
        return callback( null )

  after ( callback ) ->
    return callback( null )
    $db.dropDatabase ( err ) ->
      return callback( err ) if err?
      return callback( null )

  describe 'createShortUrl', () ->
    url = 'https://onelocal.com'
    onelocal_short_url = null

    it "should create short url", ( callback ) ->
      $url_shortener.createShortUrl url, ( err, short_url ) ->
        assert.equal( err, null )
        assert.notEqual( short_url, null )

        onelocal_short_url = short_url
        code = $url_shortener._getCodeFromShortUrl short_url

        $db.collection( 'short_urls' ).find( { code: code } ).limit( 1 ).next ( err, short_url_doc ) ->
          assert.ifError( err )
          assert.notEqual( short_url_doc, null )
          assert.equal( short_url_doc.code, code )
          assert.equal( short_url_doc.url, url )
          return callback()

    it "should reuse existing short url", ( callback ) ->
      $url_shortener.createShortUrl url, ( err, short_url ) ->
        assert.ifError( err )
        assert.notEqual( short_url, null )
        assert.equal( short_url, onelocal_short_url )
        return callback()

  describe 'getShortUrl', () ->
    it "should retrieve short url", ( callback ) ->
      onelocal_url = 'https://onelocal.com'

      $url_shortener.createShortUrl onelocal_url, ( err, short_url ) ->
        assert.ifError( err )
        assert.notEqual( short_url, null )

        $url_shortener.getShortUrl short_url, ( err, url ) ->
          assert.ifError( err )
          assert.equal( url, onelocal_url )
          return callback()
