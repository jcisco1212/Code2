import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Challenge, ChallengeStatus, ChallengeEntry, ChallengeVote, User, Video, Category, UserRole } from '../models';
import { logger } from '../utils/logger';

// Get all challenges with filters
export const getChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, categoryId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const { rows: challenges, count } = await Challenge.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['startDate', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      challenges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get active challenges
export const getActiveChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const challenges = await Challenge.findAll({
      where: {
        status: ChallengeStatus.ACTIVE,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['endDate', 'ASC']]
    });

    res.json({ challenges });
  } catch (error) {
    next(error);
  }
};

// Get featured challenges
export const getFeaturedChallenges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const challenges = await Challenge.findAll({
      where: {
        status: { [Op.in]: [ChallengeStatus.ACTIVE, ChallengeStatus.VOTING] },
        startDate: { [Op.lte]: now }
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['entriesCount', 'DESC']],
      limit: 6
    });

    res.json({ challenges });
  } catch (error) {
    next(error);
  }
};

// Get single challenge
export const getChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'winner', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] }
      ]
    });

    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    res.json({ challenge });
  } catch (error) {
    next(error);
  }
};

// Get challenge entries
export const getChallengeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sort = 'votes' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const order: any = sort === 'votes' ? [['votesCount', 'DESC']] : [['submittedAt', 'DESC']];

    const { rows: entries, count } = await ChallengeEntry.findAndCountAll({
      where: { challengeId: id, status: { [Op.ne]: 'rejected' } },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'viewsCount']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order,
      limit: Number(limit),
      offset
    });

    res.json({
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get challenge leaderboard
export const getChallengeLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const entries = await ChallengeEntry.findAll({
      where: { challengeId: id, status: { [Op.ne]: 'rejected' } },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order: [['votesCount', 'DESC']],
      limit: Number(limit)
    });

    res.json({ leaderboard: entries });
  } catch (error) {
    next(error);
  }
};

// Create challenge (admin only)
export const createChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Check admin permission
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: { message: 'Only admins can create challenges' } });
      return;
    }

    const {
      title, description, rules, hashtag, categoryId, prize, prizeAmount,
      startDate, endDate, votingEndDate, minDuration, maxDuration, maxEntries, coverImageUrl
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      res.status(400).json({ error: { message: 'End date must be after start date' } });
      return;
    }

    // Check if hashtag is unique
    const existingHashtag = await Challenge.findOne({ where: { hashtag } });
    if (existingHashtag) {
      res.status(400).json({ error: { message: 'Hashtag already in use' } });
      return;
    }

    const challenge = await Challenge.create({
      title,
      description,
      rules,
      hashtag: hashtag.replace(/^#/, ''), // Remove leading # if present
      categoryId: categoryId || null,
      prize,
      prizeAmount,
      coverImageUrl,
      startDate: start,
      endDate: end,
      votingEndDate: votingEndDate ? new Date(votingEndDate) : null,
      minDuration,
      maxDuration,
      maxEntries,
      createdBy: user.id,
      status: ChallengeStatus.DRAFT
    });

    logger.info(`Challenge created: ${challenge.id} by ${user.id}`);

    res.status(201).json({ challenge });
  } catch (error) {
    next(error);
  }
};

// Update challenge
export const updateChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const challenge = await Challenge.findByPk(id);
    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    // Check admin permission
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: { message: 'Only admins can update challenges' } });
      return;
    }

    const updates = req.body;
    await challenge.update(updates);

    logger.info(`Challenge updated: ${challenge.id} by ${user.id}`);

    res.json({ challenge });
  } catch (error) {
    next(error);
  }
};

