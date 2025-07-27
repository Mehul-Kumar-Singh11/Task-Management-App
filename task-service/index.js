const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

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

let channel, connection;

async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.error("RabbitMQ Connection Error: ", error);
      retries--;
      console.error("Retrying again: ", retries);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  if (retries === 0) {
    console.error("RabbitMQ connection failed after retries");
  }
}

app.post("/task/create", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const task = new Task({ title, description, userId });
    await task.save();

    const message = { taskId: task._id, userId, title };
    if (!channel) {
      return res.status(503).json({ error: "RabbitMQ not connected" });
    }
    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));

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
  connectRabbitMQWithRetry(10, 5000);
});
