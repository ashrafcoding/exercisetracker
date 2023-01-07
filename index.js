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
  exercises: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
    },
  ],
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
  let { _id, description, duration, date } = req.body;
  if (date === "") date = new Date();
  // const newExercise = new Exercise({
  //   user: _id,
  //   description,
  //   duration,
  //   date,
  // });
  // newExercise.save((err, exercise) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     date = exercise.date.toDateString();
  //     User.findById(_id, (err, user) => {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         res.json({
  //           _id,
  //           username: user.username,
  //           description,
  //           duration,
  //           date,
  //         });
  //       }
  //     });
  //   }
  // });

  // let username = ""
  // User.findOne({_id}).then(user=>{
  //   if(user){
  //     const exercise = new Exercise({description, duration,date})
  //     username = user.username
  //     exercise.user.push(user)
  //     user.exercises.push(exercise)
  //     return Promise.all([exercise.save(), user.save()]);
  //   }
  //   else return new Promise( (resolve,reject) => reject('User not found') );
  // }).then(exercise => {
  //   res.json({_id,username,description,duration,date})
  // }).catch(err => res.json({err}))

  User.findOne({ _id }, (err, user) => {
    if (err) {
      res.json({ error: err.message });
    } else if (user) {
      const exercise = new Exercise({ description, duration, date, user: _id });
      let username = user.username;
      exercise.save((err, data) => {
        if (err) {
          res.json({ error: err.message });
        } else {
          date = data.date.toDateString();
          user.exercises.push(data._id);
          user.save((err, updatedUser) => {
            if (err) {
              res.json({ error: err.message });
            } else {
              res.json({ _id, username, description, duration, date });
            }
          });
        }
      });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  User.findOne({ _id: req.params._id })
    .populate("exercises")
    .exec((err, logs) => {
      if (err) console.log(err);
      // let exercises = {
      //   username: logs[0].user.username,
      //   count: logs.length,
      //   _id: logs[0].user._id,
      //   log: [],
      // };
      // logs.forEach((item) => {
      //   exercises.log.push({
      //     description: item.description,
      //     duration: item.duration,
      //     date: item.date.toDateString(),
      //   });
      // });
      console.log(logs);
      res.json(logs);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
