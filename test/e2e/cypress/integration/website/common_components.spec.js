describe( "Public Website - Common Components", () => {
  const website = require( "../../support/public_website.js" )
  const get_in_touch_section = [
    {
      text: "1-855-428-2669",
      href: "tel:+18554282669"
    },
    {
      text: "info@onelocal.com",
      href: "mailto:info@onelocal.com"
    },
    {
      text: "Chat with a live agent",
      href: "#"
    }
  ]
  const products_dropdown = [
    {
      text: "OnePlan",
      href: "/one-plan"
    },
    {
      text: "LocalVisit",
      href: "/local-visits"
    },
    {
      text: "LocalReviews",
      href: "/local-reviews"
    },
    {
      text: "LocalMessages",
      href: "/local-messages"
    },
    {
      text: "LocalSite",
      href: "/local-site"
    },
    {
      text: "LocalAds",
      href: "/local-ads"
    },
    {
      text: "LocalReferrals",
      href: "/local-referrals"
    },
    {
      text: "LocalContacts",
      href: "/local-contacts"
    },
    {
      text: "LocalSEO",
      href: "/local-seo"
    },
    {
      text: "LocalResponse",
      href: "/local-response"
    },
  ]
  const resources_dropdown = [
    {
      text: "COVID-19 Resources",
      href: "https://blog.onelocal.com/category/covid-19-resources"
    },
    {
      text: "Educational Resources",
      href: "/resources"
    }
  ]
  const header_componenents = [
    {
      text: "About Us",
      href: "/about"
    },
    {
      text: "Careers",
      href: "/careers"
    },
    {
      text: "Login",
      href: "https://dashboard.onelocal.com/login"
    },
    {
      text: "Contact",
      href: "https://info.onelocal.com/get-started"
    }
  ]
  const footer_componenents = [
    {
      text: "About Us",
      href: "/about"
    },
    {
      text: "Blog",
      href: "http://blog.onelocal.com/"
    },
    {
      text: "Contact",
      href: "https://info.onelocal.com/get-started"
    },
    {
      text: "Privacy Policy",
      href: "/privacy"
    },
    {
      text: "Terms of Use",
      href: "/terms"
    },
    {
      text: "OnePlan",
      href: "/one-plan"
    },
    {
      text: "Get a Free Analysis",
      href: "https://info.onelocal.com/free-analysis"
    },
    {
      text: "Partners",
      href: "/partners"
    },
    {
      text: "Request a Demo",
      href: "https://info.onelocal.com/get-started"
    },
    {
      text: "Resources",
      href: "/resources"
    }
  ]

  beforeEach( () => {
    cy.visit( "/" )
  } )

  it( "Header nav bar should have all the correct components with correct button redirects", () => {
    cy.get( "div[class^=\"navbar__NavBarLinksContainer\"]" )
      .within( () => {
        header_componenents.forEach( ( button ) => {
          website.assertBtnHrefIsCorrect( button.text, button.href )
        } )
        cy.contains( "a", "Products" )
          .should( "be.visible" )
          .trigger( "mouseover" )
        cy.get( "div[class^=\"navbar__NavBarServicesDropdown\"]" )
          .within( () => {
            products_dropdown.forEach( ( button ) => {
              website.assertProductDropdownBtnHrefIsCorrect( button.text, button.href )
            } )
          } )
        cy.contains( "a", "Resources" )
          .should( "be.visible" )
          .trigger( "mouseover" )
        cy.get( "div[class^=\"navbar__NavBarResourceDropdown\"]" )
          .within( () => {
            resources_dropdown.forEach( ( button ) => {
              website.assertBtnHrefIsCorrect( button.text, button.href )
            } )
          } )
      } )
  } )

  it( "Footer should have all the correct components with correct button redirects", () => {
    cy.get( "div[class^=\"footer__BottomWrapper\"]" )
      .within( () => {
        footer_componenents.forEach( ( button ) => {
          website.assertBtnHrefIsCorrect( button.text, button.href )
        } )
      } )
  } )

  it( "Get in Touch section should have all the correct components", () => {
    cy.get( "div[class^=\"footer__ContactWrapper\"]" )
      .within( () => {
        get_in_touch_section.forEach( ( button ) => {
          website.assertBtnHrefIsCorrect( button.text, button.href )
        } )
      } )
    cy.contains( "Chat with a live agent" )
      .click()
    cy.get( "iframe[title=\"Intercom live chat messenger\"]" )
      .should( "be.visible" )
  } )

  it( "Should be able to see product pardot form to Request a Demo", () => {
    cy.visit( "/local-ads" )
    cy.get( "iframe" )
      .its( "0.contentDocument.body" )
      .find( "#pardot-form" )
      .within( () => {
        cy.get( ".first_name" )
          .should( "be.visible" )
        cy.get( ".phone" )
          .should( "be.visible" )
        cy.get( ".email" )
          .should( "be.visible" )
        cy.get( ".company" )
          .should( "be.visible" )
        cy.get( "input[type=\"submit\"]" )
          .should( "be.visible" )
      } )
  } )
} )
