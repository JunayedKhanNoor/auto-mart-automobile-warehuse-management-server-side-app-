const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("inside verify:", authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("Decoded:", decoded);
    req.decoded = decoded;
    next();
  });
}

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

    //JWT Authentication
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
    //Get Items
    app.get("/vehicle", async (req, res) => {
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
    //Page Count
    app.get("/inventoryCount", async (req, res) => {
      const count = await automobileCollection.estimatedDocumentCount();
      res.send({ count });
    });
    //get inventory by page number
    app.get("/inventoriesPage", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = automobileCollection.find(query);
      let inventory;
      if (page || size) {
        inventory = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        inventory = await cursor.toArray();
      }
      res.send(inventory);
    });

    //Post Items
    app.post("/vehicle", async (req, res) => {
      const newVehicle = req.body;
      const result = await automobileCollection.insertOne(newVehicle);
      res.send(result);
    });
    //delete
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await automobileCollection.deleteOne(query);
      res.send(result);
    });
    //Get Items by email
    app.get("/myItems", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = automobileCollection.find(query);
        const items = await cursor.toArray();
        res.send(items);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
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
