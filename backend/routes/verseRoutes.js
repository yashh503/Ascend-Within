const express = require('express');
const { completeOnboarding, getBooks, getBookChapters, setupBook, getSessionVerses } = require('../controllers/verseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/onboarding', protect, completeOnboarding);
router.get('/books', protect, getBooks);
router.get('/book/:bookId/chapters', protect, getBookChapters);
router.post('/book/:bookId/setup', protect, setupBook);
router.get('/book/:bookId/session', protect, getSessionVerses);

module.exports = router;
