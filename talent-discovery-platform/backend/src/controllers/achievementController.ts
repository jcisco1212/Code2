import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Achievement, UserAchievement, User, Video, Follow } from '../models';
import { logger } from '../utils/logger';

// Default achievements to seed
export const DEFAULT_ACHIEVEMENTS = [
  // Upload achievements
  { name: 'First Steps', description: 'Upload your first video', icon: 'rocket', category: 'uploads', rarity: 'common', requirement: 1, requirementType: 'video_uploads', xpReward: 10 },
  { name: 'Content Creator', description: 'Upload 5 videos', icon: 'film', category: 'uploads', rarity: 'uncommon', requirement: 5, requirementType: 'video_uploads', xpReward: 25 },
  { name: 'Prolific Creator', description: 'Upload 25 videos', icon: 'video-camera', category: 'uploads', rarity: 'rare', requirement: 25, requirementType: 'video_uploads', xpReward: 100 },
  { name: 'Video Machine', description: 'Upload 100 videos', icon: 'trophy', category: 'uploads', rarity: 'epic', requirement: 100, requirementType: 'video_uploads', xpReward: 500 },

  // Views achievements
  { name: 'Getting Noticed', description: 'Reach 100 total views', icon: 'eye', category: 'views', rarity: 'common', requirement: 100, requirementType: 'total_views', xpReward: 15 },
  { name: 'Rising Star', description: 'Reach 1,000 total views', icon: 'star', category: 'views', rarity: 'uncommon', requirement: 1000, requirementType: 'total_views', xpReward: 50 },
  { name: 'Viral Sensation', description: 'Reach 10,000 total views', icon: 'fire', category: 'views', rarity: 'rare', requirement: 10000, requirementType: 'total_views', xpReward: 200 },
  { name: 'Superstar', description: 'Reach 100,000 total views', icon: 'sparkles', category: 'views', rarity: 'epic', requirement: 100000, requirementType: 'total_views', xpReward: 1000 },
  { name: 'Legend', description: 'Reach 1,000,000 total views', icon: 'crown', category: 'views', rarity: 'legendary', requirement: 1000000, requirementType: 'total_views', xpReward: 5000 },

  // Engagement achievements
  { name: 'Heart Collector', description: 'Receive 50 likes', icon: 'heart', category: 'engagement', rarity: 'common', requirement: 50, requirementType: 'total_likes', xpReward: 15 },
  { name: 'Crowd Favorite', description: 'Receive 500 likes', icon: 'heart', category: 'engagement', rarity: 'uncommon', requirement: 500, requirementType: 'total_likes', xpReward: 75 },
  { name: 'Fan Favorite', description: 'Receive 5,000 likes', icon: 'heart', category: 'engagement', rarity: 'rare', requirement: 5000, requirementType: 'total_likes', xpReward: 300 },
  { name: 'Beloved', description: 'Receive 50,000 likes', icon: 'heart', category: 'engagement', rarity: 'epic', requirement: 50000, requirementType: 'total_likes', xpReward: 1500 },

  // Social achievements
  { name: 'Making Friends', description: 'Gain 10 followers', icon: 'users', category: 'social', rarity: 'common', requirement: 10, requirementType: 'followers', xpReward: 20 },
  { name: 'Building Community', description: 'Gain 100 followers', icon: 'user-group', category: 'social', rarity: 'uncommon', requirement: 100, requirementType: 'followers', xpReward: 100 },
  { name: 'Influencer', description: 'Gain 1,000 followers', icon: 'megaphone', category: 'social', rarity: 'rare', requirement: 1000, requirementType: 'followers', xpReward: 500 },
  { name: 'Celebrity', description: 'Gain 10,000 followers', icon: 'star', category: 'social', rarity: 'epic', requirement: 10000, requirementType: 'followers', xpReward: 2000 },

  // Special achievements
  { name: 'Challenge Champion', description: 'Win a challenge', icon: 'trophy', category: 'special', rarity: 'rare', requirement: 1, requirementType: 'challenge_wins', xpReward: 250 },
  { name: 'Agent Contact', description: 'Get contacted by an agent', icon: 'briefcase', category: 'special', rarity: 'epic', requirement: 1, requirementType: 'agent_contacts', xpReward: 500 },
  { name: 'Verified', description: 'Get verified on the platform', icon: 'check-badge', category: 'special', rarity: 'legendary', requirement: 1, requirementType: 'verified', xpReward: 1000 },
];

// Get all achievements
export const getAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = category;

    const achievements = await Achievement.findAll({
      where,
      order: [['category', 'ASC'], ['requirement', 'ASC']]
    });

    res.json({ achievements });
  } catch (error) {
    next(error);
  }
};

