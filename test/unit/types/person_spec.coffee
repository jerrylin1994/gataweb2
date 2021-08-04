
_       = require 'underscore'
assert  = require 'assert'
async   = require 'async'
faker   = require 'faker'

utils = require '../utils'

xdescribe "Types - Person", () ->
  injector = (require '../utils.coffee').getInjector()

  Person = null

  before ( callback ) ->
    utils.resolve [ 'Person' ], ( err, results ) ->
      return callback( err ) if err
      { Person } = results

      return callback()

  describe 'generateTextIndex', () ->
    it "should index the display name", () ->
      person_mock =
        name:
          given: "Steve"
          family: "Jackson"

      person_mock.name.display = "Stevo Jackson"

      text_index = Person.generateTextIndex( person_mock )

      assert( utils.textIndexMatches( text_index, 'jackson' ), "matches 'jackson'" )
      assert( utils.textIndexMatches( text_index, 'steve jackson' ), "matches 'steve jackson'" )
      assert( utils.textIndexMatches( text_index, 'stevo jackson' ), "matches 'stevo jackson'" )

  describe 'getDisplayName', () ->
    it "should return if defined", () ->
      person_mock =
        name:
          given: faker.name.firstName()
          family: faker.name.lastName()

      assert.equal( Person.getDisplayName( person_mock ), "#{ person_mock.name.given } #{ person_mock.name.family }" )

      person_mock.name.display = faker.name.findName()
      assert.equal( Person.getDisplayName( person_mock ), person_mock.name.display )

      person_mock.name = faker.name.findName()
      assert.equal( Person.getDisplayName( person_mock ), person_mock.name )

    it "should return null otherwise", () ->
      assert.equal( Person.getDisplayName( null ), null )
      assert.equal( Person.getDisplayName( { name: {} } ), null )

  describe 'getGivenName', () ->
    it "should work when given and family are defined", () ->
      person_mock =
        name:
          given: faker.name.firstName()
          family: faker.name.lastName()

      assert.equal( Person.getGivenName( person_mock ), person_mock.name.given )

    it "should work when display is defined", () ->
      first_name = faker.name.firstName()
      last_name = faker.name.lastName()

      person_mock =
        name:
          display: "#{ first_name } #{ last_name }"

      assert.equal( Person.getGivenName( person_mock ), first_name )

    it "should work when display is only the first name", () ->
      first_name = faker.name.firstName()

      person_mock =
        name:
          display: first_name

      assert.equal( Person.getGivenName( person_mock ), first_name )

  describe 'getFamilyName', () ->
    it "should work when given and family are defined", () ->
      person_mock =
        name:
          given: faker.name.firstName()
          family: faker.name.lastName()

      assert.equal( Person.getFamilyName( person_mock ), person_mock.name.family )

    it "should work when display is defined", () ->
      first_name = faker.name.firstName()
      last_name = faker.name.lastName()

      person_mock =
        name:
          display: "#{ first_name } #{ last_name }"

      assert.equal( Person.getFamilyName( person_mock ), last_name )

    it "should be null when display is only the first name", () ->
      person_mock =
        name:
          display: faker.name.firstName()

      assert.equal( Person.getFamilyName( person_mock ), null )
