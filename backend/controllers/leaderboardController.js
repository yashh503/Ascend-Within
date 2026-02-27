const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const type = req.query.type || 'streak';
    const currentUserId = req.user._id;

    let sortField;
    let labelField;

    switch (type) {
      case 'streak':
        sortField = 'streakCount';
        labelField = 'Current Streak';
        break;
      case 'longest_streak':
        sortField = 'longestStreak';
        labelField = 'Longest Streak';
        break;
      case 'verses':
        sortField = 'totalVersesCompleted';
        labelField = 'Verses Completed';
        break;
      case 'level':
        sortField = 'disciplineLevel';
        labelField = 'Discipline Level';
        break;
      default:
        sortField = 'streakCount';
        labelField = 'Current Streak';
    }

    const users = await User.find({ onboardingComplete: true })
      .select('name streakCount longestStreak totalVersesCompleted disciplineLevel')
      .sort({ [sortField]: -1, createdAt: 1 })
      .limit(50);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      value: user[sortField],
      isCurrentUser: user._id.toString() === currentUserId.toString(),
    }));

    const currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser);

    let currentUserRank = null;
    if (!currentUserEntry) {
      const totalAbove = await User.countDocuments({
        onboardingComplete: true,
        [sortField]: { $gt: req.user[sortField] },
      });
      currentUserRank = {
        rank: totalAbove + 1,
        userId: currentUserId,
        name: req.user.name,
        value: req.user[sortField],
        isCurrentUser: true,
      };
    }

    res.json({
      type,
      label: labelField,
      leaderboard,
      currentUserRank: currentUserEntry || currentUserRank,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLeaderboard };
