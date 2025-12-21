import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { User } from '../models';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { DataTypes, Model } from 'sequelize';

// Define models inline
class CastingList extends Model {
  declare id: string;
  declare agentId: string;
  declare name: string;
  declare description: string | null;
  declare projectName: string | null;
  declare deadline: Date | null;
  declare talentCount: number;
}

CastingList.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  agentId: { type: DataTypes.UUID, allowNull: false, field: 'agent_id' },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  projectName: { type: DataTypes.STRING(255), allowNull: true, field: 'project_name' },
  deadline: { type: DataTypes.DATE, allowNull: true },
  talentCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'talent_count' }
}, { sequelize, tableName: 'casting_lists', modelName: 'CastingList' });

class CastingListTalent extends Model {
  declare id: string;
  declare castingListId: string;
  declare talentId: string;
  declare status: string;
  declare notes: string | null;
  declare rating: number | null;
}

CastingListTalent.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  castingListId: { type: DataTypes.UUID, allowNull: false, field: 'casting_list_id' },
  talentId: { type: DataTypes.UUID, allowNull: false, field: 'talent_id' },
  status: { type: DataTypes.STRING(50), defaultValue: 'considering' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  rating: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, tableName: 'casting_list_talents', modelName: 'CastingListTalent' });

// Associations
CastingList.hasMany(CastingListTalent, { foreignKey: 'castingListId', as: 'talents' });
CastingListTalent.belongsTo(CastingList, { foreignKey: 'castingListId' });
CastingListTalent.belongsTo(User, { foreignKey: 'talentId', as: 'talent' });

const router = Router();

// Middleware to check if user is an agent
const isAgent = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
    res.status(403).json({ error: { message: 'Agent access required' } });
    return;
  }
  next();
};

// Get all casting lists for agent
router.get(
  '/',
  authenticate as RequestHandler,
  isAgent,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lists = await CastingList.findAll({
        where: { agentId: req.userId },
        order: [['createdAt', 'DESC']]
      });

      res.json({ castingLists: lists });
    } catch (error) {
      next(error);
    }
  }
);

// Create casting list
router.post(
  '/',
  authenticate as RequestHandler,
  isAgent,
  validate([
    body('name').notEmpty().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('projectName').optional().isLength({ max: 255 }),
    body('deadline').optional().isISO8601()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, projectName, deadline } = req.body;

      const list = await CastingList.create({
        agentId: req.userId!,
        name,
        description,
        projectName,
        deadline: deadline ? new Date(deadline) : null
      });

      res.status(201).json({ castingList: list });
    } catch (error) {
      next(error);
    }
  }
);

// Get single casting list with talents
router.get(
  '/:id',
  authenticate as RequestHandler,
  isAgent,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id, {
        include: [{
          model: CastingListTalent,
          as: 'talents',
          include: [{
            model: User,
            as: 'talent',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl', 'artistType', 'genre', 'location']
          }]
        }]
      });

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId && req.user?.role !== 'admin') {
        throw new ForbiddenError('Not authorized');
      }

      res.json({ castingList: list });
    } catch (error) {
      next(error);
    }
  }
);

// Update casting list
router.put(
  '/:id',
  authenticate as RequestHandler,
  isAgent,
  validate([
    param('id').isUUID(),
    body('name').optional().isLength({ max: 255 }),
    body('description').optional().isLength({ max: 5000 }),
    body('projectName').optional().isLength({ max: 255 }),
    body('deadline').optional().isISO8601()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id);

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const { name, description, projectName, deadline } = req.body;
      await list.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(projectName !== undefined && { projectName }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
      });

      res.json({ castingList: list });
    } catch (error) {
      next(error);
    }
  }
);

// Delete casting list
router.delete(
  '/:id',
  authenticate as RequestHandler,
  isAgent,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id);

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      await CastingListTalent.destroy({ where: { castingListId: list.id } });
      await list.destroy();

      res.json({ message: 'Casting list deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Add talent to casting list
router.post(
  '/:id/talents',
  authenticate as RequestHandler,
  isAgent,
  validate([
    param('id').isUUID(),
    body('talentId').isUUID(),
    body('notes').optional().isLength({ max: 5000 }),
    body('status').optional().isIn(['considering', 'shortlisted', 'contacted', 'auditioned', 'selected', 'rejected'])
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id);

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const { talentId, notes, status = 'considering' } = req.body;

      const talent = await User.findByPk(talentId);
      if (!talent) {
        throw new NotFoundError('Talent not found');
      }

      // Check if already in list
      const existing = await CastingListTalent.findOne({
        where: { castingListId: list.id, talentId }
      });

      if (existing) {
        res.json({ message: 'Talent already in list' });
        return;
      }

      await CastingListTalent.create({
        castingListId: list.id,
        talentId,
        notes,
        status
      });

      await list.update({ talentCount: list.talentCount + 1 });

      res.json({ message: 'Talent added to list' });
    } catch (error) {
      next(error);
    }
  }
);

// Update talent in casting list
router.put(
  '/:id/talents/:talentId',
  authenticate as RequestHandler,
  isAgent,
  validate([
    param('id').isUUID(),
    param('talentId').isUUID(),
    body('notes').optional().isLength({ max: 5000 }),
    body('status').optional().isIn(['considering', 'shortlisted', 'contacted', 'auditioned', 'selected', 'rejected']),
    body('rating').optional().isInt({ min: 1, max: 5 })
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id);

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const entry = await CastingListTalent.findOne({
        where: { castingListId: list.id, talentId: req.params.talentId }
      });

      if (!entry) {
        throw new NotFoundError('Talent not in list');
      }

      const { notes, status, rating } = req.body;
      await entry.update({
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(rating !== undefined && { rating })
      });

      res.json({ message: 'Talent updated' });
    } catch (error) {
      next(error);
    }
  }
);

// Remove talent from casting list
router.delete(
  '/:id/talents/:talentId',
  authenticate as RequestHandler,
  isAgent,
  validate([
    param('id').isUUID(),
    param('talentId').isUUID()
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await CastingList.findByPk(req.params.id);

      if (!list) {
        throw new NotFoundError('Casting list not found');
      }

      if (list.agentId !== req.userId) {
        throw new ForbiddenError('Not authorized');
      }

      const deleted = await CastingListTalent.destroy({
        where: { castingListId: list.id, talentId: req.params.talentId }
      });

      if (deleted) {
        await list.update({ talentCount: Math.max(0, list.talentCount - 1) });
      }

      res.json({ message: 'Talent removed from list' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
