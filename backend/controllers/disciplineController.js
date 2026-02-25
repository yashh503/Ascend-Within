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
      case 'add_app': {
        const { appName } = req.body;
        if (appName && !user.restrictedApps.includes(appName)) {
          user.restrictedApps.push(appName);
          user.disciplineLevel += 1;
        }
        break;
      }
      case 'keep_current':
        break;
      default:
        return res.status(400).json({ message: 'Invalid action. Use: increase_verses, add_app, or keep_current' });
    }

    await user.save();

    res.json({
      message: 'Discipline updated',
      disciplineLevel: user.disciplineLevel,
      dailyTarget: user.dailyTarget,
      restrictedApps: user.restrictedApps,
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
      restrictedAppsCount: user.restrictedApps.length,
      options: [
        {
          action: 'increase_verses',
          label: 'Increase daily verse count',
          description: user.dailyTarget < 10
            ? `Move from ${user.dailyTarget} to ${user.dailyTarget === 1 ? 5 : 10} verses per day`
            : 'You are already at maximum verse count',
          disabled: user.dailyTarget >= 10,
        },
        {
          action: 'add_app',
          label: 'Add one more restricted app',
          description: 'Strengthen your discipline by restricting another app',
        },
        {
          action: 'keep_current',
          label: 'Keep current level',
          description: 'Continue with your current discipline settings',
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { updateDiscipline, getDisciplinePrompt };
