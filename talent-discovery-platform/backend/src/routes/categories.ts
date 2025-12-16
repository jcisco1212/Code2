import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, requireModeratorOrAdmin } from '../middleware/auth';
import { Category } from '../models';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis';

const router = Router();

// Get all categories
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { includeInactive = false, talentOnly = false } = req.query;

    // Try cache
    const cacheKey = `categories:${includeInactive}:${talentOnly}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ categories: cached });
      return;
    }

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (talentOnly === 'true') {
      where.isTalentType = true;
    }

    // Don't include subcategories in query to avoid circular reference issues
    const categories = await Category.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Convert to plain objects first
    const plainCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      icon: c.icon,
      iconUrl: c.iconUrl,
      color: c.color,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      isTalentType: c.isTalentType,
      createdAt: c.createdAt
    }));

    // Build tree structure
    const rootCategories = plainCategories.filter(c => !c.parentId);
    const buildTree = (cat: any): any => ({
      ...cat,
      subcategories: plainCategories
        .filter(c => c.parentId === cat.id)
        .map(buildTree)
    });

    const tree = rootCategories.map(buildTree);

    // Cache for 1 hour
    await cacheSet(cacheKey, tree, 3600);

    res.json({ categories: tree });
  } catch (error) {
    next(error);
  }
});

// Get single category
router.get(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Valid category ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          { model: Category, as: 'subcategories' },
          { model: Category, as: 'parent' }
        ]
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// Create category (admin/moderator only)
router.post(
  '/',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name required (1-100 chars)'),
    body('slug').trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 chars'),
    body('parentId').optional().isUUID().withMessage('Valid parent ID required'),
    body('iconUrl').optional().isURL().withMessage('Invalid icon URL'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be positive integer'),
    body('isTalentType').optional().isBoolean().withMessage('isTalentType must be boolean')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, slug, description, parentId, iconUrl, color, sortOrder, isTalentType } = req.body;

      // Check slug unique
      const existing = await Category.findOne({ where: { slug } });
      if (existing) {
        throw new ConflictError('Slug already exists');
      }

      const category = await Category.create({
        name,
        slug,
        description,
        parentId,
        iconUrl,
        color,
        sortOrder: sortOrder || 0,
        isTalentType: isTalentType !== false
      });

      // Clear cache
      await cacheDelete('categories:*');

      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// Update category (admin/moderator only)
router.put(
  '/:id',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid category ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 chars'),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 chars'),
    body('parentId').optional().isUUID().withMessage('Valid parent ID required'),
    body('iconUrl').optional().isURL().withMessage('Invalid icon URL'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be positive integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('isTalentType').optional().isBoolean().withMessage('isTalentType must be boolean')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      const { name, slug, description, parentId, iconUrl, color, sortOrder, isActive, isTalentType } = req.body;

      // Check slug unique if changed
      if (slug && slug !== category.slug) {
        const existing = await Category.findOne({ where: { slug } });
        if (existing) {
          throw new ConflictError('Slug already exists');
        }
      }

      await category.update({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(isTalentType !== undefined && { isTalentType })
      });

      // Clear cache
      await cacheDelete('categories:*');

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// Delete category (admin only)
router.delete(
  '/:id',
  authenticate as RequestHandler,
  requireModeratorOrAdmin as RequestHandler,
  validate([
    param('id').isUUID().withMessage('Valid category ID required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check for subcategories
      const subcategories = await Category.count({ where: { parentId: id } });
      if (subcategories > 0) {
        res.status(400).json({ error: 'Cannot delete category with subcategories' });
        return;
      }

      // Soft delete - just deactivate
      await category.update({ isActive: false });

      // Clear cache
      await cacheDelete('categories:*');

      res.json({ message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
