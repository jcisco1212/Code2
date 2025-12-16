import { Router, Request, Response, RequestHandler } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAgent, requireAdmin } from '../middleware/auth';

// Cast middleware to RequestHandler to fix TypeScript conflicts
const auth = authenticate as RequestHandler;
const agentRequired = requireAgent as RequestHandler;
const adminRequired = requireAdmin as RequestHandler;
import AgentVerification, { VerificationStatus, DocumentType } from '../models/AgentVerification';
import User from '../models/User';
import scamDetectionService from '../services/scamDetectionService';

const router = Router();

/**
 * Submit agent verification application
 * POST /api/verification/apply
 */
router.post(
  '/apply',
  auth,
  agentRequired,
  [
    body('agencyName').notEmpty().trim(),
    body('agencyEmail').isEmail(),
    body('agencyPhone').notEmpty(),
    body('agencyAddress').notEmpty(),
    body('jobTitle').notEmpty(),
    body('yearsInIndustry').isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;

      // Check if already has application
      const existing = await AgentVerification.findOne({ where: { userId } });
      if (existing) {
        return res.status(400).json({
          error: 'Verification application already exists',
          status: existing.status
        });
      }

      const verification = await AgentVerification.create({
        userId,
        agencyName: req.body.agencyName,
        agencyWebsite: req.body.agencyWebsite || null,
        agencyEmail: req.body.agencyEmail,
        agencyPhone: req.body.agencyPhone,
        agencyAddress: req.body.agencyAddress,
        jobTitle: req.body.jobTitle,
        yearsInIndustry: req.body.yearsInIndustry,
        stateLicenseNumber: req.body.stateLicenseNumber || null,
        stateLicenseState: req.body.stateLicenseState || null,
        sagAftraFranchised: req.body.sagAftraFranchised || false,
        imdbProLink: req.body.imdbProLink || null,
        linkedinUrl: req.body.linkedinUrl || null,
      });

      res.status(201).json({
        message: 'Verification application submitted',
        verification: {
          id: verification.id,
          status: verification.status,
          agencyName: verification.agencyName,
        },
      });
    } catch (error) {
      console.error('Verification apply error:', error);
      res.status(500).json({ error: 'Failed to submit verification application' });
    }
  }
);

/**
 * Get verification status
 * GET /api/verification/status
 */
