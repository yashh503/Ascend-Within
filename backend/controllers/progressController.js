const DailyProgress = require('../models/DailyProgress');
const User = require('../models/User');

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
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
        message: 'Quiz already passed today',
        progress: {
          quizScore: progress.quizScore,
          quizTotal: progress.quizTotal,
          passed: progress.passed,
          unlockExpiresAt: progress.unlockExpiresAt,
        },
      });
    }

    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    progress.quizScore = score;
    progress.quizTotal = total;
    progress.passed = passed;

    if (passed) {
      const unlockMinutes = 20;
      const unlockExpiresAt = new Date(Date.now() + unlockMinutes * 60 * 1000);
      progress.unlockExpiresAt = unlockExpiresAt;

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
      user.totalUnlockMinutes += unlockMinutes;

      await user.save();
    }

    await progress.save();

    res.json({
      passed,
      score,
      total,
      percentage: Math.round(percentage),
      unlockExpiresAt: progress.unlockExpiresAt,
      message: passed
        ? 'Well done! Your apps are unlocked for 20 minutes.'
        : 'You need at least 70% to pass. Please try again.',
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

    const isUnlocked = progress && progress.unlockExpiresAt && new Date(progress.unlockExpiresAt) > new Date();

    res.json({
      today: {
        hasProgress: !!progress,
        versesRead: progress ? progress.versesAssigned.length : 0,
        quizTaken: progress ? progress.quizScore !== null : false,
        quizPassed: progress ? progress.passed : false,
        reflectionDone: progress ? !!progress.reflection : false,
        isUnlocked,
        unlockExpiresAt: progress ? progress.unlockExpiresAt : null,
      },
      streak: {
        current: user.streakCount,
        longest: user.longestStreak,
      },
      stats: {
        totalVersesCompleted: user.totalVersesCompleted,
        totalBlockedMinutes: user.totalBlockedMinutes,
        totalUnlockMinutes: user.totalUnlockMinutes,
        disciplineLevel: user.disciplineLevel,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const recordBlockedAttempt = async (req, res) => {
  try {
    const today = getTodayString();
    let progress = await DailyProgress.findOne({ userId: req.user._id, date: today });

    if (!progress) {
      progress = await DailyProgress.create({
        userId: req.user._id,
        date: today,
        versesAssigned: [],
        blockedAttempts: 1,
      });
    } else {
      progress.blockedAttempts += 1;
      await progress.save();
    }

    const user = req.user;
    user.totalBlockedMinutes += 1;
    await user.save();

    res.json({ blockedAttempts: progress.blockedAttempts });
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
    const totalBlockedAttempts = allProgress.reduce((sum, p) => sum + (p.blockedAttempts || 0), 0);
    const reflectionsDone = allProgress.filter((p) => p.reflection).length;

    res.json({
      streak: {
        current: user.streakCount,
        longest: user.longestStreak,
      },
      totalVersesCompleted: user.totalVersesCompleted,
      totalBlockedMinutes: user.totalBlockedMinutes,
      totalUnlockMinutes: user.totalUnlockMinutes,
      totalDays,
      completedDays,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      totalBlockedAttempts,
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

    res.json({ message: 'Quiz reset. Please re-read the verses and try again.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { submitQuiz, submitReflection, getStatus, recordBlockedAttempt, getAnalytics, resetQuiz };
