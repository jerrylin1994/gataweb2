{ expect } = require('chai')
_       = require 'underscore'
request = (require 'supertest')('http://localhost:3001')
async   = require 'async'
sinon   = require 'sinon'

util = require 'util'

utils = require '../utils'

xdescribe 'Route - Account', () ->
  app = require '../../../server/app'
  current_session = null
  server = null
  sessions = null
  users = null

  before ( callback ) ->
    async.parallel
      server: ( callback ) ->
        express = app ( err ) ->
          return callback( err ) if err

          utils.resolveWithInjector app.$injector, [ 'sessions', 'users' ], ( err, results ) ->
            return callback err if err?
            { sessions, users } = results

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

  describe 'POST /account', () ->
    fakeSession =
      username: "d@mail.com"
      user_id: "5345c4766d034cd811072398"
      employees:
        "5345956f01f0fcc209ba2afe":
          id: "5345956f01f0fcc209ba2aff"
          role:
            id: "5345956f01f0fcc209ba2b00"
            name: "Manager"
            permissions: [ "admin_drivers", "create_booking", "admin_settings" ]
      menu: [
        name: "Dashboard"
        slug: "/admin"
        icon: "dashboard"
      ,
        name: "Bookings"
        slug: "/admin/bookings"
        icon: "edit"
      ,
        name: "Drivers"
        slug: "/admin/providers"
        icon: "drivers"
        permission: 'admin_drivers'
      ,
        name: "Map"
        slug: "/admin/map"
        icon: "map-marker"
      ,
        name: "Messages"
        slug: "/admin/messages"
        icon: "envelope"
      ,
        name: "Reviews"
        slug: "/admin/reviews"
        icon: "reviews"
      ,
        name: "Analytics"
        slug: "/admin/analytics"
        icon: "bar-chart"
        permission: "admin_drivers"
      ]
      password_reset: false

    before () ->
      sinon.stub users, 'insert', ( phone, options, callback ) ->
        return callback null, {}

      sinon.stub sessions, 'insert', ( id, user_type, callback ) ->
        return callback null, fakeSession

    it "should respond", ( callback ) ->
      request
        .post('/account')
        .set('Accept', 'application/json')
        .send {
          username: '+11231231234'
          first_name: 'first_name'
          last_name: 'last_name'
          email: 'email'
          password: 'password'
          mobile: 'mobile'
          mobile_code: 'mobile_code'
        }
        .expect( 201 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.insert.calledOnce ).to.be.true
          expect( sessions.insert.calledOnce ).to.be.true

          return callback( null )
      return

    after () ->
      users.insert.restore()
      sessions.insert.restore()

  describe 'POST /account/verify_phone', () ->
    before () ->
      sinon.stub users, 'verifyPhone', ( phone, callback ) ->
        return callback null

    it "should respond", ( callback ) ->
      request
        .post( '/account/verify_phone' )
        .set( 'Accept', 'application/json' )
        .send({ phone: '+11231231234' })
        .expect( 204 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.verifyPhone.calledOnce ).to.be.true
          return callback( null )
      return

    after () ->
      users.verifyPhone.restore()

  describe 'GET /account/locations', () ->
    location =
      address: 'test'

    before () ->
      sinon.stub users, 'getLocations', ( user_id, callback ) ->
        return callback null, [ location ]

    it "should respond", ( callback ) ->
      request
        .get( '/account/locations' )
        .set( 'Accept', 'application/json' )
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .expect( 200 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.getLocations.calledOnce ).to.be.true
          return callback( null )
      return

    after () ->
      users.getLocations.restore()

  describe 'POST /account/locations', () ->
    location =
      address: 'test'

    before () ->
      sinon.stub users, 'createLocation', ( user_id, location, callback ) ->
        return callback null, location

    it "should respond", ( callback ) ->
      request
        .post('/account/locations')
        .set('Accept', 'application/json')
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .send( location )
        .expect( 200 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.createLocation.calledOnce ).to.be.true
          expect( res.body ).to.deep.equal( location )
          return callback( null )
      return

    after () ->
      users.createLocation.restore()

  describe 'PATCH /account/locations/:id', () ->
    location =
      address: 'test'

    before () ->
      sinon.stub users, 'updateLocation', ( user_id, location_id, update, callback ) ->
        return callback new Error() if location_id != '1'
        return callback null, location

    it "should respond", ( callback ) ->
      request
        .patch('/account/locations/1')
        .set('Accept', 'application/json')
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .expect( 200 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.updateLocation.calledOnce ).to.be.true
          expect( res.body ).to.deep.equal( location )
          return callback( null )
      return

    after () ->
      users.updateLocation.restore()

  describe 'DELETE /account/locations/:id', () ->
    location =
      address: 'test'

    before () ->
      sinon.stub users, 'deleteLocation', ( user_id, location_id, callback ) ->
        #return callback new Error() if location_id != '1'
        return callback null

    it "should respond", ( callback ) ->
      request
        .del('/account/locations/1')
        .set('Accept', 'application/json')
        .set( 'Cookie', "JSESSIONID=#{ current_session.id }" )
        .expect( 204 )
        .end ( err, res ) ->
          return callback( err ) if err?
          expect( users.deleteLocation.calledOnce ).to.be.true
          return callback( null )
      return

    after () ->
      users.deleteLocation.restore()
