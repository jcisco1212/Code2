import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { User, Video, CompCard } from '../models';
import { Op } from 'sequelize';

const router = Router();

// Get current user's comp cards
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const compCards = await CompCard.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ compCards: compCards.map(c => c.toPublicJSON()) });
  } catch (error) {
    next(error);
  }
});

// Create a new comp card
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      tagline,
      headshots,
      stats,
      experience,
      training,
      featuredVideoIds,
      unionMemberships,
      representation,
      customSections,
      template,
      colorScheme,
      isPublic
    } = req.body;

    const compCard = await CompCard.create({
      userId,
      title: title || 'My Comp Card',
      tagline,
      headshots: headshots || [],
      stats,
      experience: experience || [],
      training: training || [],
      featuredVideoIds: featuredVideoIds || [],
      unionMemberships: unionMemberships || [],
      representation,
      customSections,
      template: template || 'classic',
      colorScheme: colorScheme || 'professional',
      isPublic: isPublic !== false
    });

    // Reload with associations
    const fullCompCard = await CompCard.findByPk(compCard.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio']
        }
      ]
    });

    res.status(201).json({ compCard: fullCompCard?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Get comp card by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const compCard = await CompCard.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio', 'socialLinks', 'gender', 'ethnicity', 'talentCategories']
        }
      ]
    });

    if (!compCard) {
      return res.status(404).json({ error: 'Comp card not found' });
    }

    // Check visibility
    if (!compCard.isPublic && compCard.userId !== userId) {
      return res.status(403).json({ error: 'This comp card is private' });
    }

    // Increment view count if not the owner
    if (compCard.userId !== userId) {
      await compCard.increment('viewCount');
    }

    // Get featured videos if any
    let featuredVideos: any[] = [];
    if (compCard.featuredVideoIds && compCard.featuredVideoIds.length > 0) {
      featuredVideos = await Video.findAll({
        where: { id: { [Op.in]: compCard.featuredVideoIds } },
        attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'viewsCount']
      });
    }

    res.json({
      compCard: {
        ...compCard.toPublicJSON(),
        featuredVideos
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get comp card by share token (public access)
router.get('/share/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const compCard = await CompCard.findOne({
      where: { shareToken: token },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio', 'socialLinks', 'gender', 'ethnicity', 'talentCategories']
        }
      ]
    });

    if (!compCard) {
      return res.status(404).json({ error: 'Comp card not found' });
    }

    if (!compCard.isPublic) {
      return res.status(403).json({ error: 'This comp card is private' });
    }

    // Increment view count
    await compCard.increment('viewCount');

    // Get featured videos if any
    let featuredVideos: any[] = [];
    if (compCard.featuredVideoIds && compCard.featuredVideoIds.length > 0) {
      featuredVideos = await Video.findAll({
        where: { id: { [Op.in]: compCard.featuredVideoIds } },
        attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'viewsCount']
      });
    }

    res.json({
      compCard: {
        ...compCard.toPublicJSON(),
        featuredVideos
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update comp card
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      title,
      tagline,
      headshots,
      stats,
      experience,
      training,
      featuredVideoIds,
      unionMemberships,
      representation,
      customSections,
      template,
      colorScheme,
      isPublic
    } = req.body;

    const compCard = await CompCard.findByPk(id);

    if (!compCard) {
      return res.status(404).json({ error: 'Comp card not found' });
    }

    if (compCard.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this comp card' });
    }

    await compCard.update({
      title: title !== undefined ? title : compCard.title,
      tagline: tagline !== undefined ? tagline : compCard.tagline,
      headshots: headshots !== undefined ? headshots : compCard.headshots,
      stats: stats !== undefined ? stats : compCard.stats,
      experience: experience !== undefined ? experience : compCard.experience,
      training: training !== undefined ? training : compCard.training,
      featuredVideoIds: featuredVideoIds !== undefined ? featuredVideoIds : compCard.featuredVideoIds,
      unionMemberships: unionMemberships !== undefined ? unionMemberships : compCard.unionMemberships,
      representation: representation !== undefined ? representation : compCard.representation,
      customSections: customSections !== undefined ? customSections : compCard.customSections,
      template: template !== undefined ? template : compCard.template,
      colorScheme: colorScheme !== undefined ? colorScheme : compCard.colorScheme,
      isPublic: isPublic !== undefined ? isPublic : compCard.isPublic
    });

    // Reload with associations
    const fullCompCard = await CompCard.findByPk(compCard.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio']
        }
      ]
    });

    res.json({ compCard: fullCompCard?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

// Delete comp card
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const compCard = await CompCard.findByPk(id);

    if (!compCard) {
      return res.status(404).json({ error: 'Comp card not found' });
    }

    if (compCard.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comp card' });
    }

    await compCard.destroy();
    res.json({ message: 'Comp card deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Regenerate share token
router.post('/:id/regenerate-token', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const compCard = await CompCard.findByPk(id);

    if (!compCard) {
      return res.status(404).json({ error: 'Comp card not found' });
    }

    if (compCard.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this comp card' });
    }

    // Generate new token
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let newToken = '';
    for (let i = 0; i < 12; i++) {
      newToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await compCard.update({ shareToken: newToken });

    res.json({ shareToken: newToken });
  } catch (error) {
    next(error);
  }
});

// Auto-generate comp card from profile
router.post('/generate-from-profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { template, colorScheme } = req.body;

    // Get user's full profile
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's top videos
    const topVideos = await Video.findAll({
      where: { userId, status: 'published' },
      order: [['viewsCount', 'DESC']],
      limit: 6,
      attributes: ['id']
    });

    // Create comp card with profile data
    const compCard = await CompCard.create({
      userId,
      title: `${user.displayName || user.firstName || user.username}'s Comp Card`,
      tagline: user.bio || null,
      headshots: user.photoGallery || (user.avatarUrl ? [user.avatarUrl] : []),
      stats: {
        languages: ['English'],
        specialSkills: user.talentCategories || []
      },
      experience: [],
      training: [],
      featuredVideoIds: topVideos.map(v => v.id),
      unionMemberships: [],
      representation: user.agencyName || null,
      template: template || 'classic',
      colorScheme: colorScheme || 'professional',
      isPublic: true
    });

    // Reload with associations
    const fullCompCard = await CompCard.findByPk(compCard.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'firstName', 'lastName', 'avatarUrl', 'location', 'bio']
        }
      ]
    });

    res.status(201).json({ compCard: fullCompCard?.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

export default router;
