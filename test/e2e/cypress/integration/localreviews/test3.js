function promiseWrapper2( object ) {
    return new Promise( ( resolve ) => {
        resolve("yooo")
        // object.on( "message", ( msg ) => {
        //     msg.on( "body", async ( stream ) => {
        //       const parsed = await simpleParser( stream )
        //       console.log( parsed.html )
        //       resolve(parsed.html)
        //     } )
        //   } )
    } )
  }

  async function hello (){
const hello2 = await promiseWrapper2("dsadsa")
console.log(hello2)
  }
  
hello()