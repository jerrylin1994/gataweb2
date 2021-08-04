const website = require( "../../support/public_website.js" )

describe( "Public Website - Product Pages", () => {
  const products = {
    "local-reviews": {
      name: "LocalReviews",
      tagline: "Earn reviews on key platforms faster than ever before.",
      dropdown_text: "build my reputation",
      get_started_btn_href: "/local-reviews"
    },
    "local-messages": {
      name: "LocalMessages",
      tagline: "Send the right message at the right time.",
      dropdown_text: "build customer connections",
      get_started_btn_href: "/local-messages"
    },
    "local-site": {
      name: "LocalSite",
      tagline: "Get a professional website designed to attract and convert.",
      dropdown_text: "revamp my website",
      get_started_btn_href: "/local-site"
    },
    "local-ads": {
      name: "LocalAds",
      tagline: "Maximize your results with smarter online advertising.",
      dropdown_text: "be found online",
      get_started_btn_href: "/local-ads"
    },
    "local-referrals": {
      name: "LocalReferrals",
      tagline: "Turn your customers into your biggest advocates.",
      dropdown_text: "gain more customers",
      get_started_btn_href: "/local-referrals"
    },
    "local-contacts": {
      name: "LocalContacts",
      tagline: "Build, manage and monetize your customer database.",
      dropdown_text: "keep track of my customers",
      get_started_btn_href: "/local-contacts"
    },
    "local-seo": {
      name: "LocalSEO",
      tagline: "Rank higher and win more customers.",
      dropdown_text: "improve my search ranking",
      get_started_btn_href: "/local-seo"
    },
    "local-social": {
      name: "LocalSocial",
    },
    "local-response": {
      name: "LocalResponse",
      tagline: "Greet your customers with an AI-powered agent.",
      dropdown_text: "handle my inbound leads",
      get_started_btn_href: "/local-response"
    },
    "local-visits": {
      name: "LocalVisits",
      tagline: "Keep everyone safe with virtual check-ins.",
      dropdown_text: "manage payments and waiting rooms online",
      get_started_btn_href: "/local-visits"
    },
  }

  function assertProductFeatureTitleHasCorrectText( text ) {
    cy.get( "div[class^=\"product-feature__Title\"]" )
      .should( "be.visible" )
      .and( "have.text", text )
  }

  context( "Product page test cases", () => {
    for( const [ product_key, product_data ] of Object.entries( products ) ) {
      if( product_key != "local-social" ) {
        it( `Should have correct title and Get Started Modal for ${ product_data.name }`, () => {
          cy.visit( `/${ product_key }` )
          website.assertJumbotronTitleHasCorrectText( product_data.tagline )
          assertProductFeatureTitleHasCorrectText( `${ product_data.name } Features` )
          cy.get( "button" )
            .contains( "Request a Demo" )
            .click()
          cy.contains( `Sign up for a free demo of ${ product_data.name }` )
            .should( "be.visible" )
        } )
      }
    }
  } )

  context( "Home page test cases", () => {
    beforeEach( () => {
      cy.visit( "/" )
    } )

    it( "Should have correct jumbotron title with correct Speak to A Representative button redirect", () => {
      website.assertJumbotronTitleHasCorrectText( "Full-service marketing for your local business" )
      website.assertBtnHrefIsCorrect( "Speak to a Representative", "https://info.onelocal.com/get-started" )
    } )

    it( "Should be able to cycle through product cards with correct Get Started button redirect", () => {
      for( const [ product_key, product_data ] of Object.entries( products ) ) {
        if( product_key != "local-social" ) {
          cy.get( "div[class^=\"dropdown__DropDownContainer-\"]" )
            .click()
          cy.contains( product_data.dropdown_text )
            .click()
          cy.get( ".swiper-slide-active" )
            .eq( 0 )
            .within( () => {
              website.assertBtnHrefIsCorrect( "Get Started", product_data.get_started_btn_href )
            } )
        }
      }
    } )
  } )

  context( "OnePlan page test cases", () => {
    it( "Should have correct jumbotron titles with correct Get Started button redirect", () => {
      cy.visit( "/one-plan" )
      website.assertJumbotronTitleHasCorrectText( "Get all the features you need with OnePlan." )
      website.assertBtnHrefIsCorrect( "Get Started", "https://info.onelocal.com/one-plan" )
    } )

    it( "Should be able cycle through product detail accordians", () => {
      cy.visit( "/one-plan" )
      cy.get( "div[class^=\"one-plan__AccordionWrapper\"]" ).within( () => {
        let index = 0
        for( const [ , product_data ] of Object.entries( products ) ) {
          cy.contains( product_data.name )
            .click()
          cy.get( "div[class^=\"accordion__AccordionItemContentWrapper\"]" )
            .eq( index )
            .should( "be.visible" )
            .within( () => {
              website.assertBtnHrefIsCorrect( "Request a Demo", "https://info.onelocal.com/one-plan" )
            } )
          index++
        }
      } )
    } )
  } )
} )
