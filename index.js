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
    let user = { username: data.username, _id: data._id };
    res.json(user);
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) console.log(err);
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let { description, duration, date } = req.body;
  const _id = req.params._id;
  if (date === "") date = new Date();
  const exercise = new Exercise({
    description,
    duration,
    date,
    user: _id,
  });
  exercise.save((err, data) => {
    if (err) {
      console.log(err);
    } else {
      date = data.date.toDateString();
    }
  });
  User.findById(_id, (err, user) => {
    if (err) {
      console.log(err);
    }
    if (user) {
      let username = user.username;
      res.json({ _id, username, description, duration, date });
    } else {
      res.json({ message: "user not found" });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  Exercise.find({ user: req.params._id })
    .populate("user")
    .exec((err, logs) => {
      if (err) console.log(err);
      if(logs){
      let exercises = {
        username: logs[0].user.username,
        count: logs.length,
        _id: logs[0].user._id,
        log: logs.map((item) => {
          return {
            description: item.description,
            duration: item.duration,
            date: item.date.toDateString(),
          };
        }),
      };
      console.log(exercises);
      res.json(exercises);
    }else{res.json({message:"no logs found"})}
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
