
_       = require 'underscore'
async   = require 'async'
path    = require 'path'

{ hash, generateSessionId, generateToken } = require '../../server_js/helpers/crypto'

utils = do require '../../server_js/helpers/utils'

utils = Object.assign {}, utils,
  fakeEmployeeSession:
    username: "test@mail.com"
    user_id: "5342f83cc685e5061eb86949"
    employees:
      "5345956f01f0fcc209ba2afe":
        id: "5345956f01f0fcc209ba2aff"
        role:
          id: "5345956f01f0fcc209ba2b00"
          name: "Manager"
          permissions:
            [
              "admin_drivers"
              "create_booking"
              "admin_settings"
            ]

    providers: {}
    menu:
      [
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
        icon: "map-marker"
      ,
        name: "Messages"
        slug: "/admin/messages"
        icon: "envelope"
      ]
    password_reset: false

  fakeProviderSession:
    username: "driver1@driver.com"
    user_id: "53a58ac3535103cf04039576"
    employees: {}
    providers:
      "53a58a63535103cf04039571":
        id: '53a58ac3535103cf04039575'
    password_reset: false

  # @method getInjector
  # @description Return a new instance of the injector to isolate tests
  getInjector: () ->
    injector = do require '../../server_js/helpers/injector'
    injector.register '$injector', injector

    injector.register 'app', {}

    app_dir = path.resolve( __dirname, '../..' )

    # @refactor to helper
    $config = require '../../server_js/config'

    injector.register '$config', $config

    # Load all the helpers to the injector
    for name, helper of require '../../server_js/helpers'
      injector.factory name, helper

    # Load all the types to the injector
    for name, type of require '../../server_js/types'
      injector.factory name, type

    # Load all the services to the injector
    for name, service of require '../../server_js/services'
      injector.factory name, service

    for name, dependency of require '../../server_js/merchants/core/services'
      injector.factory name, dependency

    for name, service of require '../../server_js/merchants/core/types'
      injector.factory name, service

    # 'merchants_module' to not overide 'merchants' service
    injector.factory 'merchants_module', require '../../server_js/merchants'

    return injector

  # @method clearInjector
  clearInjector: ( injector, callback ) ->
    async.each(
      [ $injector, injector ],
      ( injector, callback ) ->
        utils.resolve [ '$db' ], ( err, results ) ->
          return callback( err ) if err
          { $db } = results
          return $db.close( callback )
      callback
    )

  # @method resolve
  resolve: ( dependencies, callback ) ->
    utils.resolveWithInjector( $injector, dependencies, callback )

  # @method resolveWithInjector
  resolveWithInjector: ( injector, dependencies, callback ) ->

    resolveFunction = ( args... ) ->
      _.object( dependencies, args )

    resolveFunction.$inject = dependencies

    (injector.invoke resolveFunction) callback

  # @method initializeEmployeeSession
  initializeEmployeeSession: ( callback )->
    session = _.clone utils.fakeEmployeeSession
    utils.initializeSession session, callback

  # @method initializeProviderSession
  initializeProviderSession: ( callback )->
    session = _.clone utils.fakeProviderSession
    utils.initializeSession session, callback

  # @method initializeSession
  initializeSession: ( session, callback )->

    utils.resolve [ '$cache' ], ( err, result ) ->
      return callback err if err?

      session_id = generateSessionId()
      session_hash = hash session_id

      result.$cache.multi()
        # Create the session
        .setnx( "sessions:#{ session_hash }", JSON.stringify( session ) )
        # Add the session to the active sessions for the user
        .zadd( "users:#{ session.user_id }:sessions", new Date().getTime(), session_hash )
        .exec ( err, replies ) ->
          return callback err if err?

          # Set the session id after saving
          # NOT SAVE THE SESSION_ID IN REDIS FOR SECURITY REASON (SESSION HIJACKING WITH READ-ONLY ACCESS TO REDIS)
          session.id = session_id

          return callback null, session

  # @method removeSession
  removeSession: ( session, callback ) ->
    utils.resolve [ '$cache' ], ( err, result ) ->
      return callback err if err?

      session_hash = hash session.id

      result.$cache.multi()
        # Create the session
        .del( "sessions:#{ session_hash }" )
        # Add the session to the active sessions for the user
        .zrem( "users:#{ session.user_id }:sessions", session_hash )
        .exec ( err, replies ) ->
          return callback err

  # @method textIndexMatches
  # @description Mimick the MongoDB wildcard search for validation purposes
  textIndexMatches: ( text_index, search_text ) ->
    search_regex = new RegExp( '^' + _.filter( search_text.toLowerCase().split(/[ ()-,]+/), ( item ) -> return ! _.isEmpty( item ) ).join(' ').replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" ) )

    for text in text_index when search_regex.test text
      return true

    return false

$injector = utils.getInjector()

module.exports = utils
