const { ObjectID, MongoClient } = require( "mongodb" )
const url = ""

function disconnectKrispKleanFbReviewsAcct() {
  browser.call( async () => {
    const client = await MongoClient.connect( url )
    const db = client.db( browser.config.db.name )
    const collection = db.collection( "merchants" )
    const o_id = new ObjectID( "5b733e31ae72cf1dc3bc2404" )
    collection.updateMany(
      { "settings.review_edge.connected_accounts._id": o_id },
      { $pull: { "settings.review_edge.connected_accounts": { "_id": o_id, "type": "facebook" } } }
    )
    client.close()
  } )
}

module.exports = {
  disconnectKrispKleanFbReviewsAcct,
}