router.get('/status', auth, agentRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const verification = await AgentVerification.findOne({ where: { userId } });

    if (!verification) {
      return res.status(404).json({ error: 'No verification application found' });
    }

    res.json({
      status: verification.status,
      verificationLevel: verification.verificationLevel,
      badgeLevel: verification.getBadgeLevel(),
      canContactTalent: verification.canContactTalent(),
      trustScore: verification.calculateTrustScore(),
      documentsVerified: verification.documentsVerified,
      stateLicenseVerified: verification.stateLicenseVerified,
      sagAftraVerified: verification.sagAftraVerified,
      imdbVerified: verification.imdbVerified,
      linkedinVerified: verification.linkedinVerified,
      redFlagCount: verification.redFlagCount,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

/**
 * Upload verification document
 * POST /api/verification/document
 */
router.post(
  '/document',
  auth,
  agentRequired,
  [
    body('documentType').isIn(Object.values(DocumentType)),
    body('documentUrl').isURL(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user.id;
      const verification = await AgentVerification.findOne({ where: { userId } });

      if (!verification) {
        return res.status(404).json({ error: 'No verification application found' });
      }

      const { documentType } = req.body;

      // Add to submitted documents
      if (!verification.documentsSubmitted.includes(documentType)) {
        verification.documentsSubmitted = [...verification.documentsSubmitted, documentType];
        await verification.save();
      }

      res.json({
        message: 'Document uploaded successfully',
        documentsSubmitted: verification.documentsSubmitted,
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

/**
 * Admin: Review verification application
 * POST /api/verification/:id/review
 */
router.post(
  '/:id/review',
  auth,
  adminRequired,
  [
    body('status').isIn([VerificationStatus.BASIC, VerificationStatus.VERIFIED,
                         VerificationStatus.PREMIUM, VerificationStatus.REJECTED]),
    body('rejectionReason').optional(),
    body('notes').optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const verification = await AgentVerification.findByPk(req.params.id);

      if (!verification) {
        return res.status(404).json({ error: 'Verification not found' });
      }

      verification.status = req.body.status;
      verification.verifiedBy = (req as any).user.id;
      verification.verifiedAt = new Date();

      if (req.body.status === VerificationStatus.REJECTED) {
        verification.rejectionReason = req.body.rejectionReason;
      }

      if (req.body.notes) {
        verification.notes = req.body.notes;
      }

      // Update verification level based on status
      if (req.body.status === VerificationStatus.PREMIUM) {
        verification.verificationLevel = 100;
      } else if (req.body.status === VerificationStatus.VERIFIED) {
        verification.verificationLevel = 75;
      } else if (req.body.status === VerificationStatus.BASIC) {
        verification.verificationLevel = 50;
      }

      await verification.save();

      res.json({
        message: 'Verification reviewed',
        status: verification.status,
      });
    } catch (error) {
      console.error('Review verification error:', error);
      res.status(500).json({ error: 'Failed to review verification' });
    }
  }
);

/**
 * Admin: Get pending verifications
 * GET /api/verification/pending
 */
router.get('/pending', auth, adminRequired, async (req: Request, res: Response) => {
  try {
    const verifications = await AgentVerification.findAll({
      where: { status: VerificationStatus.PENDING },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'username', 'displayName', 'createdAt'],
      }],
      order: [['createdAt', 'ASC']],
    });

    res.json({ verifications });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

/**
 * Report suspicious agent
 * POST /api/verification/report
 */
router.post(
  '/report',
  auth,
  [
    body('agentId').isUUID(),
    body('reason').notEmpty(),
    body('description').optional(),
    body('messageId').optional().isUUID(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { agentId, reason, description, messageId } = req.body;
      const reporterId = (req as any).user.id;

      // Update agent's red flag count
      const verification = await AgentVerification.findOne({
        where: { userId: agentId }
      });

      if (verification) {
        verification.redFlagCount += 1;
        verification.redFlagReasons = [
          ...verification.redFlagReasons,
          `${new Date().toISOString()}: ${reason}`,
        ];

        // Auto-suspend if too many red flags
        if (verification.redFlagCount >= 5) {
          verification.status = VerificationStatus.SUSPENDED;
        }

        await verification.save();
      }

      // Create report record (using existing Report model)
      // ... report creation logic

      res.json({
        message: 'Report submitted successfully',
        action: verification && verification.redFlagCount >= 5
          ? 'Agent has been suspended pending review'
          : 'Report will be reviewed by our team',
      });
    } catch (error) {
      console.error('Report agent error:', error);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  }
);

/**
 * Analyze message for scam indicators (called automatically)
 * POST /api/verification/analyze-message
 */
router.post(
  '/analyze-message',
  auth,
  [body('message').notEmpty(), body('senderId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const { message, senderId } = req.body;

      // Get sender profile with verification
      const sender = await User.findByPk(senderId, {
        include: [{
          model: AgentVerification,
          as: 'verification',
        }],
      });

      const analysis = scamDetectionService.analyzeMessage(message, sender);
      const safetyTips = scamDetectionService.getSafetyTips(analysis);

      res.json({
        analysis,
        safetyTips,
        senderVerification: sender?.verification ? {
          status: sender.verification.status,
          badgeLevel: sender.verification.getBadgeLevel(),
          trustScore: sender.verification.calculateTrustScore(),
        } : null,
      });
    } catch (error) {
      console.error('Analyze message error:', error);
      res.status(500).json({ error: 'Failed to analyze message' });
    }
  }
);

/**
 * Get agent public verification info (for talent to view)
 * GET /api/verification/agent/:id
 */
router.get('/agent/:id', auth, async (req: Request, res: Response) => {
  try {
    const verification = await AgentVerification.findOne({
      where: { userId: req.params.id },
    });

    if (!verification) {
      return res.json({ verified: false, message: 'Agent not verified' });
    }

    res.json({
      verified: verification.status === VerificationStatus.VERIFIED ||
                verification.status === VerificationStatus.PREMIUM,
      badgeLevel: verification.getBadgeLevel(),
      trustScore: verification.calculateTrustScore(),
      agencyName: verification.agencyName,
      agencyWebsite: verification.agencyWebsite,
      yearsInIndustry: verification.yearsInIndustry,
      stateLicenseVerified: verification.stateLicenseVerified,
      sagAftraVerified: verification.sagAftraVerified,
      imdbVerified: verification.imdbVerified,
      averageRating: verification.averageRating,
      totalReviews: verification.totalReviews,
      successfulPlacements: verification.successfulPlacements,
      memberSince: verification.createdAt,
    });
  } catch (error) {
    console.error('Get agent verification error:', error);
    res.status(500).json({ error: 'Failed to get agent verification' });
  }
});

export default router;
