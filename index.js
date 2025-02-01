const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const { MongoClient, ObjectId } = require("mongodb")
const dotenv=require("dotenv")
dotenv.config()
const secretkey = process.env.SECRET_KEY
const url = process.env.DB;
mongoose.connect(url).then(() => {
  console.log("Database connected successfully.");
  app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
  });
});
const userSchema = new mongoose.Schema({
  firstname: String,
  lastsname: String,
  email: String,
  password: String,
  list: [],
  Completed:[]
})
const Users = mongoose.model("user datas", userSchema);
const app = express()
app.use(cors({
  origin: 'https://todo-crud-full-stack.netlify.app'
}))
app.use(express.json())
//jwt
let authenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ message: "unauthorized user" })
  }
  else {
    jwt.verify(req.headers.authorization, secretkey, (error, data) => {
      if (error) {
        res.status(401).json({ message: "unauthorized" })
      }
      req.userid = data.id
      next();
    })
  }
}
//Get user
app.get("/userdata", authenticate, async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db().collection("user datas");
    const result = await collection.findOne({ _id: new ObjectId(`${req.userid}`) });
    res.json(result)
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    await client.close();
  }
})
// Add a user
app.post("/adduser", async (req, res) => {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(req.body.password, salt)
  req.body.password = hash;
  let data = new Users(req.body);
  const result = await data.save();
  res.send(result);
})
//User Login
app.post("/user-login", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db().collection("user datas");
    const user = await collection.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" })
    }

    const passwordcorrect = await bcrypt.compare(req.body.password, user.password)
    if (!passwordcorrect) {
      return res.status(401).json({ message: "Invalid credentials " })
    }
    const token = jwt.sign({ id: user._id }, secretkey)
    res.json({ message: token })
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
})
//Add to list
app.post("/addtolist", authenticate, async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db().collection("user datas");
    const id = new ObjectId(`${req.userid}`)
    const updatecart = await collection.findOneAndUpdate({ _id: id }, { $push: { list: (req.body) } })

    if (updatecart) {
      res.json(updatecart);
    }
    else {
      res.status(500).json({ message: "not updated" })
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
})
app.post("/removefromlist", authenticate, async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db().collection("user datas");
    const id = new ObjectId(`${req.userid}`)
    const updatecart = await collection.findOneAndUpdate({ _id: id }, { $set: { list: (req.body) } })
    if (updatecart) {
      res.json(updatecart);
    }
    else {
      res.status(500).json({ message: "not updated" })
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    await client.close();
  }
})
//Add to completed

app.post("/movetocomplete", authenticate, async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db().collection("user datas");
    const id = new ObjectId(`${req.userid}`)
    const completed = await collection.findOneAndUpdate({ _id: id }, { $push: { Completed: (req.body) } })

    if (completed) {
      res.json(completed);
    }
    else {
      res.status(500).json({ message: "not updated" })
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
})
