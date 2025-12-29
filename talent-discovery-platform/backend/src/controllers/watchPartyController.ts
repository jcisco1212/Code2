import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import WatchParty, { WatchPartyStatus } from '../models/WatchParty';
import WatchPartyParticipant from '../models/WatchPartyParticipant';
import Video from '../models/Video';
import User from '../models/User';
import Notification, { NotificationType } from '../models/Notification';

// Generate unique invite code
const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Get active watch parties
export const getActiveParties = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: parties } = await WatchParty.findAndCountAll({
      where: {
        status: { [Op.in]: ['waiting', 'playing', 'paused'] },
        isPrivate: false
      },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        },
        {
          model: User,
          as: 'host',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        },
        {
          model: WatchPartyParticipant,
          as: 'participants',
          where: { isActive: true },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatarUrl']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      parties,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching watch parties:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch watch parties' });
  }
};

// Get my watch parties (hosted or joined)
export const getMyParties = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type = 'all' } = req.query;

    let whereClause: any = {};

    if (type === 'hosted') {
      whereClause.hostId = userId;
    } else if (type === 'joined') {
      // Will be filtered by includes
    }

    const parties = await WatchParty.findAll({
      where: type === 'hosted' ? { hostId: userId } : {},
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        },
        {
          model: User,
          as: 'host',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        },
        {
          model: WatchPartyParticipant,
          as: 'participants',
          where: type === 'joined' ? { userId, isActive: true } : { isActive: true },
          required: type === 'joined',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatarUrl']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, parties });
  } catch (error) {
    console.error('Error fetching my parties:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch watch parties' });
  }
};

// Get a specific watch party
export const getParty = async (req: Request, res: Response) => {
  try {
    const { partyId } = req.params;

    const party = await WatchParty.findByPk(partyId, {
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'hlsUrl', 'duration', 'description'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        },
        {
          model: User,
          as: 'host',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        },
        {
          model: WatchPartyParticipant,
          as: 'participants',
          where: { isActive: true },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
          }]
        }
      ]
    });

    if (!party) {
      return res.status(404).json({ success: false, message: 'Watch party not found' });
    }

    res.json({ success: true, party });
  } catch (error) {
    console.error('Error fetching party:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch watch party' });
  }
};

// Get party by invite code
export const getPartyByInvite = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;

    const party = await WatchParty.findOne({
      where: { inviteCode },
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'thumbnailUrl', 'duration']
        },
        {
          model: User,
          as: 'host',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
        },
        {
          model: WatchPartyParticipant,
          as: 'participants',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!party) {
      return res.status(404).json({ success: false, message: 'Watch party not found' });
    }

    res.json({ success: true, party });
  } catch (error) {
    console.error('Error fetching party by invite:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch watch party' });
  }
};

// Create a watch party
export const createParty = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { videoId, title, description, isPrivate, maxParticipants, scheduledAt } = req.body;

    // Verify video exists
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (await WatchParty.findOne({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ success: false, message: 'Failed to generate invite code' });
      }
    }

    const party = await WatchParty.create({
      hostId: userId,
      videoId,
      title,
      description,
      inviteCode,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 50,
      scheduledAt: scheduledAt || null
    });

    // Add host as participant
    await WatchPartyParticipant.create({
      watchPartyId: party.id,
      userId,
      joinedAt: new Date()
    });

    // Fetch full party
    const fullParty = await WatchParty.findByPk(party.id, {
      include: [
        { model: Video, as: 'video' },
        { model: User, as: 'host', attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'] },
        {
          model: WatchPartyParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }]
        }
      ]
    });

    res.status(201).json({ success: true, party: fullParty });
  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ success: false, message: 'Failed to create watch party' });
  }
};

// Join a watch party
export const joinParty = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { partyId } = req.params;

    const party = await WatchParty.findByPk(partyId, {
      include: [{
        model: WatchPartyParticipant,
        as: 'participants',
        where: { isActive: true },
        required: false
      }]
    });

    if (!party) {
      return res.status(404).json({ success: false, message: 'Watch party not found' });
    }

    if (party.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Watch party has ended' });
    }

    // Check max participants
    const activeCount = party.participants?.length || 0;
    if (activeCount >= party.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Watch party is full' });
    }

    // Check if already a participant
    const existing = await WatchPartyParticipant.findOne({
      where: { watchPartyId: partyId, userId }
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: 'Already in this watch party' });
      }
      // Rejoin
      await existing.update({ isActive: true, leftAt: null, joinedAt: new Date() });
    } else {
      await WatchPartyParticipant.create({
        watchPartyId: partyId,
        userId,
        joinedAt: new Date()
      });
    }

    // Notify host
    if (party.hostId !== userId) {
      const user = await User.findByPk(userId);
      await Notification.create({
        userId: party.hostId,
        type: NotificationType.WATCH_PARTY,
        title: 'New Participant',
        message: `${user?.username || 'Someone'} joined your watch party`,
        data: { watchPartyId: partyId }
      });
    }

    res.json({ success: true, message: 'Joined watch party' });
  } catch (error) {
    console.error('Error joining party:', error);
    res.status(500).json({ success: false, message: 'Failed to join watch party' });
  }
};

// Leave a watch party
export const leaveParty = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { partyId } = req.params;

    const participant = await WatchPartyParticipant.findOne({
      where: { watchPartyId: partyId, userId, isActive: true }
    });

    if (!participant) {
      return res.status(400).json({ success: false, message: 'Not in this watch party' });
    }

    await participant.update({ isActive: false, leftAt: new Date() });

    res.json({ success: true, message: 'Left watch party' });
  } catch (error) {
    console.error('Error leaving party:', error);
    res.status(500).json({ success: false, message: 'Failed to leave watch party' });
  }
};

// Update party state (host only)
export const updatePartyState = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { partyId } = req.params;
    const { status, currentTime, isPlaying } = req.body;

    const party = await WatchParty.findByPk(partyId);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Watch party not found' });
    }

    if (party.hostId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the host can control playback' });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (currentTime !== undefined) updates.currentTime = currentTime;
    if (isPlaying !== undefined) updates.isPlaying = isPlaying;

    if (status === 'playing' && !party.startedAt) {
      updates.startedAt = new Date();
    }
    if (status === 'ended') {
      updates.endedAt = new Date();
    }

    await party.update(updates);

    res.json({ success: true, party });
  } catch (error) {
    console.error('Error updating party state:', error);
    res.status(500).json({ success: false, message: 'Failed to update watch party' });
  }
};

// End a watch party (host only)
export const endParty = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { partyId } = req.params;

    const party = await WatchParty.findByPk(partyId);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Watch party not found' });
    }

    if (party.hostId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the host can end the party' });
    }

    await party.update({
      status: WatchPartyStatus.ENDED,
      endedAt: new Date(),
      isPlaying: false
    });

    // Mark all participants as left
    await WatchPartyParticipant.update(
      { isActive: false, leftAt: new Date() },
      { where: { watchPartyId: partyId, isActive: true } }
    );

    res.json({ success: true, message: 'Watch party ended' });
  } catch (error) {
    console.error('Error ending party:', error);
    res.status(500).json({ success: false, message: 'Failed to end watch party' });
  }
};
