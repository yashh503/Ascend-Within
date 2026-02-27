const mongoose = require('mongoose');

const bookProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookId: {
    type: String,
    required: true,
  },
  dailyTarget: {
    type: String,
    enum: ['half_chapter', 'full_chapter', 'custom_5', 'custom_10', 'custom_15', 'custom_20'],
    required: true,
  },
  currentChapter: {
    type: Number,
    default: 1,
  },
  currentVerseInChapter: {
    type: Number,
    default: 0,
  },
  chaptersCompleted: [{
    chapter: Number,
    completedAt: Date,
  }],
  totalVersesRead: {
    type: Number,
    default: 0,
  },
  setupComplete: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

bookProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('BookProgress', bookProgressSchema);
