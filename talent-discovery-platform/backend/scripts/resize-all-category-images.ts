/**
 * Script to resize ALL category images in the uploads folder
 * Run with: npm run resize-all-categories
 */

import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

const CATEGORIES_DIR = path.join(__dirname, '../uploads/categories');

async function resizeAllCategoryImages() {
  console.log('🖼️  Resizing ALL category images...\n');

  if (!fs.existsSync(CATEGORIES_DIR)) {
    console.log('❌ Categories directory not found:', CATEGORIES_DIR);
    return;
  }

  const files = fs.readdirSync(CATEGORIES_DIR);
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f) &&
    !f.includes('_backup') &&
    !f.includes('_temp')
  );

  console.log(`📁 Found ${imageFiles.length} images to process\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const filename of imageFiles) {
    process.stdout.write(`Processing ${filename}... `);

    try {
      const imagePath = path.join(CATEGORIES_DIR, filename);
      const stats = fs.statSync(imagePath);

      // Check if already small enough (under 50KB and likely already processed)
      if (stats.size < 50000) {
        // Verify dimensions
        const metadata = await sharp(imagePath).metadata();
        if (metadata.width === 400 && metadata.height === 240) {
          process.stdout.write('⏭️  Already correct size\n');
          skipped++;
          continue;
        }
      }

      // Create backup if doesn't exist
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const backupPath = path.join(CATEGORIES_DIR, `${baseName}_backup${ext}`);

      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(imagePath, backupPath);
      }

      // Resize image
      const tempPath = path.join(CATEGORIES_DIR, `${baseName}_temp.jpg`);

      await sharp(imagePath)
        .resize(400, 240, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(tempPath);

      // Replace original
      fs.unlinkSync(imagePath);

      // Keep same extension for simplicity
      const newPath = path.join(CATEGORIES_DIR, `${baseName}.jpg`);
      fs.renameSync(tempPath, newPath);

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
  console.log(`   📁 Total: ${imageFiles.length}`);
}

resizeAllCategoryImages();
