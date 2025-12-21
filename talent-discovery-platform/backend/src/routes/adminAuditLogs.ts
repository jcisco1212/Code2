import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Define AuditLog model inline
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false
});

// Set up association
AuditLog.belongsTo(sequelize.models.User, { as: 'user', foreignKey: 'userId' });

// Get audit logs with filters
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      targetType,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate as string);
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      logs,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log stats
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const actionCounts = await AuditLog.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('action')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('action')), 'DESC']],
      limit: 10
    });

    const totalCount = await AuditLog.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    res.json({
      stats: {
        total: totalCount,
        byAction: actionCounts,
        period
      }
    });
  } catch (error) {
    logger.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Helper function to create audit log entries (exported for use in other routes)
export const createAuditLog = async (data: {
  userId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await AuditLog.create(data);
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
};

export default router;
