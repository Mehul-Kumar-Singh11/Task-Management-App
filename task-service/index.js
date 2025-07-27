const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

const PORT = 3002;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongo:27017/tasks")
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error: ", error));

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", TaskSchema);

app.post("/task/create", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const task = new Task({ title, description, userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error("Error while creating a new task: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error while fetching all tasks: ", error);
    res.status(500).json({ error: "Interval Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Task Service is running at PORT ${PORT}`);
});
