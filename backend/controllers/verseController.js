const Verse = require('../models/Verse');
const DailyProgress = require('../models/DailyProgress');
const BookProgress = require('../models/BookProgress');
const User = require('../models/User');
const { BOOKS, VALID_TARGETS, SMALL_BOOK_THRESHOLD, getBooksForWisdomPath, getSessionVerseCount } = require('../constants/books');

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const completeOnboarding = async (req, res) => {
  try {
    const { wisdomPath } = req.body;

    if (!wisdomPath) {
      return res.status(400).json({ message: 'Wisdom path is required' });
    }

    if (!['hinduism'].includes(wisdomPath)) {
      return res.status(400).json({ message: 'Invalid wisdom path' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        wisdomPath,
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
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBooks = async (req, res) => {
  try {
    const user = req.user;
    const wisdomPath = user.wisdomPath;

    if (!wisdomPath) {
      return res.status(400).json({ message: 'Please complete onboarding first' });
    }

    const books = getBooksForWisdomPath(wisdomPath);

    // Get user's progress for each book
    const bookProgressList = await BookProgress.find({ userId: user._id });
    const progressMap = {};
    bookProgressList.forEach((bp) => {
      progressMap[bp.bookId] = bp;
    });

    const result = books.map((book) => {
      const bp = progressMap[book.id];
      return {
        id: book.id,
        name: book.name,
        totalChapters: book.totalChapters,
        totalVerses: book.totalVerses,
        chaptersCompleted: bp?.chaptersCompleted?.length || 0,
        totalVersesRead: bp?.totalVersesRead || 0,
        setupComplete: bp?.setupComplete || false,
        dailyTarget: bp?.dailyTarget || null,
      };
    });

    res.json({ books: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookChapters = async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = BOOKS[bookId];

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    let bookProgress = await BookProgress.findOne({ userId: req.user._id, bookId });

    // Auto-setup small books with full_chapter pace
    if ((!bookProgress || !bookProgress.setupComplete) && book.totalVerses < SMALL_BOOK_THRESHOLD) {
      if (bookProgress) {
        bookProgress.dailyTarget = 'full_chapter';
        bookProgress.setupComplete = true;
        await bookProgress.save();
      } else {
        bookProgress = await BookProgress.create({
          userId: req.user._id,
          bookId,
          dailyTarget: 'full_chapter',
          currentChapter: 1,
          currentVerseInChapter: 0,
          setupComplete: true,
        });
      }
    }

    const completedChapters = bookProgress?.chaptersCompleted?.map((c) => c.chapter) || [];
    const currentChapter = bookProgress?.currentChapter || 1;
    const currentVerseInChapter = bookProgress?.currentVerseInChapter || 0;

    const chapters = Object.entries(book.chapters).map(([num, meta]) => {
      const chapterNum = Number(num);
      let status = 'locked';

      if (completedChapters.includes(chapterNum)) {
        status = 'completed';
      } else if (chapterNum === currentChapter && bookProgress?.setupComplete) {
        status = 'in_progress';
      } else if (chapterNum === 1 || completedChapters.includes(chapterNum - 1)) {
        status = 'unlocked';
      }

      return {
        chapter: chapterNum,
        name: meta.name,
        verseCount: meta.verseCount,
        status,
        versesRead: completedChapters.includes(chapterNum)
          ? meta.verseCount
          : chapterNum === currentChapter
            ? currentVerseInChapter
            : 0,
      };
    });

    res.json({
      book: {
        id: book.id,
        name: book.name,
        totalChapters: book.totalChapters,
        totalVerses: book.totalVerses,
      },
      chapters,
      dailyTarget: bookProgress?.dailyTarget || null,
      setupComplete: bookProgress?.setupComplete || false,
      currentChapter,
      currentVerseInChapter,
      totalVersesRead: bookProgress?.totalVersesRead || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setupBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { dailyTarget } = req.body;
    const book = BOOKS[bookId];

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!VALID_TARGETS.includes(dailyTarget)) {
      return res.status(400).json({ message: 'Invalid reading pace' });
    }

    let bookProgress = await BookProgress.findOne({ userId: req.user._id, bookId });

    if (bookProgress) {
      bookProgress.dailyTarget = dailyTarget;
      bookProgress.setupComplete = true;
      await bookProgress.save();
    } else {
      bookProgress = await BookProgress.create({
        userId: req.user._id,
        bookId,
        dailyTarget,
        currentChapter: 1,
        currentVerseInChapter: 0,
        setupComplete: true,
      });
    }

    res.json({
      message: 'Reading pace set!',
      bookProgress: {
        bookId: bookProgress.bookId,
        dailyTarget: bookProgress.dailyTarget,
        currentChapter: bookProgress.currentChapter,
        currentVerseInChapter: bookProgress.currentVerseInChapter,
        setupComplete: bookProgress.setupComplete,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSessionVerses = async (req, res) => {
  try {
    const { bookId } = req.params;
    const user = req.user;
    const today = getTodayString();
    const book = BOOKS[bookId];

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    let bookProgress = await BookProgress.findOne({ userId: user._id, bookId });

    // Auto-setup small books with full_chapter pace
    if ((!bookProgress || !bookProgress.setupComplete) && book.totalVerses < SMALL_BOOK_THRESHOLD) {
      if (bookProgress) {
        bookProgress.dailyTarget = 'full_chapter';
        bookProgress.setupComplete = true;
        await bookProgress.save();
      } else {
        bookProgress = await BookProgress.create({
          userId: user._id,
          bookId,
          dailyTarget: 'full_chapter',
          currentChapter: 1,
          currentVerseInChapter: 0,
          setupComplete: true,
        });
      }
    }

    if (!bookProgress || !bookProgress.setupComplete) {
      return res.status(400).json({ message: 'Please set up your reading pace first' });
    }

    // Check for existing session today
    let dailyProgress = await DailyProgress.findOne({
      userId: user._id,
      date: today,
      bookId,
    }).populate('versesAssigned');

    if (dailyProgress) {
      return res.json({
        verses: dailyProgress.versesAssigned,
        chapter: dailyProgress.chapter,
        chapterName: book.chapters[dailyProgress.chapter]?.name,
        verseRange: dailyProgress.verseRange,
        progress: {
          quizScore: dailyProgress.quizScore,
          passed: dailyProgress.passed,
          reflection: dailyProgress.reflection,
          readingCompleted: dailyProgress.readingCompleted,
        },
      });
    }

    // Check if book is complete
    const chapter = bookProgress.currentChapter;
    if (chapter > book.totalChapters) {
      return res.json({
        bookComplete: true,
        message: 'You have completed the entire book!',
        verses: [],
      });
    }

    const chapterMeta = book.chapters[chapter];
    const startVerse = bookProgress.currentVerseInChapter + 1;
    const sessionSize = getSessionVerseCount(
      bookProgress.dailyTarget,
      chapterMeta.verseCount,
      bookProgress.currentVerseInChapter
    );
    const endVerse = startVerse + sessionSize - 1;

    // Fetch verses sequentially
    const verses = await Verse.find({
      bookId,
      chapter: chapter,
      verseNumber: { $gte: startVerse, $lte: endVerse },
    }).sort({ verseNumber: 1 });

    // Create DailyProgress
    dailyProgress = await DailyProgress.create({
      userId: user._id,
      date: today,
      bookId,
      chapter,
      verseRange: { start: startVerse, end: endVerse },
      versesAssigned: verses.map((v) => v._id),
    });

    res.json({
      verses,
      chapter,
      chapterName: chapterMeta.name,
      verseRange: { start: startVerse, end: endVerse },
      sessionSize,
      progress: {
        quizScore: null,
        passed: false,
        reflection: null,
        readingCompleted: false,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { completeOnboarding, getBooks, getBookChapters, setupBook, getSessionVerses };
