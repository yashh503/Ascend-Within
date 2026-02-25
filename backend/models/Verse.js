const mongoose = require('mongoose');

const verseSchema = new mongoose.Schema({
  chapter: {
    type: Number,
    required: true,
  },
  verseNumber: {
    type: Number,
    required: true,
  },
  sanskrit: {
    type: String,
    required: true,
  },
  transliteration: {
    type: String,
    default: '',
  },
  wordMeanings: {
    type: String,
    default: '',
  },
  translation: {
    type: String,
    default: '',
  },
  explanation: {
    type: String,
    default: '',
  },
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
    },
  ],
});

verseSchema.index({ chapter: 1, verseNumber: 1 }, { unique: true });

module.exports = mongoose.model('Verse', verseSchema);
