const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

const PORT = 3001;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://localhost:27017/users")
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error: ", error));

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", UserSchema);

app.post("/user/create", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error("Error while registering new user", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user/all", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error while fetching all users", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
