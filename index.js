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
      data.populate("user").then((ex) => {
        res.json({
          username: ex.user.username,
          description,
          duration: ex.duration,
          date,
          _id,
        });
      });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const {from, to, limit} = req.query;
  Exercise.find({ user: req.params._id })
    .populate("user")
    .exec((err, logs) => {
      if (err) console.log(err.message);
      if (logs) {
        let temp = logs
        if(from){
          const fromDate= new Date(from)
          temp = temp.filter(exe => new Date(exe.date) > fromDate);
        }       
        if(to){
          const toDate = new Date(to)
          temp = temp.filter(exe => new Date(exe.date) < toDate);
        }       
        if(limit){
          temp = temp.slice(0,limit);
        }
        let exercises = {
          username: temp[0].user.username,
          count: temp.length,
          _id: temp[0].user._id,
          log: temp.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              date: item.date.toDateString(),
            };
          }),
        };
        res.json(exercises);
      } else {
        res.json({ message: "no logs found" });
      }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
