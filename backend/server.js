require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const verseRoutes = require('./routes/verseRoutes');
const progressRoutes = require('./routes/progressRoutes');
const disciplineRoutes = require('./routes/disciplineRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/verses', verseRoutes);
app.use('/progress', progressRoutes);
app.use('/discipline', disciplineRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Ascend Within API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5151;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
