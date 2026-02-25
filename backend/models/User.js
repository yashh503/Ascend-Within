const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  wisdomPath: {
    type: String,
    enum: ['hinduism'],
    default: null,
  },
  dailyTarget: {
    type: Number,
    enum: [1, 5, 10],
    default: null,
  },
  restrictedApps: {
    type: [String],
    default: [],
  },
  onboardingComplete: {
    type: Boolean,
    default: false,
  },
  streakCount: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  lastCompletedDate: {
    type: Date,
    default: null,
  },
  disciplineLevel: {
    type: Number,
    default: 1,
  },
  currentVerseIndex: {
    type: Number,
    default: 0,
  },
  totalVersesCompleted: {
    type: Number,
    default: 0,
  },
  totalBlockedMinutes: {
    type: Number,
    default: 0,
  },
  totalUnlockMinutes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
