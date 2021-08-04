
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'

utils = require '../utils'

{ ObjectID } = require 'mongodb'
ObjectId = ObjectID
NumberLong = Number
ISODate = Date

xdescribe "Types - API", () ->
  injector = (require '../utils.coffee').getInjector()

  API = null

  test_customer_doc =
    _id: ObjectID( '595ce4921f14f0c02323035b' )
    merchant_id: ObjectID( '5951b453910fa3364f012b76' )
    name:
      display: "Jacob"
    unique_id: "jacob@example.com"
    mobile: "+13482391293"
    contact_points:
      [
        _id: ObjectID("595ce4921f14f0c02323035c")
        type: "phone"
        value: "+13482391293"
        text: "+13482391293"
        is_active: true
        is_verified: false
        is_opted_in: false
        log: []
      ,
        _id: ObjectID("595ce4921f14f0c02323035d")
        type: "email"
        value: "jacob@example.com"
        text: "jacob@example.com"
        is_active: true
        is_verified: false
        is_opted_in: true
        log: []
      ]
    email: "jacob@example.com",
    created:
      at: ISODate( '2017-07-05T13:07:29.000Z' )
    last_active_date: ISODate( '2017-07-05T13:07:29.000Z' )

  test_survey_request_doc =
    _id: ObjectID( '5940ee0e820a32545cf5b279' )
    merchant_id: ObjectID( '5951b453910fa3364f012b76' )
    template_id: ObjectID( '593ef2ec034124ac64e97c63' )
    customer:
      contact: 'test@example.com'
      contact_type: 'email'
      name: 'Alice'
    sender:
      _id: ObjectID('5940ed66820a32545cf5b272')
      ref: 'employees'
      name:
        given: 'QSR'
        family: 'Greeter'
    is_first: true
    skip_warnings: true
    created:
      at: ISODate('2017-06-14T08:04:30.189Z')
      by:
        _id: ObjectID('5940ed66820a32545cf5b272')
        ref: 'employees'
    reference_code: 'OPP-8ye7so7g5xkr8gz8v1y3sx7n'

  test_survey_response_doc =
    _id: ObjectID( '5952a95b969a2bd96f0fc221' )
    created:
      at: ISODate('2017-06-27T01:38:20.656Z')
    template_id: ObjectID( '5951c407910fa3364f012bce' )
    merchant_id: ObjectID( '5951b453910fa3364f012b76' )
    version: 1
    token: 'e1d48c55f12e3c0d9becbf3dcf6a27ef6df61e22435da32f225fa35274f9e99d'
    request_id: ObjectID( '5951b6f9910fa3364f012bb8' )
    customer:
      name: 'Alice'
      email: 'alice@example.com'
    sort_index:
      created_at: ISODate('2017-06-27T01:38:20.656Z')
      customer_name: 'alice'
    completed_at: ISODate('2017-06-27T01:38:27.185Z')
    answers:
      [
        component_id: ObjectID( '593584e5a564457c455db88e' )
        label: 'Would you recommend ms_a0.71.0?'
        value: true
        text: 'Yes'
      ]
    review_triage:
      type: 'online_review'
      provider:
        _id: ObjectID( '5951b6b0910fa3364f012bb5' )
        type: 'other'
        name: 'Example'
    query_index:
      is_sentiment: true
      sentiment_type: 'yes_no'
      rating: 100
      sentiment: 'positive'

  before ( callback ) ->
    utils.resolve [ 'API' ], ( err, results ) ->
      return callback( err ) if err
      { API } = results
      return callback()

  describe 'Contact', () ->
    describe 'fromCustomerDoc', () ->

      it "should handle base translation", () ->
        contact = API.Contact.fromCustomerDoc( test_customer_doc )

        assert.equal( contact.id, '595ce4921f14f0c02323035b' )
        assert.equal( contact.full_name, "Jacob" )
        assert.equal( contact.first_name, "Jacob" )
        assert.equal( contact.last_name, null )
        assert.equal( contact.unique_id, "jacob@example.com" )
        # @todo shouldn't be using created date for joined date
        assert.equal( contact.joined_date, null )
        assert.equal( contact.last_active_date, new Date( '2017-07-05T13:07:29.000Z' ) )
        assert.equal( contact.phone, '+13482391293' )
        assert.equal( contact.phone_marketing_opt_in, false )
        assert.equal( contact.email, 'jacob@example.com' )
        assert.equal( contact.email_marketing_opt_in, true )

    describe 'validate', () ->
      it "should return errors for invalid date", ( callback ) ->
        contact =
          email: 'test@example.com'
          first_name: 'Jim'
          joined_date: '2017-07-14T02:58:48.908Z'
          last_active_date: 'test'

        API.Contact.sanitize( contact )

        API.Contact.validate contact, ( err, results ) ->
          assert( err )
          assert.equal( err?.message, "Format for joined date isn't recognized" )

          return callback()

  describe 'Employee', () ->

  describe 'FeedbackRequest', () ->

  describe 'FeedbackResponse', () ->

  describe 'Survey', () ->
