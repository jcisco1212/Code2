import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';
import { User, Video, VideoStatus, VideoVisibility, Category } from '../models';
import { Op } from 'sequelize';

const router = Router();

// Universal search
router.get(
  '/',
  optionalAuth as RequestHandler,
  validate([
    query('q').notEmpty().withMessage('Search query required')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, type = 'all', limit = 10 } = req.query;
      const searchTerm = (q as string).toLowerCase();

      const results: any = {};

      if (type === 'all' || type === 'videos') {
        const videos = await Video.findAll({
          where: {
            status: VideoStatus.READY,
            visibility: VideoVisibility.PUBLIC,
            [Op.or]: [
              { title: { [Op.iLike]: `%${searchTerm}%` } },
              { description: { [Op.iLike]: `%${searchTerm}%` } },
              { tags: { [Op.contains]: [searchTerm] } }
            ]
          },
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }
          ],
          order: [['views', 'DESC']],
          limit: Number(limit)
        });
        results.videos = videos.map(v => ({ ...v.toPublicJSON(), user: (v as any).user }));
      }

      if (type === 'all' || type === 'users') {
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { username: { [Op.iLike]: `%${searchTerm}%` } },
              { firstName: { [Op.iLike]: `%${searchTerm}%` } },
              { lastName: { [Op.iLike]: `%${searchTerm}%` } }
            ]
          },
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl', 'bio', 'talentCategories'],
          limit: Number(limit)
        });
        results.users = users;
      }

      if (type === 'all' || type === 'categories') {
        const categories = await Category.findAll({
          where: {
            isActive: true,
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchTerm}%` } },
              { description: { [Op.iLike]: `%${searchTerm}%` } }
            ]
          },
          limit: Number(limit)
        });
        results.categories = categories;
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  }
);

// Search suggestions (autocomplete)
router.get(
  '/suggestions',
  validate([
    query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const searchTerm = (q as string).toLowerCase();

      // Get matching video titles
      const videos = await Video.findAll({
        where: {
          status: VideoStatus.READY,
          visibility: VideoVisibility.PUBLIC,
          title: { [Op.iLike]: `%${searchTerm}%` }
        },
        attributes: ['title'],
        limit: 5
      });

      // Get matching usernames
      const users = await User.findAll({
        where: {
          username: { [Op.iLike]: `%${searchTerm}%` }
        },
        attributes: ['username'],
        limit: 5
      });

      // Get matching categories
      const categories = await Category.findAll({
        where: {
          isActive: true,
          name: { [Op.iLike]: `%${searchTerm}%` }
        },
        attributes: ['name', 'slug'],
        limit: 5
      });

      const suggestions = [
        ...videos.map(v => ({ type: 'video', text: v.title })),
        ...users.map(u => ({ type: 'user', text: `@${u.username}` })),
        ...categories.map(c => ({ type: 'category', text: c.name, slug: c.slug }))
      ];

      res.json({ suggestions: suggestions.slice(0, 10) });
    } catch (error) {
      next(error);
    }
  }
);

// Trending searches
router.get('/trending', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This would typically come from a search analytics service
    // For now, return popular categories and trending video titles
    const trendingCategories = await Category.findAll({
      where: { isActive: true, isTalentType: true },
      order: [['videoCount', 'DESC']],
      limit: 5
    });

    const trendingVideos = await Video.findAll({
      where: {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC
      },
      attributes: ['title'],
      order: [['trendingScore', 'DESC']],
      limit: 5
    });

    res.json({
      trending: [
        ...trendingCategories.map(c => ({ type: 'category', text: c.name })),
        ...trendingVideos.map(v => ({ type: 'video', text: v.title }))
      ]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
