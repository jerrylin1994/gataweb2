const str = "pwxme756i2e3ewf6@ethereal.email"
const new_str = `${ str.slice( 0, str.indexOf( "@" ) ) }+1${ str.slice( str.indexOf( "@" ) ) }`
console.log( new_str )
