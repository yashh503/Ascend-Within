const DailyProgress = require('../models/DailyProgress');
const User = require('../models/User');

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const completeReading = async (req, res) => {
  try {
    const today = getTodayString();
    const progress = await DailyProgress.findOne({ userId: req.user._id, date: today });

    if (!progress) {
      return res.status(404).json({ message: 'No daily progress found. Please start today\'s reading first.' });
    }

    if (progress.readingCompleted) {
      return res.json({ message: 'Reading already completed', readingCompleted: true });
    }

    progress.readingCompleted = true;
    await progress.save();

    res.json({ message: 'Great job finishing today\'s reading!', readingCompleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { score, total } = req.body;
    const today = getTodayString();

    if (score == null || total == null) {
      return res.status(400).json({ message: 'Score and total are required' });
    }

    const progress = await DailyProgress.findOne({ userId: req.user._id, date: today });

    if (!progress) {
      return res.status(404).json({ message: 'No daily progress found. Please read today\'s verses first.' });
    }

    if (progress.passed) {
      return res.json({
        message: 'You\'ve already aced today\'s quiz!',
        progress: {
          quizScore: progress.quizScore,
          quizTotal: progress.quizTotal,
          passed: progress.passed,
        },
      });
    }

    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    progress.quizScore = score;
    progress.quizTotal = total;
    progress.passed = passed;

    if (passed) {
      const user = req.user;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (user.lastCompletedDate && user.lastCompletedDate.toISOString().split('T')[0] === yesterdayString) {
        user.streakCount += 1;
      } else if (!user.lastCompletedDate || user.lastCompletedDate.toISOString().split('T')[0] !== today) {
        user.streakCount = 1;
      }

      if (user.streakCount > user.longestStreak) {
        user.longestStreak = user.streakCount;
      }

      user.lastCompletedDate = new Date();
      user.currentVerseIndex += user.dailyTarget;
      user.totalVersesCompleted += user.dailyTarget;

      await user.save();
    }

    await progress.save();

    res.json({
      passed,
      score,
      total,
      percentage: Math.round(percentage),
      message: passed
        ? 'Excellent work! You truly absorbed today\'s wisdom.'
        : 'Almost there! Review the verses and give it another go.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitReflection = async (req, res) => {
  try {
    const { reflection } = req.body;
    const today = getTodayString();

    if (!reflection || reflection.trim().length < 120) {
      return res.status(400).json({ message: 'Reflection must be at least 120 characters' });
    }

    const progress = await DailyProgress.findOne({ userId: req.user._id, date: today });

    if (!progress) {
      return res.status(404).json({ message: 'No daily progress found for today' });
    }

    progress.reflection = reflection.trim();
    await progress.save();

    res.json({ message: 'Reflection saved', reflection: progress.reflection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const today = getTodayString();
    const progress = await DailyProgress.findOne({ userId: req.user._id, date: today }).populate('versesAssigned');
    const user = req.user;

    res.json({
      today: {
        hasProgress: !!progress,
        readingCompleted: progress ? progress.readingCompleted : false,
        quizTaken: progress ? progress.quizScore !== null : false,
        quizPassed: progress ? progress.passed : false,
        reflectionDone: progress ? !!progress.reflection : false,
      },
      streak: {
        current: user.streakCount,
        longest: user.longestStreak,
      },
      stats: {
        totalVersesCompleted: user.totalVersesCompleted,
        disciplineLevel: user.disciplineLevel,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const user = req.user;

    const allProgress = await DailyProgress.find({ userId: user._id });

    const totalDays = allProgress.length;
    const completedDays = allProgress.filter((p) => p.passed).length;
    const reflectionsDone = allProgress.filter((p) => p.reflection).length;

    res.json({
      streak: {
        current: user.streakCount,
        longest: user.longestStreak,
      },
      totalVersesCompleted: user.totalVersesCompleted,
      totalDays,
      completedDays,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      reflectionsDone,
      disciplineLevel: user.disciplineLevel,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetQuiz = async (req, res) => {
  try {
    const today = getTodayString();
    const progress = await DailyProgress.findOne({ userId: req.user._id, date: today });

    if (!progress) {
      return res.status(404).json({ message: 'No daily progress found for today' });
    }

    if (progress.passed) {
      return res.status(400).json({ message: 'Cannot reset a passed quiz' });
    }

    progress.quizScore = null;
    progress.quizTotal = null;
    await progress.save();

    res.json({ message: 'Quiz reset. Take another look at the verses and try again.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { completeReading, submitQuiz, submitReflection, getStatus, getAnalytics, resetQuiz };
