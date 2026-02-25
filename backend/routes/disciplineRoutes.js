const express = require('express');
const { updateDiscipline, getDisciplinePrompt } = require('../controllers/disciplineController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/update', protect, updateDiscipline);
router.get('/prompt', protect, getDisciplinePrompt);

module.exports = router;
