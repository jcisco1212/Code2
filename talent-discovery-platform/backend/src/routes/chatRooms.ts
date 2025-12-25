import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { User, ChatRoom, ChatRoomMember, ChatRoomMessage, ChatMessageType } from '../models';
import { MemberRole } from '../models/ChatRoomMember';
import { ChatRoomType } from '../models/ChatRoom';
import { Op } from 'sequelize';

const router = Router();

// Get user's chat rooms
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Find all rooms user is a member of
    const memberships = await ChatRoomMember.findAll({
      where: { userId },
      attributes: ['chatRoomId', 'role', 'lastReadAt', 'isMuted']
    });

    const roomIds = memberships.map(m => m.chatRoomId);

    const chatRooms = await ChatRoom.findAll({
      where: {
        id: { [Op.in]: roomIds },
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        },
        {
          model: ChatRoomMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl']
          }],
          limit: 5
        }
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST']]
    });

    // Merge membership info with room data
    const roomsWithMembership = chatRooms.map(room => {
      const membership = memberships.find(m => m.chatRoomId === room.id);
      return {
        ...room.toPublicJSON(),
        myRole: membership?.role,
        lastReadAt: membership?.lastReadAt,
        isMuted: membership?.isMuted
      };
    });

    res.json({ chatRooms: roomsWithMembership });
  } catch (error) {
    next(error);
  }
});

// Create a new chat room
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, description, type, isPublic, memberIds } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const chatRoom = await ChatRoom.create({
      name: name.trim(),
      description: description?.trim(),
      type: type || ChatRoomType.PROJECT,
      creatorId: userId,
      isPublic: isPublic === true,
      memberCount: 1
    });

    // Add creator as owner
    await ChatRoomMember.create({
      chatRoomId: chatRoom.id,
      userId,
      role: MemberRole.OWNER
    });

    // Add initial members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const uniqueMemberIds = [...new Set(memberIds.filter((id: string) => id !== userId))];

      for (const memberId of uniqueMemberIds) {
        await ChatRoomMember.create({
          chatRoomId: chatRoom.id,
          userId: memberId,
          role: MemberRole.MEMBER
        });
      }

      // Update member count
      await chatRoom.update({ memberCount: 1 + uniqueMemberIds.length });
    }

    // Reload with associations
    const fullRoom = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        },
        {
          model: ChatRoomMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl']
          }]
        }
      ]
    });

    res.status(201).json({ chatRoom: fullRoom?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Get chat room by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is a member
    const membership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId }
    });

    if (!membership) {
      // Check if room is public
      const room = await ChatRoom.findByPk(id);
      if (!room || !room.isPublic) {
        return res.status(403).json({ error: 'Not authorized to view this chat room' });
      }
    }

    const chatRoom = await ChatRoom.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        },
        {
          model: ChatRoomMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatarUrl']
          }]
        }
      ]
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    res.json({
      chatRoom: {
        ...chatRoom.toPublicJSON(),
        myRole: membership?.role,
        isMember: !!membership
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update chat room
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, description, avatarUrl, isPublic, maxMembers } = req.body;

    // Check if user is owner or admin
    const membership = await ChatRoomMember.findOne({
      where: {
        chatRoomId: id,
        userId,
        role: { [Op.in]: [MemberRole.OWNER, MemberRole.ADMIN] }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to update this chat room' });
    }

    const chatRoom = await ChatRoom.findByPk(id);
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    await chatRoom.update({
      name: name !== undefined ? name.trim() : chatRoom.name,
      description: description !== undefined ? description?.trim() : chatRoom.description,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : chatRoom.avatarUrl,
      isPublic: isPublic !== undefined ? isPublic : chatRoom.isPublic,
      maxMembers: maxMembers !== undefined ? maxMembers : chatRoom.maxMembers
    });

    res.json({ chatRoom: chatRoom.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) chat room
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is owner
    const membership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId, role: MemberRole.OWNER }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Only the owner can delete this chat room' });
    }

    const chatRoom = await ChatRoom.findByPk(id);
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    await chatRoom.update({ isActive: false });
    res.json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get messages for a chat room
router.get('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { limit = 50, before } = req.query;

    // Check if user is a member
    const membership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to view messages' });
    }

    const whereClause: any = { chatRoomId: id };
    if (before) {
      whereClause.createdAt = { [Op.lt]: new Date(before as string) };
    }

    const messages = await ChatRoomMessage.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        },
        {
          model: ChatRoomMessage,
          as: 'replyTo',
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'displayName']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit as string) || 50, 100)
    });

    // Update last read
    await membership.update({ lastReadAt: new Date() });

    res.json({ messages: messages.reverse().map(m => m.toPublicJSON()) });
  } catch (error) {
    next(error);
  }
});

