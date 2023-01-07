require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const userSchema = new mongoose.Schema({
  username: String,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = new User({ username });
  user.save((err, data) => {
    if (err) console.log(err);
    console.log(data);
    res.json(data);
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) console.log(err);
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { _id, description, duration, date } = req.body;
  if (date === "") date = new Date();
  User.findById({_id}, (err, user) => {
    if(err){res.json({error: err.message})}
    let username = user && user.username
    Exercise.create({user:_id,description,duration,date},(err, exercise)=>{
      if(err)console.log(err);
      date = exercise.date.toDateString();
      res.json({ _id, username, description, duration, date });
    })
  })
  // try {
  //   let { _id, description, duration, date } = req.body;
  //   if (date === "") date = new Date();
  //   const user = await User.findById(_id);
  //   const exercise = await Exercise.create({
  //     user: _id,
  //     description,
  //     duration,
  //     date,
  //   });
  //   console.log(exercise);
  //   date = exercise.date.toDateString();
  //   res.json({ _id, username: user.username, description, duration, date });
  // } catch (err) {
  //   console.log(err);
  // }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const logs = await Exercise.find({ user: req.params._id })
      .populate("user")
      .limit(5);
    let exercises = {
      username: logs[0].user.username,
      count: logs.length,
      _id: logs[0].user._id,
      log: [],
    };
    logs.forEach((item) => {
      exercises.log.push({
        description: item.description,
        duration: item.duration,
        date: item.date.toDateString(),
      });
    });
    res.json(exercises);
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
