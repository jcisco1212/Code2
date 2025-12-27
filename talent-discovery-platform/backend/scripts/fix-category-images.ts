/**
 * Script to fix category images by restoring backups and keeping original extensions
 * Run with: npm run fix-categories
 */

import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

const CATEGORIES_DIR = path.join(__dirname, '../uploads/categories');

async function fixCategoryImages() {
  console.log('🔧 Fixing category images...\n');

  if (!fs.existsSync(CATEGORIES_DIR)) {
    console.log('❌ Categories directory not found:', CATEGORIES_DIR);
    return;
  }

  const files = fs.readdirSync(CATEGORIES_DIR);

  // First, restore all backups
  console.log('📦 Step 1: Restoring backups...\n');
  const backupFiles = files.filter(f => f.includes('_backup'));

  for (const backup of backupFiles) {
    const originalName = backup.replace('_backup', '');
    const backupPath = path.join(CATEGORIES_DIR, backup);
    const originalPath = path.join(CATEGORIES_DIR, originalName);

    // Remove any existing file with that base name
    const baseName = path.basename(originalName, path.extname(originalName));
    const existingFiles = files.filter(f =>
      f.startsWith(baseName) &&
      !f.includes('_backup') &&
      !f.includes('_temp')
    );

    for (const existing of existingFiles) {
      const existingPath = path.join(CATEGORIES_DIR, existing);
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
        console.log(`  Removed: ${existing}`);
      }
    }

    // Restore backup
    fs.copyFileSync(backupPath, originalPath);
    console.log(`  Restored: ${backup} → ${originalName}`);
  }

  // Now resize all images while keeping their original extension
  console.log('\n🖼️  Step 2: Resizing images (keeping original names)...\n');

  const updatedFiles = fs.readdirSync(CATEGORIES_DIR);
  const imageFiles = updatedFiles.filter(f =>
    /\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)$/i.test(f) &&
    !f.includes('_backup') &&
    !f.includes('_temp') &&
    !f.includes('_optimized')
  );

  let success = 0;
  let failed = 0;

  for (const filename of imageFiles) {
    process.stdout.write(`  Processing ${filename}... `);

    try {
      const imagePath = path.join(CATEGORIES_DIR, filename);
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const tempPath = path.join(CATEGORIES_DIR, `${baseName}_temp${ext}`);

      // Resize to 5:3 aspect ratio
      await sharp(imagePath)
        .resize(500, 300, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(tempPath);

      // Replace original with resized version (keep same name!)
      fs.unlinkSync(imagePath);
      fs.renameSync(tempPath, imagePath);

      process.stdout.write('✅\n');
      success++;
    } catch (err) {
      process.stdout.write(`❌ ${err instanceof Error ? err.message : 'Error'}\n`);
      failed++;
    }
  }

  // Clean up backup files
  console.log('\n🧹 Step 3: Cleaning up backups...\n');
  for (const backup of backupFiles) {
    const backupPath = path.join(CATEGORIES_DIR, backup);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log(`  Removed: ${backup}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Resized: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('\n✨ Done! Images should now display correctly.');
}

fixCategoryImages();
