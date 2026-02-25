const express = require('express');
const { getDailyVerses, completeOnboarding } = require('../controllers/verseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/daily', protect, getDailyVerses);
router.post('/onboarding', protect, completeOnboarding);

module.exports = router;
