const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = process.env.MONGODB_URI || "mongodb+srv://plateshareUser:G92YyR6tD1GVKdzR@cluster0.3o3pwj7.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("plateShareDB");
    const foodCollection = db.collection("foods");
    const foodRequestsCollection = db.collection("foodRequests");

    console.log("MongoDB Connected ✅");

    // ------------------- FOOD APIs -------------------

    // Add Food
    app.post('/add-food', async (req, res) => {
      const food = req.body;
      food.food_status = "Available"; // default status
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    // Get All Foods
    app.get('/foods', async (req, res) => {
      const foods = await foodCollection.find().toArray();
      res.send(foods);
    });

    // Get Single Food
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const food = await foodCollection.findOne({ _id: new ObjectId(id) });
      res.send(food);
    });

    // Update Food (for owner)
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // Delete Food
    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ------------------- FOOD REQUEST APIs -------------------

    // Submit a Food Request
    app.post('/food-requests', async (req, res) => {
      try {
        const request = req.body;
        request.status = "pending"; // default status
        const result = await foodRequestsCollection.insertOne(request);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to submit request" });
      }
    });

    // Get all requests for a specific food
    app.get('/food-requests/:foodId', async (req, res) => {
      try {
        const foodId = req.params.foodId;
        const requests = await foodRequestsCollection.find({ foodId }).toArray();
        res.send(requests);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch requests" });
      }
    });

    // Update a request status (accept/reject)
    app.put('/food-requests/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body; // "accepted" or "rejected"
        const result = await foodRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        // If accepted, update food status to "donated"
        if (status === "accepted") {
          const request = await foodRequestsCollection.findOne({ _id: new ObjectId(id) });
          await foodCollection.updateOne(
            { _id: new ObjectId(request.foodId) },
            { $set: { food_status: "donated" } }
          );
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update request status" });
      }
    });

    console.log("APIs Ready ✅");
  } finally {
    // Keep connection open during development
  }
}

run().catch(console.dir);

// Root
app.get('/', (req, res) => {
  res.send('🍱 PlateShare CRUD Server is Running');
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
