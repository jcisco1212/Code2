import { Request, Response } from 'express';
import FeatureFlag, { DEFAULT_FEATURES, FeatureCategory } from '../models/FeatureFlag';
import User from '../models/User';
import { redis } from '../config/redis';

const CACHE_KEY = 'feature_flags';
const CACHE_TTL = 300; // 5 minutes

// Clear cache when flags change
const clearCache = async () => {
  await redis.del(CACHE_KEY);
};

// Get all feature flags (admin)
export const getAllFlags = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    const flags = await FeatureFlag.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });

    res.json({ success: true, flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feature flags' });
  }
};

// Get enabled features (public - for frontend to check)
export const getEnabledFeatures = async (req: Request, res: Response) => {
  try {
    // Try cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return res.json({ success: true, features: JSON.parse(cached) });
    }

    const flags = await FeatureFlag.findAll({
      attributes: ['key', 'isEnabled', 'enabledForRoles', 'config']
    });

    const features: Record<string, { enabled: boolean; roles?: string[]; config?: any }> = {};
    flags.forEach(flag => {
      features[flag.key] = {
        enabled: flag.isEnabled,
        roles: flag.enabledForRoles || undefined,
        config: flag.config || undefined
      };
    });

    // Cache the result
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(features));

    res.json({ success: true, features });
  } catch (error) {
    console.error('Error fetching enabled features:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch features' });
  }
};

// Check if a specific feature is enabled
export const checkFeature = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const flag = await FeatureFlag.findOne({ where: { key } });

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature not found', enabled: false });
    }

    const enabled = flag.isEnabledFor(userId, userRole);

    res.json({ success: true, key, enabled, config: flag.config });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({ success: false, message: 'Failed to check feature' });
  }
};

// Toggle a feature on/off (admin only)
export const toggleFeature = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { flagId } = req.params;
    const { isEnabled } = req.body;

    const flag = await FeatureFlag.findByPk(flagId);

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    await flag.update({
      isEnabled,
      updatedBy: userId
    });

    await clearCache();

    res.json({ success: true, flag, message: `Feature "${flag.name}" ${isEnabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error toggling feature:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle feature' });
  }
};

// Update feature flag settings (admin only)
export const updateFlag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { flagId } = req.params;
    const { name, description, isEnabled, enabledForRoles, enabledForUsers, config } = req.body;

    const flag = await FeatureFlag.findByPk(flagId);

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    await flag.update({
      name: name || flag.name,
      description: description !== undefined ? description : flag.description,
      isEnabled: isEnabled !== undefined ? isEnabled : flag.isEnabled,
      enabledForRoles: enabledForRoles !== undefined ? enabledForRoles : flag.enabledForRoles,
      enabledForUsers: enabledForUsers !== undefined ? enabledForUsers : flag.enabledForUsers,
      config: config !== undefined ? config : flag.config,
      updatedBy: userId
    });

    await clearCache();

    res.json({ success: true, flag });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ success: false, message: 'Failed to update feature flag' });
  }
};

// Create a new feature flag (super admin only)
export const createFlag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { key, name, description, category, isEnabled, enabledForRoles, config } = req.body;

    // Check if key already exists
    const existing = await FeatureFlag.findOne({ where: { key } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Feature key already exists' });
    }

    const flag = await FeatureFlag.create({
      key,
      name,
      description,
      category: category || FeatureCategory.CONTENT,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      enabledForRoles,
      config,
      createdBy: userId
    });

    await clearCache();

    res.status(201).json({ success: true, flag });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({ success: false, message: 'Failed to create feature flag' });
  }
};

// Delete a feature flag (super admin only)
export const deleteFlag = async (req: Request, res: Response) => {
  try {
    const { flagId } = req.params;

    const flag = await FeatureFlag.findByPk(flagId);

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    await flag.destroy();
    await clearCache();

    res.json({ success: true, message: 'Feature flag deleted' });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({ success: false, message: 'Failed to delete feature flag' });
  }
};

// Seed default feature flags
export const seedFlags = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    let created = 0;
    let skipped = 0;

    for (const feature of DEFAULT_FEATURES) {
      const existing = await FeatureFlag.findOne({ where: { key: feature.key } });
      if (!existing) {
        await FeatureFlag.create({
          ...feature,
          category: feature.category as FeatureCategory,
          isEnabled: feature.isEnabled !== undefined ? feature.isEnabled : true,
          createdBy: userId
        });
        created++;
      } else {
        skipped++;
      }
    }

    await clearCache();

    res.json({
      success: true,
      message: `Seeded ${created} feature flags, skipped ${skipped} existing`,
      created,
      skipped
    });
  } catch (error) {
    console.error('Error seeding feature flags:', error);
    res.status(500).json({ success: false, message: 'Failed to seed feature flags' });
  }
};

// Bulk toggle multiple features (admin only)
export const bulkToggle = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { flagIds, isEnabled } = req.body;

    if (!Array.isArray(flagIds) || flagIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No flag IDs provided' });
    }

    await FeatureFlag.update(
      { isEnabled, updatedBy: userId },
      { where: { id: flagIds } }
    );

    await clearCache();

    res.json({
      success: true,
      message: `${flagIds.length} features ${isEnabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error bulk toggling features:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk toggle features' });
  }
};

// Get feature flag statistics
export const getStats = async (req: Request, res: Response) => {
  try {
    const total = await FeatureFlag.count();
    const enabled = await FeatureFlag.count({ where: { isEnabled: true } });
    const disabled = await FeatureFlag.count({ where: { isEnabled: false } });

    const byCategory = await FeatureFlag.findAll({
      attributes: [
        'category',
        [FeatureFlag.sequelize!.fn('COUNT', '*'), 'count'],
        [FeatureFlag.sequelize!.fn('SUM', FeatureFlag.sequelize!.literal('CASE WHEN is_enabled THEN 1 ELSE 0 END')), 'enabledCount']
      ],
      group: ['category']
    });

    res.json({
      success: true,
      stats: {
        total,
        enabled,
        disabled,
        byCategory
      }
    });
  } catch (error) {
    console.error('Error fetching feature stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
