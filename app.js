const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://ragualatlas:1234DOTA2023.@cluster0.cmzs1nr.mongodb.net/RAE_EC_DB?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    await client.db("RAE_EC_DB").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
