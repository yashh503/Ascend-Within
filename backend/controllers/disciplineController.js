const User = require('../models/User');
const BookProgress = require('../models/BookProgress');
const { VALID_TARGETS } = require('../constants/books');

const updateDiscipline = async (req, res) => {
  try {
    const { action, bookId } = req.body;
    const user = req.user;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const bookProgress = await BookProgress.findOne({ userId: user._id, bookId });
    if (!bookProgress) {
      return res.status(404).json({ message: 'Book progress not found. Please set up your reading pace first.' });
    }

    switch (action) {
      case 'increase_pace': {
        const currentTarget = bookProgress.dailyTarget;
        const paceOrder = ['custom_5', 'custom_10', 'half_chapter', 'custom_15', 'custom_20', 'full_chapter'];
        const currentIndex = paceOrder.indexOf(currentTarget);
        if (currentIndex < paceOrder.length - 1) {
          bookProgress.dailyTarget = paceOrder[currentIndex + 1];
        }
        user.disciplineLevel += 1;
        break;
      }
      case 'keep_current':
        break;
      default:
        return res.status(400).json({ message: 'Invalid action. Use: increase_pace or keep_current' });
    }

    await bookProgress.save();
    await user.save();

    res.json({
      message: 'Wisdom level updated',
      disciplineLevel: user.disciplineLevel,
      dailyTarget: bookProgress.dailyTarget,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDisciplinePrompt = async (req, res) => {
  try {
    const user = req.user;
    const { bookId } = req.query;

    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const shouldPrompt = daysSinceCreation > 0 && daysSinceCreation % 7 === 0;

    let currentTarget = null;
    let canIncrease = false;

    if (bookId) {
      const bookProgress = await BookProgress.findOne({ userId: user._id, bookId });
      if (bookProgress) {
        currentTarget = bookProgress.dailyTarget;
        canIncrease = currentTarget !== 'full_chapter';
      }
    }

    res.json({
      shouldPrompt,
      currentLevel: user.disciplineLevel,
      currentTarget,
      options: [
        {
          action: 'increase_pace',
          label: 'Increase my reading pace',
          description: canIncrease
            ? 'Level up to a faster reading pace'
            : 'You\'re already at the highest pace!',
          disabled: !canIncrease,
        },
        {
          action: 'keep_current',
          label: 'Stay on my current path',
          description: 'Keep building consistency at your current pace',
        },
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateDiscipline, getDisciplinePrompt };
