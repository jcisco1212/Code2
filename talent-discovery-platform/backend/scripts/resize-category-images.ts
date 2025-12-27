/**
 * Script to resize existing category images to proper dimensions (400x240)
 * Run with: npm run resize-categories
 */

import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Parse DATABASE_URL or use individual variables
function getSequelizeConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      dialect: 'postgres' as const,
      url: databaseUrl,
      logging: false,
    };
  }

  return {
    dialect: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'talent_platform',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    logging: false,
  };
}

const config = getSequelizeConfig();
const sequelize = 'url' in config && config.url
  ? new Sequelize(config.url, { dialect: 'postgres', logging: false })
  : new Sequelize(config);

const UPLOADS_DIR = path.join(__dirname, '../uploads');

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
}

async function resizeCategoryImages() {
  console.log('🖼️  Starting category image resize...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all categories with images
    const [categories] = await sequelize.query(`
      SELECT id, name, slug, icon_url
      FROM categories
      WHERE icon_url IS NOT NULL
      ORDER BY name ASC
    `) as [CategoryRecord[], unknown];

    console.log(`📁 Found ${categories.length} categories with images\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const category of categories) {
      process.stdout.write(`Processing "${category.name}"... `);

      try {
        if (!category.icon_url) {
          process.stdout.write('⏭️  No image\n');
          skipped++;
          continue;
        }

        // Get image path
        const imagePath = path.join(UPLOADS_DIR, category.icon_url.replace('/uploads/', ''));

        if (!fs.existsSync(imagePath)) {
          process.stdout.write('⚠️  Image file not found\n');
          skipped++;
          continue;
        }

        // Create backup
        const backupPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_backup.$1');
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(imagePath, backupPath);
        }

        // Resize image
        const tempPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_temp.jpg');

        await sharp(imagePath)
          .resize(400, 240, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85, progressive: true })
          .toFile(tempPath);

        // Replace original with resized version
        fs.unlinkSync(imagePath);
        fs.renameSync(tempPath, imagePath.replace(/\.(png|webp)$/i, '.jpg'));

        // Update database if extension changed
        const oldExt = path.extname(category.icon_url).toLowerCase();
        if (oldExt !== '.jpg' && oldExt !== '.jpeg') {
          const newUrl = category.icon_url.replace(/\.(png|webp)$/i, '.jpg');
          await sequelize.query(`
            UPDATE categories
            SET icon_url = :newUrl
            WHERE id = :id
          `, {
            replacements: { newUrl, id: category.id }
          });
        }

        process.stdout.write('✅ Done\n');
        success++;
      } catch (err) {
        process.stdout.write(`❌ Error: ${err instanceof Error ? err.message : 'Unknown'}\n`);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Resized: ${success}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${categories.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await sequelize.close();
  }
}

resizeCategoryImages();
