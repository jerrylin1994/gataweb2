chai    = require('chai')
expect  = chai.expect
_       = require 'underscore'
request = (require 'supertest')('http://localhost:3001')


utils = require '../utils'

xdescribe 'Route - Index', () ->
  app = require '../../../server/app'
  server = null

  before ( callback ) ->
    express = app ( err ) ->
      return callback( err ) if err
      server = express.get('server')
      server.listen 3001, () ->
        return callback null

  after () ->
    server.close()

  describe 'GET /status', () ->
    it 'should respond', ( callback ) ->
      request
      .get('/status')
      .expect( 200 )
      .end ( err, res ) ->
        return callback( err ) if err?
        expect( res.text ).to.equal( 'OK' )
        return callback( null )