// Delete challenge
export const deleteChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const challenge = await Challenge.findByPk(id);
    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    // Check admin permission
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: { message: 'Only admins can delete challenges' } });
      return;
    }

    // Delete related entries and votes first
    await ChallengeVote.destroy({ where: { challengeId: id } });
    await ChallengeEntry.destroy({ where: { challengeId: id } });
    await challenge.destroy();

    logger.info(`Challenge deleted: ${id} by ${user.id}`);

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Submit entry to challenge
export const submitEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { videoId } = req.body;
    const user = (req as any).user;

    const challenge = await Challenge.findByPk(id);
    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    // Check if challenge is active
    const now = new Date();
    if (challenge.status !== ChallengeStatus.ACTIVE || now < challenge.startDate || now > challenge.endDate) {
      res.status(400).json({ error: { message: 'Challenge is not accepting entries' } });
      return;
    }

    // Check max entries
    if (challenge.maxEntries && challenge.entriesCount >= challenge.maxEntries) {
      res.status(400).json({ error: { message: 'Challenge has reached maximum entries' } });
      return;
    }

    // Check if user already entered
    const existingEntry = await ChallengeEntry.findOne({
      where: { challengeId: id, userId: user.id }
    });
    if (existingEntry) {
      res.status(400).json({ error: { message: 'You have already entered this challenge' } });
      return;
    }

    // Check if video belongs to user
    const video = await Video.findByPk(videoId);
    if (!video || video.get('userId') !== user.id) {
      res.status(400).json({ error: { message: 'Video not found or not yours' } });
      return;
    }

    // Check duration requirements
    const duration = video.get('duration') as number | null;
    if (challenge.minDuration && duration && duration < challenge.minDuration) {
      res.status(400).json({ error: { message: `Video must be at least ${challenge.minDuration} seconds` } });
      return;
    }
    if (challenge.maxDuration && duration && duration > challenge.maxDuration) {
      res.status(400).json({ error: { message: `Video must be at most ${challenge.maxDuration} seconds` } });
      return;
    }

    // Create entry
    const entry = await ChallengeEntry.create({
      challengeId: id,
      videoId,
      userId: user.id
    });

    // Update entries count
    await challenge.increment('entriesCount');

    logger.info(`Challenge entry submitted: ${entry.id} by ${user.id}`);

    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
};

// Remove entry from challenge
export const removeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, entryId } = req.params;
    const user = (req as any).user;

    const entry = await ChallengeEntry.findOne({
      where: { id: entryId, challengeId: id }
    });

    if (!entry) {
      res.status(404).json({ error: { message: 'Entry not found' } });
      return;
    }

    // Check ownership or admin
    if (entry.userId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: { message: 'Not authorized to remove this entry' } });
      return;
    }

    const challenge = await Challenge.findByPk(id);

    // Delete votes for this entry
    await ChallengeVote.destroy({ where: { entryId } });
    await entry.destroy();

    // Update entries count
    if (challenge) {
      await challenge.decrement('entriesCount');
    }

    logger.info(`Challenge entry removed: ${entryId} by ${user.id}`);

    res.json({ message: 'Entry removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Vote for an entry
export const voteForEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { entryId } = req.body;
    const user = (req as any).user;

    const challenge = await Challenge.findByPk(id);
    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    // Check if voting is allowed
    const now = new Date();
    const isVotingPeriod = challenge.status === ChallengeStatus.VOTING ||
      (challenge.status === ChallengeStatus.ACTIVE && now > challenge.endDate && challenge.votingEndDate && now <= challenge.votingEndDate);

    if (!isVotingPeriod && challenge.status !== ChallengeStatus.ACTIVE) {
      res.status(400).json({ error: { message: 'Voting is not open for this challenge' } });
      return;
    }

    // Check if entry exists
    const entry = await ChallengeEntry.findOne({
      where: { id: entryId, challengeId: id }
    });
    if (!entry) {
      res.status(404).json({ error: { message: 'Entry not found' } });
      return;
    }

    // Check if user already voted
    const existingVote = await ChallengeVote.findOne({
      where: { challengeId: id, userId: user.id }
    });

    if (existingVote) {
      // If voting for same entry, remove vote
      if (existingVote.entryId === entryId) {
        const oldEntry = await ChallengeEntry.findByPk(existingVote.entryId);
        if (oldEntry) await oldEntry.decrement('votesCount');
        await existingVote.destroy();
        res.json({ message: 'Vote removed', voted: false });
        return;
      }

      // Change vote to new entry
      const oldEntry = await ChallengeEntry.findByPk(existingVote.entryId);
      if (oldEntry) await oldEntry.decrement('votesCount');

      existingVote.entryId = entryId;
      await existingVote.save();
      await entry.increment('votesCount');

      res.json({ message: 'Vote changed', voted: true, entryId });
      return;
    }

    // Create new vote
    await ChallengeVote.create({
      challengeId: id,
      entryId,
      userId: user.id
    });
    await entry.increment('votesCount');

    res.json({ message: 'Vote recorded', voted: true, entryId });
  } catch (error) {
    next(error);
  }
};

// Get user's vote
export const getUserVote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const vote = await ChallengeVote.findOne({
      where: { challengeId: id, userId: user.id }
    });

    res.json({ vote: vote ? { entryId: vote.entryId } : null });
  } catch (error) {
    next(error);
  }
};

// Get user's entry
export const getUserEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const entry = await ChallengeEntry.findOne({
      where: { challengeId: id, userId: user.id },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        }
      ]
    });

    res.json({ entry });
  } catch (error) {
    next(error);
  }
};
