function assertBtnHrefIsCorrect( text, href ) {
  cy.contains( "a", text )
    .should( "be.visible" )
    .invoke( "attr", "href" )
    .should( "equal", href )
}

function assertProductDropdownBtnHrefIsCorrect( text, href ) {
  cy.contains( "a", text )
    .parent()
    .should( "be.visible" )
  cy.contains( "a", text )
    .invoke( "attr", "href" )
    .should( "equal", href )
}

function assertJumbotronTitleHasCorrectText( text ) {
  cy.get( "h1[class^=\"jumbotron__JumbotronTitle\"]" )
    .should( "be.visible" )
    .and( "have.text", text )
}

module.exports = {
  assertBtnHrefIsCorrect,
  assertProductDropdownBtnHrefIsCorrect,
  assertJumbotronTitleHasCorrectText,
}