// Send message to chat room
router.post('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { content, messageType, attachmentUrl, attachmentName, replyToId } = req.body;

    // Check if user is a member
    const membership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to send messages' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await ChatRoomMessage.create({
      chatRoomId: id,
      senderId: userId,
      content: content.trim(),
      messageType: messageType || 'text',
      attachmentUrl,
      attachmentName,
      replyToId
    });

    // Update chat room last message
    const chatRoom = await ChatRoom.findByPk(id);
    if (chatRoom) {
      await chatRoom.update({
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100)
      });
    }

    // Update sender's last read
    await membership.update({ lastReadAt: new Date() });

    // Reload with associations
    const fullMessage = await ChatRoomMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        }
      ]
    });

    res.status(201).json({ message: fullMessage?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Add member to chat room
router.post('/:id/members', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { memberId } = req.body;

    // Check if user is owner or admin
    const membership = await ChatRoomMember.findOne({
      where: {
        chatRoomId: id,
        userId,
        role: { [Op.in]: [MemberRole.OWNER, MemberRole.ADMIN] }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to add members' });
    }

    const chatRoom = await ChatRoom.findByPk(id);
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Check max members
    if (chatRoom.memberCount >= chatRoom.maxMembers) {
      return res.status(400).json({ error: 'Chat room is full' });
    }

    // Check if already a member
    const existing = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId: memberId }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Check if user exists
    const newMember = await User.findByPk(memberId);
    if (!newMember) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ChatRoomMember.create({
      chatRoomId: id,
      userId: memberId,
      role: MemberRole.MEMBER
    });

    await chatRoom.increment('memberCount');

    // Add system message
    await ChatRoomMessage.create({
      chatRoomId: id,
      senderId: userId,
      content: `${newMember.displayName || newMember.username} was added to the group`,
      messageType: ChatMessageType.SYSTEM
    });

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove member from chat room
router.delete('/:id/members/:memberId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    // Check if removing self or has permission
    const myMembership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId }
    });

    if (!myMembership) {
      return res.status(403).json({ error: 'Not a member of this chat room' });
    }

    const targetMembership = await ChatRoomMember.findOne({
      where: { chatRoomId: id, userId: memberId }
    });

    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Can only remove others if owner/admin, or remove self
    if (memberId !== userId) {
      if (myMembership.role !== MemberRole.OWNER && myMembership.role !== MemberRole.ADMIN) {
        return res.status(403).json({ error: 'Not authorized to remove members' });
      }
      // Can't remove owner
      if (targetMembership.role === MemberRole.OWNER) {
        return res.status(403).json({ error: 'Cannot remove the owner' });
      }
    }

    await targetMembership.destroy();

    const chatRoom = await ChatRoom.findByPk(id);
    if (chatRoom) {
      await chatRoom.decrement('memberCount');
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Join chat room by invite code
router.post('/join/:inviteCode', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user!.id;

    const chatRoom = await ChatRoom.findOne({
      where: { inviteCode, isActive: true }
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existing = await ChatRoomMember.findOne({
      where: { chatRoomId: chatRoom.id, userId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this chat room' });
    }

    // Check max members
    if (chatRoom.memberCount >= chatRoom.maxMembers) {
      return res.status(400).json({ error: 'Chat room is full' });
    }

    await ChatRoomMember.create({
      chatRoomId: chatRoom.id,
      userId,
      role: MemberRole.MEMBER
    });

    await chatRoom.increment('memberCount');

    // Reload with associations
    const fullRoom = await ChatRoom.findByPk(chatRoom.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        }
      ]
    });

    res.status(201).json({ chatRoom: fullRoom?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Discover public chat rooms
router.get('/discover/public', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, search, limit = 20, offset = 0 } = req.query;

    const whereClause: any = { isPublic: true, isActive: true };

    if (type && Object.values(ChatRoomType).includes(type as ChatRoomType)) {
      whereClause.type = type;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const chatRooms = await ChatRoom.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        }
      ],
      order: [['memberCount', 'DESC'], ['lastMessageAt', 'DESC NULLS LAST']],
      limit: Math.min(parseInt(limit as string) || 20, 50),
      offset: parseInt(offset as string) || 0
    });

    res.json({ chatRooms: chatRooms.map(r => r.toPublicJSON()) });
  } catch (error) {
    next(error);
  }
});

export default router;
