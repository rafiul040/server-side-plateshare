const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connect
const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://plateshareUser:G92YyR6tD1GVKdzR@cluster0.3o3pwj7.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("plateShareDB");
    const foodCollection = db.collection("foods");
    const foodRequestsCollection = db.collection("foodRequests");

    console.log("MongoDB Connected ✅");

    // Add Food
    app.post("/add-food", async (req, res) => {
      const food = req.body;
      food.food_status = "Available";
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    // GET All foods (with filter for status)
    app.get("/foods", async (req, res) => {
      const status = req.query.status;

      let query = {};
      if (status) {
        query.food_status = status;
      }

      const foods = await foodCollection.find(query).toArray();
      res.send(foods);
    });

    // GET Single Food by ID
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;

      const food = await foodCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(food);
    });

    // Update Food
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await foodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send(result);
    });

    // DELETE Food
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Submit Food Request
    app.post("/food-requests", async (req, res) => {
      try {
        const request = req.body;
        request.status = "pending";

        const result = await foodRequestsCollection.insertOne(request);

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to submit request" });
      }
    });

    // Get Requests by foodId
    app.get("/food-requests/:foodId", async (req, res) => {
      const foodId = req.params.foodId;
      const requests = await foodRequestsCollection
        .find({ foodId })
        .toArray();

      res.send(requests);
    });

    // My Food Requests (donator)
    app.get("/myFoodRequests", async (req, res) => {
      const email = req.query.email;

      if (!email)
        return res.status(400).send({ message: "Email required" });

      const foods = await foodCollection
        .find({ donator_email: email })
        .toArray();

      const ids = foods.map((f) => f._id.toString());

      const requests = await foodRequestsCollection
        .find({ foodId: { $in: ids } })
        .toArray();

      res.send(requests);
    });

    console.log("APIs Ready ✅");
  } finally {}
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("🍱 PlateShare CRUD API Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