// Get user's achievements
export const getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const userAchievements = await UserAchievement.findAll({
      where: { userId },
      include: [
        { model: Achievement, as: 'achievement' }
      ],
      order: [['earnedAt', 'DESC']]
    });

    // Get all achievements for comparison
    const allAchievements = await Achievement.findAll({
      where: { isActive: true }
    });

    // Calculate stats
    const earned = userAchievements.filter(ua => ua.earnedAt);
    const totalXP = earned.reduce((sum, ua) => {
      const achievement = ua.get('achievement') as Achievement;
      return sum + (achievement?.xpReward || 0);
    }, 0);

    res.json({
      achievements: userAchievements,
      stats: {
        earned: earned.length,
        total: allAchievements.length,
        totalXP,
        progress: Math.round((earned.length / allAchievements.length) * 100)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's achievements
export const getMyAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    const userAchievements = await UserAchievement.findAll({
      where: { userId: user.id },
      include: [
        { model: Achievement, as: 'achievement' }
      ],
      order: [['earnedAt', 'DESC']]
    });

    // Get all achievements
    const allAchievements = await Achievement.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['requirement', 'ASC']]
    });

    // Map achievements with user progress
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId === achievement.id
      );
      return {
        ...achievement.toJSON(),
        earned: userAchievement?.earnedAt ? true : false,
        earnedAt: userAchievement?.earnedAt || null,
        progress: userAchievement?.progress || 0,
        isDisplayed: userAchievement?.isDisplayed || false
      };
    });

    // Calculate stats
    const earned = achievementsWithProgress.filter(a => a.earned);
    const totalXP = earned.reduce((sum, a) => sum + a.xpReward, 0);

    res.json({
      achievements: achievementsWithProgress,
      stats: {
        earned: earned.length,
        total: allAchievements.length,
        totalXP,
        progress: Math.round((earned.length / allAchievements.length) * 100)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Check and update achievements for a user
export const checkAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const newlyEarned: Achievement[] = [];

    // Get user stats
    const user = await User.findByPk(userId);
    if (!user) return newlyEarned;

    // Get video count
    const videoCount = await Video.count({ where: { userId } });

    // Get total views
    const viewsResult = await Video.sum('viewsCount', { where: { userId } });
    const totalViews = viewsResult || 0;

    // Get total likes
    const likesResult = await Video.sum('likesCount', { where: { userId } });
    const totalLikes = likesResult || 0;

    // Get follower count
    const followerCount = await Follow.count({ where: { followingId: userId } });

    // Check each achievement
    const achievements = await Achievement.findAll({ where: { isActive: true } });

    for (const achievement of achievements) {
      // Check if already earned
      let userAchievement = await UserAchievement.findOne({
        where: { userId, achievementId: achievement.id }
      });

      let currentProgress = 0;
      let meetsRequirement = false;

      switch (achievement.requirementType) {
        case 'video_uploads':
          currentProgress = videoCount;
          meetsRequirement = videoCount >= achievement.requirement;
          break;
        case 'total_views':
          currentProgress = totalViews;
          meetsRequirement = totalViews >= achievement.requirement;
          break;
        case 'total_likes':
          currentProgress = totalLikes;
          meetsRequirement = totalLikes >= achievement.requirement;
          break;
        case 'followers':
          currentProgress = followerCount;
          meetsRequirement = followerCount >= achievement.requirement;
          break;
        case 'verified':
          meetsRequirement = user.isVerified;
          currentProgress = user.isVerified ? 1 : 0;
          break;
        default:
          currentProgress = 0;
      }

      if (!userAchievement) {
        userAchievement = await UserAchievement.create({
          userId,
          achievementId: achievement.id,
          progress: currentProgress,
          earnedAt: meetsRequirement ? new Date() : undefined
        });

        if (meetsRequirement) {
          newlyEarned.push(achievement);
        }
      } else if (!userAchievement.earnedAt && meetsRequirement) {
        userAchievement.earnedAt = new Date();
        userAchievement.progress = currentProgress;
        await userAchievement.save();
        newlyEarned.push(achievement);
      } else if (userAchievement.progress !== currentProgress) {
        userAchievement.progress = currentProgress;
        await userAchievement.save();
      }
    }

    if (newlyEarned.length > 0) {
      logger.info(`User ${userId} earned ${newlyEarned.length} new achievements`);
    }

    return newlyEarned;
  } catch (error) {
    logger.error('Error checking achievements:', error);
    return [];
  }
};

// Toggle achievement display
export const toggleAchievementDisplay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { achievementId } = req.params;
    const { isDisplayed } = req.body;

    const userAchievement = await UserAchievement.findOne({
      where: { userId: user.id, achievementId }
    });

    if (!userAchievement || !userAchievement.earnedAt) {
      res.status(404).json({ error: { message: 'Achievement not found or not earned' } });
      return;
    }

    userAchievement.isDisplayed = isDisplayed;
    await userAchievement.save();

    res.json({ userAchievement });
  } catch (error) {
    next(error);
  }
};

// Seed default achievements (admin only)
export const seedAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ error: { message: 'Admin access required' } });
      return;
    }

    let created = 0;
    for (const achievementData of DEFAULT_ACHIEVEMENTS) {
      const [achievement, wasCreated] = await Achievement.findOrCreate({
        where: { name: achievementData.name },
        defaults: achievementData as any
      });
      if (wasCreated) created++;
    }

    res.json({ message: `Seeded ${created} new achievements`, total: DEFAULT_ACHIEVEMENTS.length });
  } catch (error) {
    next(error);
  }
};

// Get displayed achievements for profile
export const getDisplayedAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const displayedAchievements = await UserAchievement.findAll({
      where: {
        userId,
        isDisplayed: true,
        earnedAt: { [Op.ne]: null }
      },
      include: [
        { model: Achievement, as: 'achievement' }
      ],
      limit: 6
    });

    res.json({ achievements: displayedAchievements });
  } catch (error) {
    next(error);
  }
};
