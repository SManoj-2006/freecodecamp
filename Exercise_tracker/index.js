require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();


mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error(" MongoDB Connection Error:", err));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use( express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

const userSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true }
});

const exerciseSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, min: 1, required: true },
	date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);



app.post('/api/users', async (req, res) => {
	try {
		const { username } = req.body;
		if (!username) return res.json({ error: 'username is required' });

		let existingUser = await User.findOne({ username });
		if (existingUser) return res.json({ error: 'username already exists' });

		const newUser = await new User({ username }).save();
		res.json({ _id: newUser._id, username: newUser.username });
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.get('/api/users', async (req, res) => {
	try {
		const users = await User.find({}, '_id username');
		res.json(users);
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.post('/api/users/:_id/exercises', async (req, res) => {
	try {
		const { _id } = req.params;
		const { description, duration, date } = req.body;

		if (!description) return res.json({ error: 'description is required' });
		if (!duration) return res.json({ error: 'duration is required' });

		const user = await User.findById(_id);
		if (!user) return res.json({ error: 'user not found' });

		const exercise = new Exercise({
			userId: _id,
			description,
			duration: parseInt(duration),
			date: date ? new Date(date) : new Date()
		});

		const savedExercise = await exercise.save();

		res.json({
			_id: user._id,
			username: user.username,
			description: savedExercise.description,
			duration: savedExercise.duration,
			date: savedExercise.date.toDateString()
		});
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.get('/api/users/:_id/logs', async (req, res) => {
	try {
		const { _id } = req.params;
		const { from, to, limit } = req.query;

		const user = await User.findById(_id);
		if (!user) return res.json({ error: 'user not found' });

		let filter = { userId: _id };

		if (from || to) {
			filter.date = {};
			if (from) filter.date.$gte = new Date(from);
			if (to) filter.date.$lte = new Date(to);
		}

		let exercises = Exercise.find(filter).sort({ date: 'asc' });
		if (limit) exercises = exercises.limit(parseInt(limit));

		const logs = await exercises.exec();

		res.json({
			_id: user._id,
			username: user.username,
			count: logs.length,
			log: logs.map(e => ({
				description: e.description,
				duration: e.duration,
				date: e.date.toDateString()
			}))
		});
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.use((req, res, next) => {
	res.status(404).json({ error: 'not found' });
});

app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(` Server running on port ${PORT}`);
});
