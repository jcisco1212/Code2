import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Report, ReportType, ReportTarget, Video, Comment, User } from '../models';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Create report
router.post(
  '/',
  authenticate as RequestHandler,
  validate([
    body('targetId').isUUID().withMessage('Valid target ID required'),
    body('targetType').isIn(Object.values(ReportTarget)).withMessage('Invalid target type'),
    body('type').isIn(Object.values(ReportType)).withMessage('Invalid report type'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 chars')
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetId, targetType, type, description } = req.body;

      // Verify target exists
      let target;
      switch (targetType) {
        case ReportTarget.VIDEO:
          target = await Video.findByPk(targetId);
          break;
        case ReportTarget.COMMENT:
          target = await Comment.findByPk(targetId);
          break;
        case ReportTarget.USER:
          target = await User.findByPk(targetId);
          break;
      }

      if (!target) {
        throw new NotFoundError(`${targetType} not found`);
      }

      // Check for duplicate report
      const existingReport = await Report.findOne({
        where: {
          reporterId: req.userId,
          targetId,
          targetType,
          status: 'pending'
        }
      });

      if (existingReport) {
        throw new BadRequestError('You have already reported this content');
      }

      const report = await Report.create({
        reporterId: req.userId!,
        targetId,
        targetType,
        type,
        description
      });

      res.status(201).json({
        message: 'Report submitted successfully',
        report
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's reports
router.get('/my-reports', authenticate as RequestHandler, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Report.findAndCountAll({
      where: { reporterId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      reports: rows,
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
});

export default router;
