const axios = require('axios').default;

async function getIntercomUsers( page ) {
  const intercomUsers = await axios( {
    method: "get",
    url: "https://api.intercom.io/users",
    headers: {
      accept: "application/json",
      Authorization: `Bearer dG9rOjY5ZTY5NDE5XzRmYmFfNGZkMF9hMTg1XzAxNWU2YjU2ZWFjMzoxOjA=`
    },
    params: {
      per_page: 60,
      page,
      sort: "signed_up_at"
    }


})
for (const user of intercomUsers.data.users){
  if( user.name == "Cypress" ) {
        console.log("found cypress intercom user")
        axios( {
          headers: {
            accept: "application/json",
            Authorization: `Bearer dG9rOjY5ZTY5NDE5XzRmYmFfNGZkMF9hMTg1XzAxNWU2YjU2ZWFjMzoxOjA=`
          },
          method: "post",
          url: "https://api.intercom.io/user_delete_requests",
          data: {
            "intercom_user_id": user.id
          }
        } )
        console.log("success")
      }
}
}
getIntercomUsers(1)



// function deleteIntercomUser( id ) {
//   cy.request( {
//     auth: {
//       bearer: Cypress.env( "INTERCOM_TOKEN" )
//     },
//     method: "POST",
//     url: "https://api.intercom.io/user_delete_requests",
//     headers: {
//       accept: "application/json"
//     },
//     body: {
//       "intercom_user_id": id
//     }
//   } )
// }

// function deleteIntercomUsers(){
//     getIntercomUsers( 1 )
//     .then( ( response ) => {
//       console.log(response)
//       // for( const user of xhr.body.users ) {
//       //   if( user.name == "Cypress" ) {
//       //     deleteIntercomUser( user.id )
//       //   }
//       // }
//     } )
// }

// async function deleteIntercomUsers(){
// getIntercomUsers( 1 )
//   .then((response)=>{
//     for (const user of response.data.users){
//       if( user.name == "Cypress" ) {
//                   console.log("found 1")
//                 }
//     }
//   })
//   // console.log(yo)
// }
// deleteIntercomUsers()
// getIntercomUsers(1)
// .then((response)=>{
//   console.log(response)
// })
