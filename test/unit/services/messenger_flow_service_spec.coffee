
_       = require 'underscore'
assert  = require 'assert'

utils   = require '../utils'


getUpdateContext = ( action ) ->
  return {
    actions: [],
    async_tasks: [],
    customer_object_ids: [
      "5a7c3a79a60255d56c48f76c"
    ],
    employee: {
      id: "55538f8ed0e699ce51da78b2",
      name: {
        given: "Mobile",
        family: "Service"
      },
      role: {
        id: "55538f53d0e699ce51da78b0",
        name: "Manager",
        permissions: [
          "admin_settings",
          "admin_users",
          "admin_review_edge",
          "send_requests_on_behalf_of_others",
          "reply_review",
          "configure_surveys",
          "admin_referral_magic",
          "create_booking",
          "create_invoice_proposal",
          "admin_billing",
          "admin_chat",
          "messenger"
        ]
      },
      api_tokens: [
        {
          key: "Agrx6XndOROULPirsSL9luWe",
          created_at: "2017-10-02T15:11:57.438Z",
          last_active_at: null
        }
      ],
      merchant_id: "55538f53d0e699ce51da78ae"
    },
    is_gata_employee: false,
    merchant: {
      id: "55538f53d0e699ce51da78ae",
      name: "Mobile Service",
      root_id: "55538f53d0e699ce51da78ae",
      primary_category_id: "562c8d431e8d31d053a2b500",
      category: "Home Cleaning",
      categories: [
        "562c8d431e8d31d053a2b500"
      ],
      created: {
        at: "2017-06-14T11:28:17.717Z"
      },
      description: "Mobile service is blablalblaladaaaaaaa",
      email: "sebastien+610@gatalabs.com",
      members: [],
      reference_prefix: "YYB",
      region_id: null,
      review_edge_summary: {
        recommended: 141,
        did_not_recommend: 89
      },
      roles: [
        {
          id: "55538f53d0e699ce51da78b0",
          name: "Manager",
          permissions: [
            "admin_settings",
            "admin_users",
            "admin_review_edge",
            "send_requests_on_behalf_of_others",
            "reply_review",
            "configure_surveys",
            "admin_referral_magic",
            "create_booking",
            "create_invoice_proposal",
            "admin_billing",
            "admin_chat",
            "messenger"
          ]
        },
        {
          id: "55538f53d0e699ce51da78b1",
          name: "Dispatcher",
          permissions: [
            "create_booking"
          ]
        }
      ],
      settings: {
        locale: "en-CA",
        currency: "CAD",
        contact_points: [
          {
            type: "email",
            value: "sebastien@gatalabs.com",
            is_verified: true,
            verification_tokens: [
              {
                created_at: "2017-07-17T19:25:27.464Z",
                token_hash: "90370a7336999d6f7f58b42adc71f1bd194d884cbb59ac6ea7b39175db959e1d"
              },
              {
                created_at: "2017-07-15T00:01:17.327Z",
                token_hash: "ae21531da4ddfe74f880607707997fd9284c79021cd5b0908f8eed9e911bb262"
              }
            ]
          }
        ],
        platforms: {
          twilio: {
            account_id: "ACbfd025413e64afbbe9ed9de0bb65fd51",
            phone_numbers: [
              {
                _id: "5a57d491e01fa27620c7be1b",
                twilio_account_id: "ACbfd025413e64afbbe9ed9de0bb65fd51",
                twilio_id: "PNce740545c8545b3cb0015ed47dc52193",
                value: "+33756797023"
              }
            ]
          }
        },
        messenger: {
          channel_ids: [
            "5a33dde4215b501e562433cc"
          ],
          status: "live",
          enabled: true,
          limits: {
            monthly: {
              sms_out_count: null
            }
          },
          notifications: {
            email: {
              enabled: true
            },
            sms: {
              enabled: true
            }
          },
          autoresponder: {
            status: "off",
            message: "Auto response",
            periods: [
              {
                day: "monday",
                from: "09:00",
                to: "16:29"
              }
            ]
          },
          optin: {
            keywords: [
              "stort",
              "dsqdsd88",
              "hkhkh",
              "j"
            ],
            message: "Welcome to opddddd24"
          },
          optout: {
            keywords: [
              "stap",
              "dsqdsq",
              "dsq4"
            ],
            message: "Welcome to optout24"
          },
          v: 1,
          assignment: {
            assign_on_reply: false,
            enabled: true,
            unassign_closed: false
          }
        },
        calling_country_code: 33
      },
      slug: "ms",
      testing: false,
      telephone: "",
      timezone: "Europe/Paris",
      type: "mobile_service",
    },
    messenger_channel: {
      id: "5a394b62310a41fca3dcaa54",
      merchant_id: "55538f53d0e699ce51da78ae",
      type: "phone",
      platform: {
        type: "twilio",
        twilio_phone_id: "PNce740545c8545b3cb0015ed47dc52193"
      },
      phone_number: {
        value: "+33756797023",
        type: "mobile",
        international_format: "+33 7 56 79 70 23",
        national_format: "07 56 79 70 23",
        country_calling_code: 33,
        country_code: "FR",
        carrier_name: "TRANSATEL",
        mobile_country_code: "208",
        mobile_network_code: "22"
      },
      call_forwarding: {
        enable: false,
        enabled: true,
        phone_number: {
          value: "+33672312178",
          type: "mobile",
          international_format: "+33 6 72 31 21 78",
          national_format: "06 72 31 21 78",
          country_calling_code: 33,
          country_code: "FR",
          carrier_name: "FREE MOBILE",
          mobile_country_code: "208",
          mobile_network_code: "15"
        }
      },
      block_voip: false
    },
    messenger_conversation: {
      id: "5a394c34804577fcf0d64aba",
      merchant_id: "55538f53d0e699ce51da78ae",
      channel_id: "5a394b62310a41fca3dcaa54",
      channel_type: "phone",
      created: {
        at: "2017-12-19T17:28:20.630Z",
        by: {
          id: "55538f8ed0e699ce51da78b2",
          ref: "employees"
        }
      },
      customer: {
        id: "5a7c3a79a60255d56c48f76c",
        name: {
          given: "Seb New",
          family: "2"
        },
        phone_number: {
          value: "+33672312178",
          type: "mobile",
          international_format: "+33 6 72 31 21 78",
          national_format: "06 72 31 21 78",
          country_calling_code: 33,
          country_code: "FR",
          carrier_name: "FREE MOBILE",
          mobile_country_code: "208",
          mobile_network_code: "15"
        },
        email: null
      },
      status: "open",
      muted: false,
      blocked: false,
      readtime: {
        employees: {
          "55538f8ed0e699ce51da78b2": "2018-03-26T15:29:35.787Z",
          "57435cda54aeb6f0122457a0": "2018-01-04T10:30:30.122Z",
          "5aa830d1925d45ec5c8a0d53": "2018-03-20T20:05:55.220Z"
        },
        merchant: "2018-03-26T15:29:35.787Z"
      },
      log: [],
      stats: {
        merchant: {
          unread_count: 0,
          unreplied_count: 1,
          last_message_at: "2018-03-26T15:21:12.898Z"
        },
        customer: {
          unread_count: 0,
          unreplied_count: 0,
          last_message_at: "2018-03-26T15:29:34.749Z"
        },
        has_messages: true,
        autoresponder: {
          sent_at: "2018-02-12T16:10:30.856Z"
        }
      },
      sort_index: {
        last_message_at: "2018-03-26T15:29:34.749Z"
      },
      text_index: [
        "2",
        "seb new 2",
        "0672312178",
        "33672312178",
        "+33672312178"
      ],
      last_message_id: "5ab911dea0e78fc39b0d2b3a",
      notification: {
        email: {
          sent_at: "2018-03-22T19:12:50.858Z"
        }
      },
      assignee: {
        id: "55538f8ed0e699ce51da78b2",
        ref: "employees"
      },
      timestamp: 1522230312553,
      last_message: {
        id: "5ab911dea0e78fc39b0d2b3a",
        merchant_id: "55538f53d0e699ce51da78ae",
        channel_id: "5a394b62310a41fca3dcaa54",
        conversation_id: "5a394c34804577fcf0d64aba",
        type: "message_in",
        customer_ids: [
          "5a7c3a79a60255d56c48f76c"
        ],
        created: {
          at: "2018-03-26T15:29:34.749Z",
          by: {
            id: "5a7c3a79a60255d56c48f76c",
            ref: "customers"
          }
        },
        platform: {
          type: "twilio",
          message_id: "SMae009650723c5d7bb79636955a180822",
          segment_count: 1,
          status: "received"
        },
        text: "Yjkoooo"
      },
      marketing_optin: false,
      block_inbound: false,
      block_outbound: false,
      matched_customers_count: 1
    },
    messenger_conversation_doc: {
      _id: "5a394c34804577fcf0d64aba",
      merchant_id: "55538f53d0e699ce51da78ae",
      channel_id: "5a394b62310a41fca3dcaa54",
      channel_type: "phone",
      created: {
        at: "2017-12-19T17:28:20.630Z",
        by: {
          id: "55538f8ed0e699ce51da78b2",
          ref: "employees"
        }
      },
      customer: {
        _id: "5a7c3a79a60255d56c48f76c",
        name: {
          given: "Seb New",
          family: "2"
        },
        phone_number: {
          value: "+33672312178",
          type: "mobile",
          international_format: "+33 6 72 31 21 78",
          national_format: "06 72 31 21 78",
          country_calling_code: 33,
          country_code: "FR",
          carrier_name: "FREE MOBILE",
          mobile_country_code: "208",
          mobile_network_code: "15"
        }
      },
      status: "open",
      muted: false,
      blocked: false,
      readtime: {
        employees: {
          "55538f8ed0e699ce51da78b2": "2018-03-26T15:29:35.787Z",
          "57435cda54aeb6f0122457a0": "2018-01-04T10:30:30.122Z",
          "5aa830d1925d45ec5c8a0d53": "2018-03-20T20:05:55.220Z"
        },
        merchant: "2018-03-26T15:29:35.787Z"
      },
      log: [],
      stats: {
        merchant: {
          unread_count: 0,
          unreplied_count: 1,
          last_message_at: "2018-03-26T15:21:12.898Z"
        },
        customer: {
          unread_count: 0,
          unreplied_count: 0,
          last_message_at: "2018-03-26T15:29:34.749Z"
        },
        has_messages: true,
        autoresponder: {
          sent_at: "2018-02-12T16:10:30.856Z"
        }
      },
      sort_index: {
        last_message_at: "2018-03-26T15:29:34.749Z"
      },
      text_index: [
        "2",
        "seb new 2",
        "0672312178",
        "33672312178",
        "+33672312178"
      ],
      last_message_id: "5ab911dea0e78fc39b0d2b3a",
      notification: {
        email: {
          sent_at: "2018-03-22T19:12:50.858Z"
        }
      },
      unsubscribed: false,
      assignee: {
        ref: "employees",
        _id: "55538f8ed0e699ce51da78b2"
      }
    },
    messenger_conversation_update: {},
    messenger_message_docs: [],
    update_tasks: []
  }

xdescribe 'Service - Messenger Flow', () ->
  messenger_flow_service = null

  before ( callback ) ->
    utils.resolve [ 'messenger_flow_service' ], ( err, results ) ->
      return callback( err ) if err?
      service = results.messenger_flow_service
      return callback()

  describe '_applyConversationAction', () ->
    it "should close conversation", ( callback ) ->
      action =
        type: "close"

      update_context = getUpdateContext()

      messenger_flow_service._applyConversationAction update_context, "close", null, ( err ) ->
        return callback err if err?
        console.log(JSON.stringify(messenger_conversation_update))
        return callback null
