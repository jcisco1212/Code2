import dotenv from 'dotenv';
dotenv.config();

import { videoQueue, aiQueue, emailQueue, trendingQueue, scheduleRecurringJobs } from '../jobs/videoQueue';
import { processVideo, cleanupVideo } from './videoProcessor';
import { analyzeVideo, analyzeComment } from './aiAnalyzer';
import { calculateTrendingScores } from './trendingCalculator';
import { sendEmailNotification } from './emailNotifier';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';

// Video processing jobs
videoQueue.process('process', 2, async (job) => {
  logger.info(`Processing video job ${job.id}:`, job.data);
  return processVideo(job.data);
});

videoQueue.process('cleanup', 1, async (job) => {
  logger.info(`Cleanup job ${job.id}:`, job.data);
  return cleanupVideo(job.data);
});

// AI analysis jobs
aiQueue.process('videoAnalysis', 1, async (job) => {
  logger.info(`AI video analysis job ${job.id}:`, job.data);
  return analyzeVideo(job.data);
});

aiQueue.process('commentAnalysis', 3, async (job) => {
  logger.info(`AI comment analysis job ${job.id}:`, job.data);
  return analyzeComment(job.data);
});

// Email notification jobs
emailQueue.process('send', 5, async (job) => {
  logger.info(`Email job ${job.id}:`, job.data);
  return sendEmailNotification(job.data);
});

// Trending calculation jobs
trendingQueue.process('calculate', 1, async (job) => {
  logger.info(`Trending calculation job ${job.id}`);
  return calculateTrendingScores();
});

// Start workers
async function startWorkers() {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected');

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    logger.info('Workers started successfully');
    logger.info('Listening for jobs...');
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers');
  await videoQueue.close();
  await aiQueue.close();
  await emailQueue.close();
  await trendingQueue.close();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down workers');
  await videoQueue.close();
  await aiQueue.close();
  await emailQueue.close();
  await trendingQueue.close();
  await sequelize.close();
  process.exit(0);
});

startWorkers();
