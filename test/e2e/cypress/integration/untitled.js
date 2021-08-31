
function hello(bork, bork2){
    if (bork == 1){
        if( bork2 == 1 ) { // condition is if tests running locally
          console.log("11")
        }else if (bork2 == 2){
            console.log("22")
        }
      } else {
        if( process.env.CIRCLE_NODE_INDEX == "0" || "null" ) {
          config.env.TWILIO_NUMBER = "14377476331"
        }else if (process.env.CIRCLE_NODE_INDEX == "1"){
          config.env.TWILIO_NUMBER = "14377476234"
        }
      }
}


hello (1, 1)