const User = require('../models/User');

const updateDiscipline = async (req, res) => {
  try {
    const { action } = req.body;
    const user = req.user;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    switch (action) {
      case 'increase_verses': {
        const targetMap = { 1: 5, 5: 10, 10: 10 };
        const newTarget = targetMap[user.dailyTarget] || user.dailyTarget;
        user.dailyTarget = newTarget;
        user.disciplineLevel += 1;
        break;
      }
      case 'keep_current':
        break;
      default:
        return res.status(400).json({ message: 'Invalid action. Use: increase_verses or keep_current' });
    }

    await user.save();

    res.json({
      message: 'Wisdom level updated',
      disciplineLevel: user.disciplineLevel,
      dailyTarget: user.dailyTarget,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDisciplinePrompt = async (req, res) => {
  try {
    const user = req.user;

    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const shouldPrompt = daysSinceCreation > 0 && daysSinceCreation % 7 === 0;

    res.json({
      shouldPrompt,
      currentLevel: user.disciplineLevel,
      currentTarget: user.dailyTarget,
      options: [
        {
          action: 'increase_verses',
          label: 'Read more verses daily',
          description: user.dailyTarget < 10
            ? `Level up from ${user.dailyTarget} to ${user.dailyTarget === 1 ? 5 : 10} verses per day`
            : 'You\'re already at the highest level!',
          disabled: user.dailyTarget >= 10,
        },
        {
          action: 'keep_current',
          label: 'Stay on my current path',
          description: 'Keep building consistency at your current pace',
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { updateDiscipline, getDisciplinePrompt };
