const new_settings = {
  "status": "live",
  "telephone": "dsadsa",
  "phone_number_id": "dsdsadasdsa",
  "providers": [
    {
      "type": "google",
      "text": "Use Google to leave us a review?",
      "place_id": "ChIJ6S8ZgMo0K4gRZ0mxD-wPS-0"
    },
    {
      "type": "facebook",
      "text": "Use Facebook to leave us a review?",
      "url": "https://google.com"
    }
  ],
  "spam_prevention_enabled": false
}

delete new_settings[ "telephone" ]
console.log( new_settings )
