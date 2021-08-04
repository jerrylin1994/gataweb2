const website = require( "../../support/public_website.js" )

describe( "Public Website - Other Pages", () => {
  const about_us_page_buttons = [
    {
      text: "Get Started",
      href: "https://info.onelocal.com/get-started"
    },
    {
      text: "Apply Now",
      href: "/careers"
    }
  ]

  const terms_privacy_page_buttons = [
    {
      text: "Terms of Use",
      href: "/terms"
    },
    {
      text: "Privacy Policy",
      href: "/privacy"
    }
  ]

  const partners_page_button = {
    text: "Get Started",
    href: "https://info.onelocal.com/get-started"
  }

  context( "About us page test cases", () => {
    it( "Should have correct jumbotron title with correct button redirect", () => {
      cy.visit( "/about" )
      website.assertJumbotronTitleHasCorrectText( "You take care of your business. We’ll take care of the rest." )
      about_us_page_buttons.forEach( ( button ) => {
        website.assertBtnHrefIsCorrect( button.text, button.href )
      } )
    } )
  } )

  context( "Privacy page test cases", () => {
    it( "Should have correct page title with correct button redirect", () => {
      cy.visit( "/privacy" )
      cy.contains( "Terms of Use & Privacy Policy" )
        .should( "be.visible" )
      cy.visit( "/terms" )
      terms_privacy_page_buttons.forEach( ( button ) => {
        website.assertBtnHrefIsCorrect( button.text, button.href )
      } )
    } )
  } )

  context( "Careers page test cases", () => {
    it( "Should have correct jumbotron title with correct button redirect", () => {
      cy.visit( "/careers" )
      website.assertJumbotronTitleHasCorrectText( "Ready for a change?" )
      cy.get( "div[class^=\"jumbotron__JumbotronContainer\"]" )
        .within( () => {
          cy.contains( "a", "Apply Now" )
            .should( "be.visible" )
            .click()
            .invoke( "attr", "href" )
            .should( "equal", "#jobs" )
        } )
      cy.get( "#jobs" )
        .should( "be.visible" )
      cy.get( "div[class^=\"careers__CultureSection\"]" )
        .within( () => {
          cy.contains( "a", "Apply Now" )
            .should( "be.visible" )
            .click()
            .invoke( "attr", "href" )
            .should( "equal", "#jobs" )
        } )
      cy.get( "#jobs" )
        .should( "be.visible" )
    } )
  } )

  context( "Resource page test cases", () => {
    it( "Should have correct page title with correct button redirect", () => {
      cy.visit( "/resources" )
      cy.get( "div[class^=\"resources__IntroText\"]" )
        .should( "be.visible" )
        .should( "have.text", "Looking for a suite of marketing tools to help you grow your business? You’ve come to the right place." )
    } )
  } )

  context( "Partners page test cases", () => {
    it( "Should have correct jumbotron title with correct button redirect", () => {
      cy.visit( "/partners" )
      website.assertJumbotronTitleHasCorrectText( "Partner up with OneLocal and grow your business." )
      website.assertBtnHrefIsCorrect( partners_page_button.text, partners_page_button.href )
    } )
  } )
} )
