describe( "Admin Panel - Login3", () => {
    const admin_panel = Cypress.env( "admin" )
    it( "Should login to admin panel", () => {
      cy.task("test")
        .then((i)=>{
cy.log(i)
console.log(i)
        })
    } )
  } )
  