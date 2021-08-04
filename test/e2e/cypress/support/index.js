// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands'
// Alternatively you can use CommonJS syntax:
// require('./commands')

const addContext = require( "mochawesome/addContext" )

Cypress.on( "test:after:run", ( test, runnable ) => {
  if( test.state === "failed" ) {
    let screenshot = ""
    if( runnable.parent.parent.title ) {
      screenshot = `../screenshots/${ Cypress.spec.name }/${ runnable.parent.parent.title } -- ${ runnable.parent.title } -- ${ test.title } (failed).png`
    } else {
      screenshot = `../screenshots/${ Cypress.spec.name }/${ runnable.parent.title } -- ${ test.title } (failed).png`
    }
    const video = `../videos/${ Cypress.spec.name }.mp4`
    addContext( { test }, screenshot )
    addContext( { test }, video )
  }
} )

const dayjs = require( "dayjs" )
const utc = require( "dayjs/plugin/utc" )
Cypress.dayjs = dayjs.extend( utc )

const { testFilter } = require( "../helpers/test-filter" )
Cypress.testFilter = testFilter

import '@testing-library/cypress/add-commands'
