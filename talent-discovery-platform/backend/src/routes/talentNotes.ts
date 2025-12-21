import { Router, Request, Response } from 'express';
import { authenticate, requireAgent } from '../middleware/auth';
import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Define TalentNote model inline for this route
const TalentNote = sequelize.define('TalentNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  talentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'talent_notes',
  timestamps: true
});

// Get notes (all or for a specific talent)
router.get('/', authenticate, requireAgent, async (req: Request, res: Response) => {
  try {
    const { talentId } = req.query;
    const agentId = req.user!.id;

    const where: any = { agentId };
    if (talentId) {
      where.talentId = talentId;
    }

    const notes = await TalentNote.findAll({
      where,
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
      include: [{
        model: sequelize.models.User,
        as: 'talent',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }]
    });

    res.json({ notes });
  } catch (error) {
    logger.error('Error fetching talent notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create a note
router.post('/', authenticate, requireAgent, async (req: Request, res: Response) => {
  try {
    const { talentId, content } = req.body;
    const agentId = req.user!.id;

    if (!talentId || !content) {
      return res.status(400).json({ error: 'Talent ID and content are required' });
    }

    const note = await TalentNote.create({
      agentId,
      talentId,
      content
    });

    // Fetch with talent info
    const noteWithTalent = await TalentNote.findByPk(note.get('id'), {
      include: [{
        model: sequelize.models.User,
        as: 'talent',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }]
    });

    res.status(201).json({ note: noteWithTalent });
  } catch (error) {
    logger.error('Error creating talent note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:noteId', authenticate, requireAgent, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { content, isPinned } = req.body;
    const agentId = req.user!.id;

    const note = await TalentNote.findOne({
      where: { id: noteId, agentId }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (isPinned !== undefined) updates.isPinned = isPinned;

    await note.update(updates);

    const updatedNote = await TalentNote.findByPk(noteId, {
      include: [{
        model: sequelize.models.User,
        as: 'talent',
        attributes: ['id', 'username', 'displayName', 'avatarUrl']
      }]
    });

    res.json({ note: updatedNote });
  } catch (error) {
    logger.error('Error updating talent note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:noteId', authenticate, requireAgent, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const agentId = req.user!.id;

    const note = await TalentNote.findOne({
      where: { id: noteId, agentId }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await note.destroy();

    res.json({ message: 'Note deleted' });
  } catch (error) {
    logger.error('Error deleting talent note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Set up association
TalentNote.belongsTo(sequelize.models.User, { as: 'talent', foreignKey: 'talentId' });

export default router;
