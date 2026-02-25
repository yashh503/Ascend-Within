const express = require('express');
const {
  submitQuiz,
  submitReflection,
  getStatus,
  recordBlockedAttempt,
  getAnalytics,
  resetQuiz,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/quiz', protect, submitQuiz);
router.post('/reflection', protect, submitReflection);
router.get('/status', protect, getStatus);
router.post('/blocked', protect, recordBlockedAttempt);
router.get('/analytics', protect, getAnalytics);
router.post('/reset-quiz', protect, resetQuiz);

module.exports = router;
