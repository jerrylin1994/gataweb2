const base = require( "../support/base" )

function createLocalReferralsMerchantAndDashboardUser( merchant_name, user_email, dashboard_username ) {
  return base.addMerchant( merchant_name, user_email )
    .then( ( response ) => {
      const merchant_id = response.body.id
      cy.wrap( merchant_id ).as( "merchant_id" )
      enableLocalReferrals( merchant_id )
      base.loginDashboardAsOnelocalAdmin( "ac", merchant_id )
      base.createDashboardUser( merchant_id, dashboard_username )
        .then( ( response ) => {
          base.updateDashboardUserPassword( merchant_id, response.body.refs.account_ids[ 0 ] )
        } )
    } )
}

function enableLocalReferrals( merchant_id ) {
  base.getMerchantById( merchant_id )
    .then( ( response ) => {
      const current_settings = response.body.settings.referral_magic
      const new_settings = {
        "qualification": "all",
        "status": "live"
      }
      const updated_settings = Object.assign( current_settings, new_settings )
      cy.request( {
        method: "PUT",
        url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
        headers: {
          accept: "application/json"
        },
        body: {
          settings: {
            "referral_magic": updated_settings
          }
        }
      } )
    } )
}

function setLocalReferralsSMSNumber( merchant_id, phone_number_id ) {
  getMerchantReferralCampaign( merchant_id )
    .then( ( response ) => {
      const campaign_id = response.body.id
      cy.request( {
        method: "PUT",
        headers: {
          accept: "application/json"
        },
        url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/merchant_campaigns/${ campaign_id }`,
        body: {
          sms: {
            phone_number_id
          }
        }
      } )
    } )
}

function getMerchantReferralCampaign( merchant_id ) {
  return cy.request( {
    method: "GET",
    headers: {
      accept: "application/json"
    },
    url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/merchant_campaign/current`,
  } )
}

function getAdvocateInvited( merchant_id, name ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/referral_invites`,
    headers: {
      accept: "application/json"
    },
    qs: {
      q: name
    }
  } )
}

function getAdvocateRegistered( merchant_id, name ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/advocates`,
    headers: {
      accept: "application/json"
    },
    qs: {
      q: name
    }
  } )
}

function getReferrals( merchant_id, name ) {
  return cy.request( {
    method: "GET",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/referrals`,
    headers: {
      accept: "application/json"
    },
    qs: {
      q: name,
      sort_by: "updated_at",
      sort_type: "desc"
    }
  } )
}

function sendAdvocateInvite( merchant_id, name, contact ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/referral_invites`,
    body: {
      name,
      contact
    }
  } )
}

function setQualificationToFriend( merchant_id ) {
  base.getMerchantById( merchant_id )
    .then( ( response ) => {
      const current_settings = response.body.settings.referral_magic
      const new_settings = {
        qualification: "friend"
      }
      const updated_settings = Object.assign( current_settings, new_settings )
      cy.request( {
        method: "PUT",
        url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }`,
        headers: {
          accept: "application/json"
        },
        body: {
          settings: {
            referral_magic: updated_settings
          }
        }
      } )
    } )
}

function signUpAsAdvocate( name, email, merchant_slug ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).referral_sharing_link }/merchants/${ merchant_slug }/advocate`,
    headers: {
      accept: "application/json"
    },
    body: {
      name,
      email
    }
  } )
}

function signUpAsFriend( name, email, merchant_slug, referrer_token ) {
  return cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).referral_sharing_link }/merchants/${ merchant_slug }/advocate/${ referrer_token }/referral`,
    headers: {
      accept: "application/json"
    },
    body: {
      name,
      email
    }
  } )
}

function setAdvocateAndFriendReward( merchant_id, advocate_gift_name, friend_gift_name ) {
  getMerchantReferralCampaign( merchant_id )
    .then( ( response ) => {
      const campaign_id = response.body.id
      cy.request( {
        method: "PUT",
        headers: {
          accept: "application/json"
        },
        url: `${ Cypress.env( "admin" ).host }/merchants/${ merchant_id }/merchant_campaigns/${ campaign_id }`,
        body: {
          advocate_reward:
            {
              type: "order",
              value_type: "value",
              value: 100,
              name: advocate_gift_name
            },
          referred_reward:
            {
              type: "order",
              value_type: "value",
              value: 50,
              name: friend_gift_name
            }
        }
      } )
    } )
}

function confirmReferral( merchant_id, referral_id, service_date ) {
  cy.request( {
    method: "POST",
    url: `${ Cypress.env( "dashboard" ).host }/merchants/${ merchant_id }/referral_magic/referrals/${ referral_id }/confirm`,
    headers: {
      accept: "application/json"
    },
    body: {
      processing_period: 0,
      service_date
    }
  } )
}

module.exports = {
  createLocalReferralsMerchantAndDashboardUser,
  getAdvocateInvited,
  getAdvocateRegistered,
  getReferrals,
  sendAdvocateInvite,
  setQualificationToFriend,
  signUpAsAdvocate,
  signUpAsFriend,
  setAdvocateAndFriendReward,
  confirmReferral,
  enableLocalReferrals,
  setLocalReferralsSMSNumber,
}
