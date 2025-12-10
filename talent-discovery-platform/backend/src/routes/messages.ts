import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { Message, MessageStatus, User } from '../models';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { Op, fn, col, literal } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get distinct conversation IDs with latest message
    const conversations = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.userId },
          { receiverId: req.userId }
        ]
      },
      attributes: [
        'conversationId',
        [fn('MAX', col('created_at')), 'lastMessageAt']
      ],
      group: ['conversationId'],
      order: [[fn('MAX', col('created_at')), 'DESC']],
      limit: Number(limit),
      offset,
      raw: true
    });

    // Get details for each conversation
    const conversationDetails = await Promise.all(
      conversations.map(async (conv: any) => {
        // Get last message
        const lastMessage = await Message.findOne({
          where: { conversationId: conv.conversationId },
          order: [['createdAt', 'DESC']]
        });

        // Get other user
        const otherUserId = lastMessage!.senderId === req.userId
          ? lastMessage!.receiverId
          : lastMessage!.senderId;

        const otherUser = await User.findByPk(otherUserId, {
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl', 'role', 'agencyName']
        });

        // Get unread count
        const unreadCount = await Message.count({
          where: {
            conversationId: conv.conversationId,
            receiverId: req.userId,
            status: { [Op.ne]: MessageStatus.READ }
          }
        });

        return {
          conversationId: conv.conversationId,
          otherUser,
          lastMessage: {
            content: lastMessage!.content.substring(0, 100),
            createdAt: lastMessage!.createdAt,
            isAgentMessage: lastMessage!.isAgentMessage
          },
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationDetails });
  } catch (error) {
    next(error);
  }
});

// Get messages in conversation
router.get(
  '/conversation/:conversationId',
  authenticate,
  validate([param('conversationId').isUUID().withMessage('Valid conversation ID required')]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Verify user is part of conversation
      const message = await Message.findOne({
        where: {
          conversationId,
          [Op.or]: [
            { senderId: req.userId },
            { receiverId: req.userId }
          ]
        }
      });

      if (!message) {
        throw new ForbiddenError('Access denied');
      }

      const { count, rows } = await Message.findAndCountAll({
        where: { conversationId },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Mark messages as read
      await Message.update(
        { status: MessageStatus.READ, readAt: new Date() },
        {
          where: {
            conversationId,
            receiverId: req.userId,
            status: { [Op.ne]: MessageStatus.READ }
          }
        }
      );

      res.json({
        messages: rows.reverse(),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send message
router.post(
  '/',
  authenticate,
  validate([
    body('receiverId').isUUID().withMessage('Valid receiver ID required'),
    body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message required (1-5000 chars)')
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { receiverId, content } = req.body;

      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        throw new NotFoundError('User not found');
      }

      // Get or create conversation ID
      const existingMessage = await Message.findOne({
        where: {
          [Op.or]: [
            { senderId: req.userId, receiverId },
            { senderId: receiverId, receiverId: req.userId }
          ]
        }
      });

      const conversationId = existingMessage?.conversationId || uuidv4();

      const message = await Message.create({
        senderId: req.userId!,
        receiverId,
        conversationId,
        content,
        isAgentMessage: req.user!.role === 'agent'
      });

      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl'] }
        ]
      });

      res.status(201).json({ message: messageWithSender });
    } catch (error) {
      next(error);
    }
  }
);

// Delete message
router.delete(
  '/:id',
  authenticate,
  validate([param('id').isUUID().withMessage('Valid message ID required')]),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const message = await Message.findOne({
        where: { id, senderId: req.userId }
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      await message.update({ status: MessageStatus.DELETED });

      res.json({ message: 'Message deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Message.count({
      where: {
        receiverId: req.userId,
        status: { [Op.ne]: MessageStatus.READ }
      }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

export default router;
