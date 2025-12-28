import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Duet, { DuetLayout, DuetStatus } from '../models/Duet';
import Video from '../models/Video';
import User from '../models/User';
import Notification from '../models/Notification';

// Get all duets for a video
export const getVideoDuets = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: duets } = await Duet.findAndCountAll({
      where: {
        originalVideoId: videoId,
        status: 'ready'
      },
      include: [
        {
          model: Video,
          as: 'responseVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'hlsUrl', 'duration', 'viewsCount'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      duets,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching duets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch duets' });
  }
};

// Get a specific duet
export const getDuet = async (req: Request, res: Response) => {
  try {
    const { duetId } = req.params;

    const duet = await Duet.findByPk(duetId, {
      include: [
        {
          model: Video,
          as: 'originalVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'hlsUrl', 'duration', 'viewsCount'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        },
        {
          model: Video,
          as: 'responseVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'hlsUrl', 'duration', 'viewsCount'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ]
    });

    if (!duet) {
      return res.status(404).json({ success: false, message: 'Duet not found' });
    }

    // Increment view count
    await duet.increment('viewsCount');

    res.json({ success: true, duet });
  } catch (error) {
    console.error('Error fetching duet:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch duet' });
  }
};

// Create a new duet
export const createDuet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { originalVideoId, responseVideoId, layout, audioMix, originalVolume, responseVolume, syncOffset } = req.body;

    // Verify original video exists and allows duets
    const originalVideo = await Video.findByPk(originalVideoId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!originalVideo) {
      return res.status(404).json({ success: false, message: 'Original video not found' });
    }

    // Verify response video exists and belongs to the user
    const responseVideo = await Video.findByPk(responseVideoId);
    if (!responseVideo) {
      return res.status(404).json({ success: false, message: 'Response video not found' });
    }

    if (responseVideo.userId !== userId) {
      return res.status(403).json({ success: false, message: 'You can only use your own videos as responses' });
    }

    // Create the duet
    const duet = await Duet.create({
      originalVideoId,
      responseVideoId,
      creatorId: userId,
      layout: layout || DuetLayout.SIDE_BY_SIDE,
      audioMix: audioMix || 'both',
      originalVolume: originalVolume ?? 100,
      responseVolume: responseVolume ?? 100,
      syncOffset: syncOffset || 0,
      status: DuetStatus.READY // For now, mark as ready since we're doing client-side rendering
    });

    // Notify original video owner
    if (originalVideo.userId !== userId) {
      await Notification.create({
        userId: originalVideo.userId,
        type: 'duet',
        title: 'New Duet',
        content: `Someone created a duet with your video "${originalVideo.title}"`,
        relatedId: duet.id,
        relatedType: 'duet'
      });
    }

    // Fetch the full duet with associations
    const fullDuet = await Duet.findByPk(duet.id, {
      include: [
        {
          model: Video,
          as: 'originalVideo',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] }]
        },
        {
          model: Video,
          as: 'responseVideo',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ]
    });

    res.status(201).json({ success: true, duet: fullDuet });
  } catch (error) {
    console.error('Error creating duet:', error);
    res.status(500).json({ success: false, message: 'Failed to create duet' });
  }
};

// Update duet settings
export const updateDuet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { duetId } = req.params;
    const { layout, audioMix, originalVolume, responseVolume, syncOffset } = req.body;

    const duet = await Duet.findByPk(duetId);

    if (!duet) {
      return res.status(404).json({ success: false, message: 'Duet not found' });
    }

    if (duet.creatorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this duet' });
    }

    await duet.update({
      layout: layout || duet.layout,
      audioMix: audioMix || duet.audioMix,
      originalVolume: originalVolume ?? duet.originalVolume,
      responseVolume: responseVolume ?? duet.responseVolume,
      syncOffset: syncOffset ?? duet.syncOffset
    });

    res.json({ success: true, duet });
  } catch (error) {
    console.error('Error updating duet:', error);
    res.status(500).json({ success: false, message: 'Failed to update duet' });
  }
};

// Delete a duet
export const deleteDuet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { duetId } = req.params;

    const duet = await Duet.findByPk(duetId);

    if (!duet) {
      return res.status(404).json({ success: false, message: 'Duet not found' });
    }

    if (duet.creatorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this duet' });
    }

    await duet.destroy();

    res.json({ success: true, message: 'Duet deleted successfully' });
  } catch (error) {
    console.error('Error deleting duet:', error);
    res.status(500).json({ success: false, message: 'Failed to delete duet' });
  }
};

// Get my duets
export const getMyDuets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: duets } = await Duet.findAndCountAll({
      where: { creatorId: userId },
      include: [
        {
          model: Video,
          as: 'originalVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration'],
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }]
        },
        {
          model: Video,
          as: 'responseVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      duets,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching my duets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch duets' });
  }
};

// Get trending duets
export const getTrendingDuets = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const duets = await Duet.findAll({
      where: { status: 'ready' },
      include: [
        {
          model: Video,
          as: 'originalVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'viewsCount'],
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] }]
        },
        {
          model: Video,
          as: 'responseVideo',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'viewsCount'],
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        }
      ],
      order: [['viewsCount', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit)
    });

    res.json({ success: true, duets });
  } catch (error) {
    console.error('Error fetching trending duets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending duets' });
  }
};

// Check if video allows duets
export const checkDuetAllowed = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findByPk(videoId);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // For now, all public videos allow duets
    const allowed = video.visibility === 'public' && video.status === 'ready';

    res.json({ success: true, allowed, videoId });
  } catch (error) {
    console.error('Error checking duet allowed:', error);
    res.status(500).json({ success: false, message: 'Failed to check duet permission' });
  }
};
