// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Middleware
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).send('Username is required');

    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('_id username');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    const user = await User.findById(_id);
    if (!user) return res.status(404).send('User not found');

    duration = parseInt(duration);
    if (isNaN(duration)) return res.status(400).send('Invalid duration');

    let exerciseDate;
    if (date) {
      exerciseDate = new Date(date);
      if (isNaN(exerciseDate.getTime())) return res.status(400).send('Invalid date');
    } else {
      exerciseDate = new Date();
    }

    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: exerciseDate
    });
    await exercise.save();

    res.json({
      username: user.username,
      description,
      duration,
      date: exerciseDate.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) return res.status(404).send('User not found');

    let query = Exercise.find({ userId: _id });

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) query = query.where('date').gte(fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) query = query.where('date').lte(toDate);
    }

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) query = query.limit(limitNum);
    }

    const exercises = await query.exec();

    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Listen for requests
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});