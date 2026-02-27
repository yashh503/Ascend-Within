const express = require('express');
const {
  completeReading,
  submitQuiz,
  submitReflection,
  getStatus,
  getAnalytics,
  resetQuiz,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/complete-reading', protect, completeReading);
router.post('/quiz', protect, submitQuiz);
router.post('/reflection', protect, submitReflection);
router.get('/status', protect, getStatus);
router.get('/analytics', protect, getAnalytics);
router.post('/reset-quiz', protect, resetQuiz);

module.exports = router;
