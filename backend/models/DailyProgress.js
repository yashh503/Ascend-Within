const mongoose = require('mongoose');

const dailyProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  bookId: {
    type: String,
    default: null,
  },
  chapter: {
    type: Number,
    default: null,
  },
  verseRange: {
    start: { type: Number, default: null },
    end: { type: Number, default: null },
  },
  versesAssigned: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Verse',
    },
  ],
  readingCompleted: {
    type: Boolean,
    default: false,
  },
  quizScore: {
    type: Number,
    default: null,
  },
  quizTotal: {
    type: Number,
    default: null,
  },
  reflection: {
    type: String,
    default: null,
  },
  passed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

dailyProgressSchema.index({ userId: 1, date: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('DailyProgress', dailyProgressSchema);
