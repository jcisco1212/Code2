/**
 * Scam Detection Service
 *
 * AI-powered detection of potential scammer agents
 * Analyzes messages, behavior patterns, and profile data
 */

import { Op } from 'sequelize';

// Red flag patterns in messages
const SCAM_PHRASES = [
  // Payment requests
  'pay.*upfront',
  'registration fee',
  'processing fee',
  'portfolio fee',
  'website fee',
  'send.*money',
  'wire transfer',
  'western union',
  'cash.*app',
  'venmo.*payment',
  'crypto.*payment',
  'bitcoin',

  // Pressure tactics
  'act now',
  'limited time',
  'offer expires',
  'don\'t miss',
  'once in a lifetime',
  'guaranteed.*role',
  'guaranteed.*work',
  'guaranteed.*success',

  // Inappropriate requests
  'private.*photos',
  'lingerie.*shoot',
  'private.*meeting',
  'hotel.*room',
  'my.*apartment',
  'come.*alone',
  'don\'t tell',
  'keep.*secret',

  // Vague/suspicious
  'big.*project',
  'major.*studio',
  'can\'t.*disclose',
  'confidential.*project',
  'nda.*first',

  // Common scam patterns
  'you\'ve been selected',
  'you won',
  'congratulations.*chosen',
  'special.*opportunity',
];

// Legitimate agent behaviors
const LEGITIMATE_PATTERNS = [
  'audition',
  'callback',
  'sides',
  'script',
  'self-tape',
  'breakdown',
  'casting director',
  'submission',
  'headshot',
  'resume',
  'reel',
  'representation',
  'commission',
  'contract',
  'sag-aftra',
  'union',
];

interface ScamAnalysisResult {
  isScam: boolean;
  confidence: number; // 0-100
  redFlags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

interface BehaviorMetrics {
  messagesPerDay: number;
  uniqueRecipients: number;
  responseRate: number;
  averageFirstMessageLength: number;
  identicalMessageCount: number;
  profileViewsPerMessage: number;
  ageOfTargets: { min: number; max: number; avg: number };
  targetExperienceLevel: 'new' | 'mixed' | 'experienced';
}

class ScamDetectionService {

  /**
   * Analyze a message for scam indicators
   */
  analyzeMessage(message: string, senderProfile: any): ScamAnalysisResult {
    const redFlags: string[] = [];
    let scamScore = 0;

    const lowerMessage = message.toLowerCase();

    // Check for scam phrases
    for (const pattern of SCAM_PHRASES) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(lowerMessage)) {
        redFlags.push(`Suspicious phrase detected: "${pattern}"`);
        scamScore += 15;
      }
    }

    // Check for legitimate patterns (reduces score)
    let legitimateCount = 0;
    for (const pattern of LEGITIMATE_PATTERNS) {
      if (lowerMessage.includes(pattern)) {
        legitimateCount++;
      }
    }
    scamScore -= legitimateCount * 5;

    // Check message characteristics

    // Very short first message with link
    if (message.length < 100 && message.includes('http')) {
      redFlags.push('Short message with external link');
      scamScore += 10;
    }

