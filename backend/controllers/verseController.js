const Verse = require('../models/Verse');
const DailyProgress = require('../models/DailyProgress');
const User = require('../models/User');

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const getDailyVerses = async (req, res) => {
  try {
    const user = req.user;
    const today = getTodayString();

    if (!user.dailyTarget) {
      return res.status(400).json({ message: 'Please complete onboarding first' });
    }

    let progress = await DailyProgress.findOne({ userId: user._id, date: today }).populate('versesAssigned');

    if (progress) {
      return res.json({
        verses: progress.versesAssigned,
        progress: {
          quizScore: progress.quizScore,
          passed: progress.passed,
          reflection: progress.reflection,
          readingCompleted: progress.readingCompleted,
        },
      });
    }

    const totalVerses = await Verse.countDocuments();
    const startIndex = user.currentVerseIndex % totalVerses;

    let verses = await Verse.find().skip(startIndex).limit(user.dailyTarget);

    if (verses.length < user.dailyTarget) {
      const remaining = user.dailyTarget - verses.length;
      const moreVerses = await Verse.find().limit(remaining);
      verses = [...verses, ...moreVerses];
    }

    progress = await DailyProgress.create({
      userId: user._id,
      date: today,
      versesAssigned: verses.map((v) => v._id),
    });

    res.json({
      verses,
      progress: {
        quizScore: null,
        passed: false,
        reflection: null,
        readingCompleted: false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { wisdomPath, dailyTarget } = req.body;

    if (!wisdomPath || !dailyTarget) {
      return res.status(400).json({ message: 'Wisdom path and daily target are required' });
    }

    if (!['hinduism'].includes(wisdomPath)) {
      return res.status(400).json({ message: 'Invalid wisdom path' });
    }

    if (![1, 5, 10].includes(dailyTarget)) {
      return res.status(400).json({ message: 'Daily target must be 1, 5, or 10' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        wisdomPath,
        dailyTarget,
        onboardingComplete: true,
      },
      { new: true }
    );

    res.json({
      message: 'Welcome to your journey!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        wisdomPath: user.wisdomPath,
        dailyTarget: user.dailyTarget,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBonusVerses = async (req, res) => {
  try {
    const user = req.user;

    if (!user.dailyTarget) {
      return res.status(400).json({ message: 'Please complete onboarding first' });
    }

    const totalVerses = await Verse.countDocuments();
    const startIndex = user.currentVerseIndex % totalVerses;

    let verses = await Verse.find().skip(startIndex).limit(user.dailyTarget);

    if (verses.length < user.dailyTarget) {
      const remaining = user.dailyTarget - verses.length;
      const moreVerses = await Verse.find().limit(remaining);
      verses = [...verses, ...moreVerses];
    }

    res.json({ verses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDailyVerses, completeOnboarding, getBonusVerses };
