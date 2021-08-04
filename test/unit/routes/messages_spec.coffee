chai    = require('chai')
expect  = chai.expect
_       = require 'underscore'
request = (require 'supertest')('http://localhost:3001')
async   = require 'async'
sinon   = require 'sinon'

{ ObjectID } = require 'mongodb'

util = require 'util'

utils = require '../utils'

xdescribe 'Route - Messages', () ->
  $db = null
  app = require '../../../server/app'
  server = null
  current_session = null
  messenger = null

  messages = [
    {
      _id: new ObjectID()
      body:
        subject: "test1"
        channel: "#provider:all"
        message: "test"
        created:
          by:
            ref: "employees"
            id: new ObjectID()
            at: new Date()
    },
    {
      _id: new ObjectID()
      body:
        subject: "test2"
        channel: "#provider:all"
        message: "test2"
        created:
          by:
            ref: "employees"
            id: new ObjectID()
            at: new Date()
    }
  ]

  before ( callback ) ->
    async.parallel
      server: ( callback ) ->
        express = app ( err ) ->
          return callback( err ) if err

          utils.resolveWithInjector app.$injector, [ 'messenger' ], ( err, results ) ->
            return callback err if err?
            { messenger } = results
            server = express.get('server')
            server.listen 3001, () ->
              return callback null

      session: ( callback ) ->
        utils.initializeEmployeeSession ( err, session ) ->
          return callback err if err?
          current_session = session
          return callback null

    , ( err, responses ) ->
      return callback err

  after () ->
    server.close()

  describe 'POST /messages', () ->
    before () ->
      sinon.stub messenger, 'send', ( sender, channel, body, options, callback ) ->
        callback null, {}

    it "should send a message", ( callback ) ->
      request
        .post( '/messages' )
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .send {
          subject: 'test'
          channel: '#provider:all'
          message: 'test'
        }
        .expect( 201 )
        .end ( err, res ) ->
          return callback( err ) if err?

          expect( messenger.send.calledOnce ).to.be.true
          expect( res.body ).not.to.be.null

          expectedResult =
            subject: 'test'
            channel: '#provider:all'
            message: 'test'

          expect( res.body ).to.deep.equal( expectedResult )

          return callback( null )
      return

  describe 'GET /messages', () ->
    before ( callback ) ->
      sinon.stub messenger, 'getMerchantMessages', ( req, merchant_id, callback ) ->
        return callback null, messages

    it "shoud get messages", ( callback ) ->
      request
        .get( '/messages' )
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .query({ employee: true })
        .expect( 200 )
        .end ( err, res ) ->
          return callback( err ) if err?

          expect( messenger.getMerchantMessages.calledOnce ).to.be.true
          expect( res.body ).not.to.be.null
          expect( res.body.length ).to.equal 2

          return callback( null )
      return
