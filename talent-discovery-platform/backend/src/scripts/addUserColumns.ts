/**
 * Migration script to add missing columns to the users table
 * Run with: npm run db:add-user-columns
 */

import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

async function addUserColumns() {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Connected successfully.');

    logger.info('Adding missing columns to users table...');

    const queries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT NULL`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        logger.info(`Executed: ${query.substring(0, 60)}...`);
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          logger.error(`Error executing query: ${err.message}`);
        }
      }
    }

    logger.info('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

addUserColumns();
