{ expect } = require('chai')
assert = require 'assert'
_ = require 'underscore'

utils = require '../utils'

{ hash, hashPassword, generateNumber } = require '../../../server/helpers/crypto'
{ ObjectID } = require 'mongodb'

xdescribe 'Service - Users', () ->
  users = null
  $db = null

  generateUser = ( id ) ->
    phone_number = generateNumber( 10 )

    return {
      contact_points:
        email:
          type: 'email'
          value: "#{id}@mail.com"
          verified: true
        mobile:
          type: 'mobile'
          value: "+1#{ phone_number }"
          verified: true
      name:
        given: id
        family: id
      username: "#{id}@mail.com"
    }

  insertUser = ( id, callback ) ->
    if _.isArray( id )
      users_insert = _.map id, generateUser
    else
      users_insert = generateUser id

    $db.collection('users').insert users_insert, callback

  before ( callback ) ->
    utils.resolve [ '$db', 'users' ], ( err, results ) ->
      return callback( err ) if err?
      { users, $db } = results

      $db.dropDatabase ( err ) ->
        return callback( err ) if err?
        return callback( null )

  after ( callback ) ->
    $db.dropDatabase ( err ) ->
      return callback( err ) if err?
      return callback( null )

  # This is disabled because verifyPhone was updated to send an SMS
  xdescribe 'verifyPhone', () ->
    it "should verify the phone number", ( callback ) ->
      users.verifyPhone '+11234567890', ( err, result ) ->
        assert.ifError( err )

        $db.collection('phone_verifications').findOne { phone: '+11234567890' }, ( err, doc ) ->
          assert.ifError( err )
          expect( doc ).not.to.be.null

          expect( doc ).to.have.property('phone', '+11234567890')
          expect( doc ).to.have.property('code')

          return callback()

    it "should validate the phone number", ( callback ) ->
      users.verifyPhone '444', ( err, result ) ->
        assert.ifError( err )
        expect( err ).to.have.property('message', 'Phone number incorrect')
        return callback()

    it "should validate the phone number is unique", ( callback ) ->
      user =
        contact_points:
          email:
            type: 'email'
            value: 'mail@gmail.com'
            verified: false
          mobile:
            value: '+10987654321'
        name:
          given: 'A'
          family: 'B'
        username: 'mail@gmail.com'

      $db.collection('users').insert user, ( err, result ) ->
        assert.ifError( err )

        users.verifyPhone '+10987654321', ( err, result ) ->
          assert.ifError( err )
          expect( err ).to.have.property('message', 'Phone number is already in use.')

          return callback()

  describe 'patchSettings', () ->
    user_docs = null

    before ( callback ) ->
      insertUser [ '1', '2'], ( err, results ) ->
        assert.ifError( err )
        user_docs = results
        return callback()

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        assert.ifError( err )
        return callback()

    it "should update properties", ( callback ) ->
      settings =
        phone: '+11111111112'
        code: '123456'
        mail: 'mail2@mail.com'
        given_name: '11'
        family_name: '11'

      $db.collection('phone_verifications').insert { phone: settings.phone, code: settings.code }, ( err, doc ) ->
        assert.ifError( err )

        users.patchSettings user_docs[ 0 ]._id.toString(), settings, 'other', ( err, result ) ->
          assert.ifError( err )

          $db.collection('users').findOne { '_id': user_docs[ 0 ]._id }, ( err, doc ) ->
            assert.ifError( err )

            expect( doc ).not.to.be.null
            expect( doc ).to.have.deep.property('contact_points.email.value', settings.email)
            expect( doc ).to.have.deep.property('contact_points.mobile.value', settings.mobile)
            expect( doc ).to.have.deep.property('name.given', settings.given_name)
            expect( doc ).to.have.deep.property('name.family', settings.family_name)

            return callback()

    xit "should validate the phone number", ( callback ) ->
      phone = '+dsqdqs'

      settings =
        mobile: phone

      users.patchSettings user_docs[ 0 ]._id.toString(), settings, 'other', ( err, result ) ->
        expect( err ).to.not.be.null
        expect( err ).to.have.property('message', 'Property @.mobile: incorrect')
        return callback()

    xit "should not update mobile without a verification code", ( callback ) ->
      phone = '+11111111111'

      settings =
        mobile: phone

      users.patchSettings user_docs[0]._id.toString(), settings, 'other', ( err, result ) ->
        expect( err ).to.not.be.null
        expect( err ).to.have.property('message', 'Phone verification code required.')

        return callback()

    xit "should not update mobile without a valid verification code", ( callback ) ->
      phone = '+11111111111'

      $db.collection('phone_verifications').insert { phone: phone, code: '111111' }, ( err, doc ) ->
        return callback( err ) if err?

        settings =
          mobile: phone
          mobile_code: '222222'

        users.patchSettings user_docs[0]._id.toString(), settings, 'other', ( err, result ) ->
          expect( err ).to.not.be.null
          expect( err ).to.have.property('message', 'Phone verification code incorrect.')

          return callback()

    xit "should not update mobile number if it's already used by another user", ( callback ) ->
      phone = user_docs[1].contact_points.mobile.value

      $db.collection('phone_verifications').insert { phone: phone, code: '111111' }, ( err, doc ) ->
        return callback( err ) if err?

        settings =
          mobile: phone
          mobile_code: '111111'

        users.patchSettings user_docs[0]._id.toString(), settings, 'other', ( err, result ) ->
          expect( err ).to.not.be.null
          expect( err ).to.have.property('message', 'The phone you are using has an existing account')

          return callback()

    it "should not update email if it's already used by another user", ( callback ) ->
      settings =
        email: user_docs[ 1 ].contact_points.email.value

      users.patchSettings user_docs[0]._id.toString(), settings, 'other', ( err, result ) ->
        expect( err ).to.not.be.null
        expect( err ).to.have.property('message', 'The email you are using has an existing account')

        return callback()

  describe 'resetPassword', () ->
    user_doc = null

    before ( callback ) ->
      insertUser '1', ( err, results ) ->
        return callback( err ) if err?
        user_doc = results[ 0 ]

        credential =
          user:
            ref: "users"
            id: user_doc._id
          username: user_doc.username
          password: hashPassword 'test'

        $db.collection('credentials').insert credential, ( err, results ) ->
          return callback( err ) if err?
          return callback()

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should reset the password and return token", ( callback ) ->
      code = generateNumber 6
      new_password = 'test2'

      users.addUserToken _id: user_doc._id, code, ( err, token ) ->
        return callback( err ) if err?

        users.resetPassword token, code, new_password, ( err, user ) ->
          return callback( err ) if err?

          expect( user ).not.to.be.null
          expect( user ).to.have.property( 'id', user_doc._id.toString() )

          criteria =
            'user.id': user_doc._id

          $db.collection('credentials').findOne criteria, ( err, credential_doc ) ->
            return callback( err ) if err?

            expect( credential_doc ).not.to.be.null

            salt = credential_doc.password.substr 0, 32

            expect( credential_doc ).to.have.property('password', hashPassword( new_password, salt ))

            return callback(null)

  describe 'forgotPassword', () ->
    user_docs = null

    before ( callback ) ->
      insertUser ['1', '2'], ( err, results ) ->
        return callback( err ) if err?
        user_docs = results
        return callback()

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    xit "should forget password by email", ( callback ) ->
      users.forgotPasswordByEmail user_docs[ 0 ].contact_points.email.value, ( err, result ) ->
        return callback( err ) if err?

        expect( result ).to.be.equal(user_docs[ 0 ].contact_points.email.value)

        $db.collection('users').findOne _id: user_docs[ 0 ]._id, ( err, result ) ->
          return callback( err ) if err?

          expect( result.reset_tokens ).to.have.length( 1 )
          expect( result.reset_tokens[ 0 ].token ).not.to.be.null
          expect( result.reset_tokens[ 0 ].code ).to.be.undefined

          return callback()

    it "should forget password by phone", ( callback ) ->
      users.forgotPassword 'phone', user_docs[ 1 ].contact_points.mobile.value, ( err, result ) ->
        return callback( err ) if err?

        expect( result ).not.to.be.null
        expect( result ).to.have.property('token')

        $db.collection('users').findOne _id: user_docs[ 1 ]._id, ( err, result ) ->
          return callback( err ) if err?

          expect( result.reset_tokens ).to.have.length( 1 )
          expect( result.reset_tokens[ 0 ].token ).not.to.be.null
          expect( result.reset_tokens[ 0 ].code ).not.to.be.null

          return callback()

  xdescribe 'getLocations', () ->
    user_doc = null

    before ( callback ) ->
      user =
        locations: [
          _id: new ObjectID()
          address: "301 Front St W, Toronto, ON M5V 2T6, Canada",
          components: [
              long_name: "301",
              short_name: "301",
              types: [ "street_number" ]
          ,
            long_name: "Front St W",
            short_name: "Front St W",
            types: [ "route" ]
          ]
          name: "CN tower"
          note: "Test"
          geo:
            type: "Point"
            coordinates: [ -79.38705700000003, 43.642566 ]
          text: "CN tower (301 Front St W), Toronto"
        ]

      $db.collection('users').insert user, ( err, user_docs ) ->
        return callback err if err?
        user_doc = user_docs[ 0 ]
        return callback null, user_doc

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should get locations", ( callback ) ->
      users.getLocations user_doc._id.toString(), ( err, locations ) ->
        return callback( err ) if err?

        expect( locations ).to.exist
        expect( locations ).to.have.length( 1 )
        return callback()

  xdescribe 'getLocationById', () ->
    user_doc = null

    before ( callback ) ->
      user =
        locations: [
          _id: new ObjectID()
          address: "301 Front St W, Toronto, ON M5V 2T6, Canada",
          components: [
              long_name: "301",
              short_name: "301",
              types: [ "street_number" ]
          ,
            long_name: "Front St W",
            short_name: "Front St W",
            types: [ "route" ]
          ]
          name: "CN tower"
          note: "Test"
          geo:
            type: "Point"
            coordinates: [ -79.38705700000003, 43.642566 ]
          text: "CN tower (301 Front St W), Toronto"
        ]

      $db.collection('users').insert user, ( err, user_docs ) ->
        return callback err if err?
        user_doc = user_docs[ 0 ]
        return callback null, user_doc

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should get location", ( callback ) ->
      user_id = user_doc._id.toString()
      location_id = user_doc.locations[ 0 ]._id.toString()

      users.getLocationById user_id, location_id, ( err, location ) ->
        return callback( err ) if err?

        expect( location ).to.exist
        expect( location ).to.have.property('id', location_id)
        return callback()

  xdescribe 'updateLocation', () ->
    user_doc = null

    before ( callback ) ->
      user =
        locations: [
          _id: new ObjectID()
          address: "301 Front St W, Toronto, ON M5V 2T6, Canada",
          components: [
              long_name: "301",
              short_name: "301",
              types: [ "street_number" ]
          ,
            long_name: "Front St W",
            short_name: "Front St W",
            types: [ "route" ]
          ]
          name: "CN tower"
          note: "Test"
          geo:
            type: "Point"
            coordinates: [ -79.38705700000003, 43.642566 ]
          text: "CN tower (301 Front St W), Toronto"
        ]

      $db.collection('users').insert user, ( err, user_docs ) ->
        return callback err if err?
        user_doc = user_docs[ 0 ]
        return callback null, user_doc

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should update location", ( callback ) ->
      user_id = user_doc._id.toString()
      location_id = user_doc.locations[ 0 ]._id.toString()

      users.updateLocation user_id, location_id, { note: 'note_updated' }, ( err, location ) ->
        return callback( err ) if err?

        expect( location ).to.exist
        expect( location ).to.have.property('note', 'note_updated')

        return callback()

  xdescribe 'deleteLocation', () ->
    user_doc = null

    before ( callback ) ->
      user =
        locations: [
          _id: new ObjectID()
          address: "301 Front St W, Toronto, ON M5V 2T6, Canada"
        ]

      $db.collection('users').insert user, ( err, user_docs ) ->
        return callback err if err?
        user_doc = user_docs[ 0 ]
        return callback null, user_doc

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should delete location", ( callback ) ->
      user_id = user_doc._id.toString()
      location_id = user_doc.locations[ 0 ]._id.toString()

      users.deleteLocation user_id, location_id, ( err ) ->
        return callback( err ) if err?

        users.getLocations user_doc._id.toString(), ( err, locations ) ->
          return callback( err ) if err?

          expect( locations ).to.exist
          expect( locations ).to.have.length( 0 )
          return callback()

  xdescribe 'createLocation', () ->
    user_doc = null

    before ( callback ) ->
      $db.collection('users').insert {}, ( err, user_docs ) ->
        return callback err if err?
        user_doc = user_docs[ 0 ]
        return callback null, user_doc

    after ( callback ) ->
      $db.collection('users').drop ( err ) ->
        return callback( err ) if err?
        return callback()

    it "should create location", ( callback ) ->
      user_id = user_doc._id.toString()

      location =
        address: "301 Front St W, Toronto, ON M5V 2T6, Canada",
        components: [
            long_name: "301",
            short_name: "301",
            types: [ "street_number" ]
        ,
          long_name: "Front St W",
          short_name: "Front St W",
          types: [ "route" ]
        ]
        name: "CN tower"
        note: "Test"
        is_specific: true
        geo:
          type: "Point"
          coordinates: [ -79.38705700000003, 43.642566 ]

      users.createLocation user_id, location, ( err, new_location ) ->
        return callback( err ) if err?
        expect( new_location ).to.exist
        expect( _.omit( new_location, 'id', 'text', 'created_at', 'last_used_at' ) ).to.deep.equal( location )
        expect( new_location ).to.have.property( 'created_at' )
        expect( new_location ).to.have.property( 'last_used_at' )

        users.getLocations user_doc._id.toString(), ( err, locations ) ->
          return callback( err ) if err?

          expect( locations ).to.exist
          expect( locations ).to.have.length( 1 )
          expect( _.omit( locations[ 0 ], 'id', 'text', 'created_at', 'last_used_at' ) ).to.deep.equal( location )
          expect( locations[ 0 ] ).to.have.property( 'created_at' )
          expect( locations[ 0 ] ).to.have.property( 'last_used_at' )
          return callback()
