const DailyProgress = require('../models/DailyProgress');
const BookProgress = require('../models/BookProgress');
const User = require('../models/User');
const { BOOKS } = require('../constants/books');

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const completeReading = async (req, res) => {
  try {
    const { bookId } = req.body;
    const today = getTodayString();

    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const progress = await DailyProgress.findOne({
      userId: req.user._id,
      date: today,
      bookId,
    });

    if (!progress) {
      return res.status(404).json({ message: 'No reading session found. Please start reading first.' });
    }

    if (progress.readingCompleted) {
      return res.json({ message: 'Reading already completed', readingCompleted: true });
    }

    progress.readingCompleted = true;
    await progress.save();

    res.json({ message: 'Great job finishing today\'s reading!', readingCompleted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { score, total, bookId } = req.body;
    const today = getTodayString();

    if (score == null || total == null || !bookId) {
      return res.status(400).json({ message: 'score, total, and bookId are required' });
    }

    const book = BOOKS[bookId];
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const progress = await DailyProgress.findOne({
      userId: req.user._id,
      date: today,
      bookId,
    });

    if (!progress) {
      return res.status(404).json({ message: 'No reading session found. Please read the verses first.' });
    }

    if (progress.passed) {
      return res.json({
        message: 'You\'ve already aced this quiz!',
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
      const bookProgress = await BookProgress.findOne({ userId: user._id, bookId });

      if (!bookProgress) {
        return res.status(404).json({ message: 'Book progress not found' });
      }

      // Calculate how many verses were in this session
      const versesInSession = progress.verseRange.end - progress.verseRange.start + 1;

      // Advance BookProgress position
      bookProgress.currentVerseInChapter += versesInSession;
      bookProgress.totalVersesRead += versesInSession;

      // Check if chapter is complete
      const chapterMeta = book.chapters[bookProgress.currentChapter];
      if (bookProgress.currentVerseInChapter >= chapterMeta.verseCount) {
        bookProgress.chaptersCompleted.push({
          chapter: bookProgress.currentChapter,
          completedAt: new Date(),
        });
        bookProgress.currentChapter += 1;
        bookProgress.currentVerseInChapter = 0;
      }

      await bookProgress.save();

      // Update user streak
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
      user.totalVersesCompleted += versesInSession;
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitReflection = async (req, res) => {
  try {
    const { reflection, bookId } = req.body;
    const today = getTodayString();

    if (!reflection || reflection.trim().length < 120) {
      return res.status(400).json({ message: 'Reflection must be at least 120 characters' });
    }

    const query = { userId: req.user._id, date: today };
    if (bookId) query.bookId = bookId;

    const progress = await DailyProgress.findOne(query);

    if (!progress) {
      return res.status(404).json({ message: 'No daily progress found for today' });
    }

    progress.reflection = reflection.trim();
    await progress.save();

    res.json({ message: 'Reflection saved', reflection: progress.reflection });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStatus = async (req, res) => {
  try {
    const today = getTodayString();
    const user = req.user;

    // Get all today's progress entries (one per book)
    const todayProgress = await DailyProgress.find({ userId: user._id, date: today });

    const sessions = todayProgress.map((p) => ({
      bookId: p.bookId,
      chapter: p.chapter,
      verseRange: p.verseRange,
      readingCompleted: p.readingCompleted,
      quizTaken: p.quizScore !== null,
      quizPassed: p.passed,
      reflectionDone: !!p.reflection,
    }));

    res.json({
      today: {
        hasProgress: todayProgress.length > 0,
        sessions,
      },
      streak: {
        current: user.streakCount,
        longest: user.longestStreak,
      },
      stats: {
        totalVersesCompleted: user.totalVersesCompleted,
        wisdomLevel: user.disciplineLevel,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const user = req.user;

    const allProgress = await DailyProgress.find({ userId: user._id });

    const totalDays = new Set(allProgress.map((p) => p.date)).size;
    const completedDays = new Set(allProgress.filter((p) => p.passed).map((p) => p.date)).size;
    const reflectionsDone = allProgress.filter((p) => p.reflection).length;

    // Get book progress
    const bookProgressList = await BookProgress.find({ userId: user._id });
    const books = bookProgressList.map((bp) => ({
      bookId: bp.bookId,
      chaptersCompleted: bp.chaptersCompleted.length,
      totalVersesRead: bp.totalVersesRead,
      currentChapter: bp.currentChapter,
    }));

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
      wisdomLevel: user.disciplineLevel,
      books,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetQuiz = async (req, res) => {
  try {
    const { bookId } = req.body;
    const today = getTodayString();

    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const progress = await DailyProgress.findOne({
      userId: req.user._id,
      date: today,
      bookId,
    });

    if (!progress) {
      return res.status(404).json({ message: 'No reading session found for today' });
    }

    if (progress.passed) {
      return res.status(400).json({ message: 'Cannot reset a passed quiz' });
    }

    progress.quizScore = null;
    progress.quizTotal = null;
    await progress.save();

    res.json({ message: 'Quiz reset. Take another look at the verses and try again.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { completeReading, submitQuiz, submitReflection, getStatus, getAnalytics, resetQuiz };