    // All caps (yelling/urgency)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5 && message.length > 20) {
      redFlags.push('Excessive capitalization (urgency tactic)');
      scamScore += 5;
    }

    // Money symbols
    if (/\$\d+/.test(message)) {
      redFlags.push('Contains specific dollar amounts');
      scamScore += 10;
    }

    // Personal email in message (avoiding platform)
    if (/[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.[a-zA-Z]{2,}/.test(message)) {
      redFlags.push('Personal email in message (trying to communicate off-platform)');
      scamScore += 20;
    }

    // Phone number in first message
    if (/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(message)) {
      redFlags.push('Phone number in message');
      scamScore += 10;
    }

    // WhatsApp/Telegram mention
    if (/whatsapp|telegram|signal/i.test(message)) {
      redFlags.push('Requesting communication on external messaging app');
      scamScore += 15;
    }

    // Check sender profile
    if (senderProfile) {
      // New account
      const accountAgeDays = (Date.now() - new Date(senderProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < 7) {
        redFlags.push('Very new account (less than 7 days)');
        scamScore += 10;
      }

      // No verification
      if (!senderProfile.verification || senderProfile.verification.status === 'pending') {
        redFlags.push('Unverified agent account');
        scamScore += 15;
      }

      // Generic profile photo
      if (!senderProfile.avatarUrl) {
        redFlags.push('No profile photo');
        scamScore += 5;
      }

      // Free email domain for agency
      if (senderProfile.verification?.agencyEmail?.match(/@(gmail|yahoo|hotmail|outlook)\./i)) {
        redFlags.push('Using personal email for agency business');
        scamScore += 10;
      }
    }

    // Calculate final score and risk level
    scamScore = Math.max(0, Math.min(100, scamScore));

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: string;

    if (scamScore >= 70) {
      riskLevel = 'critical';
      recommendation = 'This message has multiple scam indicators. We recommend not responding and reporting this user.';
    } else if (scamScore >= 50) {
      riskLevel = 'high';
      recommendation = 'This message shows concerning patterns. Verify the sender\'s credentials before engaging.';
    } else if (scamScore >= 30) {
      riskLevel = 'medium';
      recommendation = 'Some caution advised. Ask for verification of agency credentials.';
    } else {
      riskLevel = 'low';
      recommendation = 'No major red flags detected, but always verify agent credentials.';
    }

    return {
      isScam: scamScore >= 50,
      confidence: scamScore,
      redFlags,
      riskLevel,
      recommendation,
    };
  }

  /**
   * Analyze agent behavior patterns over time
   */
  async analyzeBehavior(agentId: string, db: any): Promise<BehaviorMetrics & { suspiciousPatterns: string[] }> {
    const suspiciousPatterns: string[] = [];

    // Get message statistics
    const messageStats = await db.Message.findAll({
      where: { senderId: agentId },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalMessages'],
        [db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('recipientId'))), 'uniqueRecipients'],
      ],
      raw: true,
    });

    // Get account age
    const agent = await db.User.findByPk(agentId);
    const accountAgeDays = (Date.now() - new Date(agent.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    const messagesPerDay = messageStats[0].totalMessages / Math.max(accountAgeDays, 1);
    const uniqueRecipients = messageStats[0].uniqueRecipients;

    // Check for mass messaging
    if (messagesPerDay > 20) {
      suspiciousPatterns.push('Sending unusually high volume of messages');
    }

    // Check for copy-paste messages
    const recentMessages = await db.Message.findAll({
      where: { senderId: agentId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const messageContents = recentMessages.map((m: any) => m.content);
    const identicalMessages = this.findIdenticalMessages(messageContents);

    if (identicalMessages > 5) {
      suspiciousPatterns.push(`Sending identical messages to multiple users (${identicalMessages} identical)`);
    }

    // Check target demographics
    const targetUsers = await db.Message.findAll({
      where: { senderId: agentId },
      include: [{
        model: db.User,
        as: 'recipient',
        attributes: ['id', 'createdAt'],
      }],
    });

    // Check if targeting new users
    const newUserTargets = targetUsers.filter((m: any) => {
      const recipientAge = (Date.now() - new Date(m.recipient.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return recipientAge < 30;
    });

    if (newUserTargets.length / targetUsers.length > 0.7) {
      suspiciousPatterns.push('Primarily targeting new/inexperienced users');
    }

    // Check response rate (scammers often have low response rates)
    const conversations = await db.Message.findAll({
      where: {
        [Op.or]: [
          { senderId: agentId },
          { recipientId: agentId },
        ],
      },
    });

    const sentByAgent = conversations.filter((m: any) => m.senderId === agentId).length;
    const receivedByAgent = conversations.filter((m: any) => m.recipientId === agentId).length;
    const responseRate = receivedByAgent / Math.max(sentByAgent, 1);

    if (responseRate < 0.1 && sentByAgent > 20) {
      suspiciousPatterns.push('Very low response rate despite high message volume');
    }

    // Check for reports against this agent
    const reports = await db.Report.count({
      where: { userId: agentId, status: { [Op.ne]: 'dismissed' } },
    });

    if (reports >= 3) {
      suspiciousPatterns.push(`Multiple user reports filed (${reports} reports)`);
    }

    return {
      messagesPerDay,
      uniqueRecipients,
      responseRate,
      averageFirstMessageLength: this.calculateAverageLength(messageContents),
      identicalMessageCount: identicalMessages,
      profileViewsPerMessage: 0, // Would need profile view tracking
      ageOfTargets: { min: 0, max: 0, avg: 0 }, // Would calculate from user data
      targetExperienceLevel: 'mixed',
      suspiciousPatterns,
    };
  }

  /**
   * Find number of identical or near-identical messages
   */
  private findIdenticalMessages(messages: string[]): number {
    const normalized = messages.map(m => m.toLowerCase().replace(/\s+/g, ' ').trim());
    const counts = new Map<string, number>();

    for (const msg of normalized) {
      counts.set(msg, (counts.get(msg) || 0) + 1);
    }

    let duplicates = 0;
    for (const count of counts.values()) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }

    return duplicates;
  }

  /**
   * Calculate average message length
   */
  private calculateAverageLength(messages: string[]): number {
    if (messages.length === 0) return 0;
    const total = messages.reduce((sum, m) => sum + m.length, 0);
    return total / messages.length;
  }

  /**
   * Generate safety tips for talent based on message analysis
   */
  getSafetyTips(analysis: ScamAnalysisResult): string[] {
    const tips = [
      'Legitimate agents NEVER ask for money upfront',
      'Always verify an agent\'s credentials before meeting',
      'Look for agents on official agency websites',
      'Check if they\'re SAG-AFTRA franchised',
      'Never meet alone at non-office locations',
      'Trust your instincts - if something feels wrong, it probably is',
    ];

    if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
      tips.unshift('⚠️ WARNING: This message has significant red flags');
      tips.push('Report this user if you believe they are a scammer');
    }

    return tips;
  }
}

export default new ScamDetectionService();
