function testFilter( tags, runTest ) {
  if( Cypress.env( "TEST_TAGS" ) ) {
    if( tags.includes( Cypress.env( "TEST_TAGS" ) ) ) {
      runTest()
    }
  } else {
    runTest()
  }
}

module.exports = {
  testFilter,
}
