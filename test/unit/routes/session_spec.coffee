assert  = require 'assert'
chai    = require('chai')
expect  = chai.expect
_       = require 'underscore'
request = (require 'supertest')('http://localhost:3001')
async   = require 'async'
sinon   = require 'sinon'

{ hash, hashPassword, generateNumber } = require '../../../server/helpers/crypto'

util = require 'util'

utils = require '../utils'

xdescribe 'Route - Session', () ->
  $db = null
  app = require '../../../server/app'
  server = null
  current_session = null
  sessions = null

  before ( callback ) ->
    async.parallel
      server: ( callback ) ->
        express = app ( err ) ->
          return callback( err ) if err

          utils.resolveWithInjector app.$injector, [ 'sessions' ], ( err, results ) ->
            return callback err if err?
            { sessions } = results
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

  describe 'POST /session', () ->
    username = 'test@test.com'
    password = 'password'
    session_id = '1'

    before () ->
      sinon.stub sessions, 'authenticate', ( auth, callback ) ->
        if auth.username != username || auth.password != password
          return callback new Error "sessions.authenticate call with wrong parameter"

        session = _.clone utils.fakeEmployeeSession
        session.id = session_id
        return callback null, session

    it "should create session with token", ( callback ) ->
      request
        .post('/session')
        .query({ token: true })
        .set('Accept', 'application/json')
        .send {
          username: username
          password: password
        }
        .expect( 201 )
        .end ( err, res ) ->
          return callback( err ) if err?

          assert.equal( sessions.authenticate.calledOnce, true )
          assert.equal( res.body.username, utils.fakeEmployeeSession.username )
          assert.equal( res.body.token, session_id )

          return callback( null )
      return

    it "should create session with cookie", ( callback ) ->
      request
        .post('/session')
        .set('Accept', 'application/json')
        .send {
          username: username
          password: password
        }
        .expect( 201 )
        .expect('set-cookie', /JSESSIONID=1/g)
        .end ( err, res ) ->
          return callback( err ) if err?

          assert.equal( sessions.authenticate.calledTwice, true )
          assert.equal( res.status, 201 )
          assert.equal( res.body.username, utils.fakeEmployeeSession.username )
          assert.equal( _.isUndefined( res.body.token ), true )

          return callback( null )
      return

    after () ->
      sessions.authenticate.restore()

  describe 'GET /session', () ->
    current_session = null

    before ( callback ) ->
      utils.initializeEmployeeSession ( err, session ) ->
        return callback err if err?
        current_session = session
        return callback null

    it "should get session", ( callback ) ->
      request
        .get('/session')
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .expect( 200, callback )
      return

    after ( callback ) ->
      utils.removeSession current_session, callback

  describe 'DELETE /session', () ->
    current_session = null

    before ( callback ) ->
      utils.initializeEmployeeSession ( err, session ) ->
        return callback err if err?
        current_session = session
        return callback null

    it "should delete session", ( callback ) ->
      request
        .del( '/session' )
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .expect( 204 )
        .expect( 'set-cookie', /JSESSIONID=;/g, callback )
      return

    it "should send 200 for unset session", ( callback ) ->
      request
        .del( '/session' )
        .set( 'Authorization', "Token #{ current_session.id }" )
        .expect( 200, callback )
      return

    after ( callback ) ->
      utils.removeSession current_session, callback
