context( "LocalReviews - Widget", () => {
  const base = require( "../../support/base" )
  const local_reviews = require( "../../support/local_reviews" )
  const dashboard = Cypress.env( "dashboard" )
  const merchant_id = dashboard.accounts.all_products.merchant_id

  function getWidgetStatsJson( merchant_id ) {
    return cy.request( {
      method: "GET",
      url: `${ dashboard.survey_sharing_link }/reviews-widget/merchants/${ merchant_id }.json`
    } )
  }

  function removeReviewFromWidget( merchant_id, review_id ) {
    cy.request( {
      method: "PUT",
      url: `${ dashboard.host }/merchants/${ merchant_id }/reviews/${ review_id }`,
      body: {
        include_widget: false
      }
    } )
  }

  it( "Should be able to preview Reviews Widget", () => {
    base.login( dashboard, "all_products" )
    local_reviews.deleteConnectedAccount( merchant_id, "yellow_pages" )
    local_reviews.deleteConnectedAccount( merchant_id, "yelp" )
    // reset widget settings
    base.getMerchantById( merchant_id )
      .then( ( response ) => {
        const widget_settings = response.body.settings.review_edge.widget
        const new_widget_settigns = base.changeObjectKeyValue( base.changeObjectKeyValue( base.changeObjectKeyValue( widget_settings, "style", "list" ), "google", true ), "facebook", true )
        local_reviews.updateLocalReviewsDashboardSettings( merchant_id, new_widget_settigns )
      } )
    cy.visit( `${ dashboard.survey_sharing_link }/reviews-widget/${ merchant_id }?preview=true` )
    cy.get( "iframe" )
      .its( "0.contentDocument.body" )
      .should( "not.be.empty" )
      .within( () => {
        cy.get( ".list-review" )
          .within( () => {
            // assertion: review info should be correct
            getWidgetStatsJson( merchant_id )
              .then( ( response ) => {
                cy.contains( response.body.review[ 0 ].description )
                  .should( "be.visible" )
                  .parents( ".list-review" )
                  .within( () => {
                    cy.log( response.body.review[ 0 ].datePublished )
                    cy.contains( Cypress.dayjs( response.body.review[ 0 ].datePublished ).format( "MMM D, YYYY" ) )
                      .should( "be.visible" )
                    cy.contains( response.body.review[ 0 ].author )
                      .should( "be.visible" )
                  } )
              } )
          } )
        cy.get( ".list-reviews__header" )
          .within( () => {
            // assertion: header stat should be correct
            base.getDashboardMerchantStats( merchant_id )
              .then( ( response ) => {
                const online_review_count = response.body.online_reviews.current_period.count
                cy.contains( `${ online_review_count } Reviews` )
              } )
          } )
      } )
  } )

  it( "Should be able to preview Summary Widget", function() {
    base.login( dashboard, "all_products" )
    local_reviews.getLocalReviewsStats( merchant_id )
      .then( ( response ) => {
        cy.wrap( response.body.reviews.facebook.count ).as( "facebook_count" )
        cy.wrap( response.body.reviews.facebook.average_rating ).as( "facebook_rating" )
        cy.wrap( response.body.reviews.google.count ).as( "google_count" )
        cy.wrap( response.body.reviews.google.average_rating ).as( "google_rating" )
      } )
    cy.visit( `${ dashboard.survey_sharing_link }/summary-widget/${ merchant_id }?preview=true` )
    cy.get( "iframe" )
      .its( "0.contentDocument.body" )
      .should( "not.be.empty" )
      .within( () => {
        cy.contains( "Facebook" )
          .parents( ".summary-widget-ratings__row" )
          .within( () => {
            // assertion: facebook reviews rating and count should be correct
            cy.get( ".summary-widget-ratings__stat-rating" )
              .should( "have.text", this.facebook_rating )
            cy.get( ".summary-widget-ratings__stat-reviews-count" )
              .should( "have.text", `${ this.facebook_count } Reviews` )
          } )
        cy.contains( "Google" )
          .parents( ".summary-widget-ratings__row" )
          .within( () => {
            // assertion: google reviews rating and count should be correct
            cy.get( ".summary-widget-ratings__stat-rating" )
              .should( "have.text", this.google_rating )
            cy.get( ".summary-widget-ratings__stat-reviews-count" )
              .should( "have.text", `${ this.google_count } Reviews` )
          } )
        cy.contains( "Average Rating" )
          .parents( ".summary-widget-ratings__row" )
          .within( () => {
            // assertion: average reviews rating and count should be correct
            cy.get( ".summary-widget-ratings__stat-rating" )
              .should( "have.text", ( ( this.google_rating * this.google_count + this.facebook_rating * this.facebook_count ) / ( this.google_count + this.facebook_count ) ).toFixed( 1 ) )
            cy.get( ".summary-widget-ratings__stat-reviews-count" )
              .should( "have.text", `${ this.google_count + this.facebook_count } Reviews` )
          } )
      } )
  } )

  it( "Should be able to edit review widget settings", () => {
    base.login( dashboard, "all_products" )
    cy.writeFile( "cypress/helpers/local_reviews/widget.json", {} )
    // reset widget settings
    base.getMerchantById( merchant_id )
      .then( ( response ) => {
        const widget_settings = response.body.settings.review_edge.widget
        const new_widget_settings = base.changeObjectKeyValue( base.changeObjectKeyValue( base.changeObjectKeyValue( base.changeObjectKeyValue( widget_settings, "style", "list" ), "header_background", "#2d0eed" ), "google", true ), "facebook", true )
        local_reviews.updateLocalReviewsDashboardSettings( merchant_id, new_widget_settings )
      } )

    cy.visit( `${ dashboard.host }/admin/settings` )
    cy.get( ".erp-page-layout-card_grid" ).within( () => {
      cy.contains( "a", "LocalReviews" )
        .click()
    } )
    cy.contains( "Website Widgets" )
      .click()
    cy.get( "md-select[ng-model=\"widget.style\"]" )
      .click()
    cy.get( "md-option[value=\"carousel\"]" )
      .click()
    cy.contains( "Save" )
      .click()
    // assertion: should be able to see success message
    cy.contains( "Changes saved." )
      .should( "be.visible" )
    cy.contains( "Design" )
      .click()
    cy.get( "input[name=\"header_background_color\"]" )
      .clear()
      .type( "#ed0ed7" )
    cy.contains( "Save" )
      .click()
    // assertion: should be able to see success message
    cy.contains( "Changes saved." )
      .should( "be.visible" )
    cy.writeFile( "cypress/helpers/local_reviews/widget.json", { settings_changed: true } )
  } )

  it( "Should be able to see edited changes on Reviews Widget", () => {
    cy.readFile( "cypress/helpers/local_reviews/widget.json" )
      .then( ( data ) => {
        assert.isTrue( data.settings_changed, "Reviews widget settings should have been changed in the dashboard" )
      } )
    cy.visit( `${ dashboard.survey_sharing_link }/reviews-widget/${ merchant_id }?preview=true` )
    getWidgetStatsJson( merchant_id )
      .then( ( response ) => {
        cy.get( "iframe" )
          .its( "0.contentDocument.body" )
          .should( "not.be.empty" )
          .within( () => {
            cy.get( ".carousel-review__inner-container" )
              .then( ( carousels ) => {
                // assertion: should be able to see carousel style widget with 3 reviews
                [ 0, 1, 2 ].forEach( ( i ) => {
                  cy.wrap( carousels[ i ] ).within( () => {
                    cy.contains( response.body.review[ i ].author )
                      .should( "be.visible" )
                    cy.contains( response.body.review[ i ].description )
                      .should( "be.visible" )
                  } )
                } )
              } )
            cy.wait( 1000 ) // help with flake of not being able to click on the slider button
            cy.get( ".carousel-reviews__slider-right-button" )
              .eq( 0 )
              .click( { force: true } )
            cy.get( ".carousel-review__inner-container" )
              .then( ( carousels ) => {
                cy.wrap( carousels[ 3 ] ).within( () => {
                  // assertion: should be able to view next page on widget
                  cy.contains( response.body.review[ 3 ].author )
                    .should( "be.visible" )
                  cy.contains( response.body.review[ 3 ].description )
                    .should( "be.visible" )
                } )
              } )
            // assertion: widget header background should have been changed
            cy.get( ".carousel-reviews__header" )
              .should( "have.attr", "style", "background-color: #ed0ed7" )
          } )
      } )
  } )

  it( "Should be able to add a review to Reviews Widget", () => {
    base.login( dashboard, "all_products" )
    removeReviewFromWidget( merchant_id, "5eff9115b55a9c41a3d452e0" )
    cy.visit( `${ dashboard.host }/admin/local-reviews/reviews?q=Great!` )

    // assertion: review to add to widget should exist
    cy.contains( "Great!" )
      .should( "be.visible" )
    cy.contains( "Add to Reviews Widget" )
      .click()

    // assertion: should see success message
    cy.contains( "You added a testimonial to your review widget!" )
      .should( "be.visible" )
    cy.writeFile( "cypress/helpers/local_reviews/widget.json", { review_added: true } )
  } )

  it( "Should be able to see added review on Reviews Widget", () => {
    cy.readFile( "cypress/helpers/local_reviews/widget.json" )
      .then( ( data ) => {
        assert.isTrue( data.review_added, "Review should have been added to the widget from dashboard" )
      } )
    base.login( dashboard, "all_products" )
    // reset widget settings and change settings so that only testonmials show up on the widget
    base.getMerchantById( merchant_id )
      .then( ( response ) => {
        const widget_settings = response.body.settings.review_edge.widget
        const new_widget_settigns = base.changeObjectKeyValue( base.changeObjectKeyValue( base.changeObjectKeyValue( widget_settings, "style", "list" ), "google", false ), "facebook", false )
        local_reviews.updateLocalReviewsDashboardSettings( merchant_id, new_widget_settigns )
      } )
    cy.visit( `${ dashboard.survey_sharing_link }/reviews-widget/${ merchant_id }?preview=true` )

    cy.get( "iframe" )
      .its( "0.contentDocument.body" )
      .should( "not.be.empty" )
      .within( () => {
        // assertion: added review should show on the widget
        cy.get( ".list-review" )
          .within( () => {
            cy.contains( "Great!" )
              .should( "be.visible" )
              .parents( ".list-review" )
              .within( () => {
                cy.contains( "Jul 3, 2020" )
                  .should( "be.visible" )
                cy.contains( "Jerry Lin" )
                  .should( "be.visible" )
              } )
          } )
      } )
  } )
} )
