import Bull from 'bull';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Video processing queue
export const videoQueue = new Bull('video-processing', redisUrl, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// AI analysis queue
export const aiQueue = new Bull('ai-analysis', redisUrl, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000
    }
  }
});

// Email notification queue
export const emailQueue = new Bull('email-notifications', redisUrl, {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3
  }
});

// Trending score calculation queue
export const trendingQueue = new Bull('trending-calculation', redisUrl, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5
  }
});

// Queue event handlers
videoQueue.on('error', (error) => {
  logger.error('Video queue error:', error);
});

videoQueue.on('failed', (job, error) => {
  logger.error(`Video job ${job.id} failed:`, { error: error.message, data: job.data });
});

videoQueue.on('completed', (job, result) => {
  logger.info(`Video job ${job.id} completed:`, { data: job.data, result });
});

aiQueue.on('error', (error) => {
  logger.error('AI queue error:', error);
});

aiQueue.on('failed', (job, error) => {
  logger.error(`AI job ${job.id} failed:`, { error: error.message, data: job.data });
});

emailQueue.on('error', (error) => {
  logger.error('Email queue error:', error);
});

// Schedule recurring jobs
export const scheduleRecurringJobs = async () => {
  // Calculate trending scores every hour
  await trendingQueue.add('calculate', {}, {
    repeat: {
      cron: '0 * * * *' // Every hour
    }
  });

  logger.info('Recurring jobs scheduled');
};

export default {
  videoQueue,
  aiQueue,
  emailQueue,
  trendingQueue,
  scheduleRecurringJobs
};
