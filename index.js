const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uyj2p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const automobileCollection = client
      .db("automobiles")
      .collection("vehicles");

    //Get Items
    app.get("/vehicle", async (req, res) => {
      console.log("query:", req.query);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = automobileCollection.find(query);
      let vehicles;
      if (size) {
        vehicles = await cursor.limit(size).toArray();
      } else {
        vehicles = await cursor.toArray();
      }
      res.send(vehicles);
    });
    //Find One
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const inventory = await automobileCollection.findOne(query);
      res.send(inventory);
    });

    //Post Items
    app.post("/vehicle", async (req, res) => {
      const newVehicle = req.body;
      const result = await automobileCollection.insertOne(newVehicle);
      res.send(result);
    });
    //Update
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedInventory = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updatedInventory.quantity,
        },
      };
      const result = await automobileCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
  } finally {
    //
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Auto Mart server running");
});
app.listen(port, () => {
  console.log("Listening to port: ", port);
});
