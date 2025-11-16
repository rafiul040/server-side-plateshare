const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


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
  

    const db = client.db("plateShareDB");
    const foodCollection = db.collection("foods");
    const foodRequestsCollection = db.collection("foodRequests");

    console.log("MongoDB Connected ✅");

    


    app.post('/add-food', async (req, res) => {
      const food = req.body;
      food.food_status = "Available"; 
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    
    app.get('/foods', async (req, res) => {
      const foods = await foodCollection.find().toArray();
      res.send(foods);
    });

  
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const food = await foodCollection.findOne({ _id: new ObjectId(id) });
      res.send(food);
    });

    
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

  
    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });




app.post('/food-requests', async (req, res) => {
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

app.get('/myFoodRequests', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).send({ message: "Email required" });

    
    const userFoods = await foodCollection.find({ donorEmail: email }).toArray();
    const userFoodIds = userFoods.map(food => food._id.toString());


    const requests = await foodRequestsCollection
      .find({ foodId: { $in: userFoodIds } })
      .toArray();

    res.send(requests);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch user's food requests" });
  }
});



app.put('/food-requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; 
    const result = await foodRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    
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
