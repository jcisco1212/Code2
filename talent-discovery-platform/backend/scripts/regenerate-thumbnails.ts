/**
 * Script to regenerate thumbnails for all existing videos
 *
 * Usage: npx ts-node scripts/regenerate-thumbnails.ts
 *
 * This will:
 * 1. Find all videos with existing video files
 * 2. Regenerate high-quality thumbnails using sharp
 * 3. Update the database with new thumbnail URLs
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { execSync } from 'child_process';

// Database connection
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/talentvault', {
  logging: false
});

// Check for ffmpeg
let ffmpegPath = 'ffmpeg';
const possiblePaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg', 'ffmpeg'];

for (const testPath of possiblePaths) {
  try {
    execSync(`${testPath} -version`, { stdio: 'ignore' });
    ffmpegPath = testPath;
    break;
  } catch {
    // Try next
  }
}

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffmpegPath.replace('ffmpeg', 'ffprobe'));

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

interface VideoRecord {
  id: string;
  user_id: string;
  title: string;
  hls_url: string | null;
  s3_key: string | null;
  thumbnail_url: string | null;
  duration: number | null;
}

async function generateThumbnail(videoPath: string, outputPath: string, timeSeconds: number = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempPath = outputPath.replace('.jpg', '_temp.png');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Capture at native resolution (don't force size - prevents stretching)
    ffmpeg(videoPath)
      .on('end', async () => {
        try {
          // Post-process with sharp - crop to 16:9 without stretching
          await sharp(tempPath)
            .resize(1280, 720, {
              fit: 'cover',      // Crop to fill, don't stretch
              position: 'center'
            })
            .jpeg({ quality: 90, progressive: true })
            .toFile(outputPath);

          // Remove temp file
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          resolve();
        } catch (sharpError) {
          // If sharp fails, try to convert temp file directly
          if (fs.existsSync(tempPath)) {
            try {
              await sharp(tempPath)
                .jpeg({ quality: 85 })
                .toFile(outputPath);
              fs.unlinkSync(tempPath);
            } catch {
              fs.renameSync(tempPath, outputPath.replace('.jpg', '.png'));
            }
          }
          resolve();
        }
      })
      .on('error', (err: Error) => reject(err))
      .screenshots({
        timestamps: [timeSeconds],
        filename: path.basename(tempPath),
        folder: outputDir
        // No size specified - captures at native video resolution
      });
  });
}

async function getVideoPath(video: VideoRecord): Promise<string | null> {
  // Check for local video file
  const possiblePaths = [
    // Transcoded MP4
    path.join(UPLOADS_DIR, 'videos', video.user_id, video.id, 'transcoded.mp4'),
    // Original upload
    path.join(UPLOADS_DIR, 'videos', video.user_id, video.id, 'original.mp4'),
    // From hls_url
    video.hls_url ? path.join(UPLOADS_DIR, video.hls_url.replace('/uploads/', '')) : null,
    // From s3_key
    video.s3_key ? path.join(UPLOADS_DIR, video.s3_key) : null,
  ];

  for (const videoPath of possiblePaths) {
    if (videoPath && fs.existsSync(videoPath)) {
      return videoPath;
    }
  }

  // Check for any video file in user's directory
  const userVideoDir = path.join(UPLOADS_DIR, 'videos', video.user_id, video.id);
  if (fs.existsSync(userVideoDir)) {
    const files = fs.readdirSync(userVideoDir);
    const videoFile = files.find(f =>
      f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov')
    );
    if (videoFile) {
      return path.join(userVideoDir, videoFile);
    }
  }

  return null;
}

async function regenerateThumbnails() {
  console.log('🎬 Starting thumbnail regeneration...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all videos
    const [videos] = await sequelize.query(`
      SELECT id, user_id, title, hls_url, s3_key, thumbnail_url, duration
      FROM videos
      WHERE status = 'ready'
      ORDER BY created_at DESC
    `) as [VideoRecord[], unknown];

    console.log(`📹 Found ${videos.length} videos to process\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const video of videos) {
      process.stdout.write(`Processing: ${video.title.substring(0, 40).padEnd(40)} `);

      try {
        const videoPath = await getVideoPath(video);

        if (!videoPath) {
          process.stdout.write('⏭️  Skipped (no video file)\n');
          skipped++;
          continue;
        }

        // Create thumbnail directory
        const thumbnailDir = path.join(THUMBNAILS_DIR, video.user_id, video.id);
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailPath = path.join(thumbnailDir, 'thumbnail.jpg');

        // Calculate thumbnail time (25% into video or 1 second)
        const thumbnailTime = Math.max(1, Math.floor((video.duration || 4) * 0.25));

        // Generate new thumbnail
        await generateThumbnail(videoPath, thumbnailPath, thumbnailTime);

        // Update database
        const newThumbnailUrl = `/uploads/thumbnails/${video.user_id}/${video.id}/thumbnail.jpg`;
        await sequelize.query(`
          UPDATE videos
          SET thumbnail_url = :thumbnailUrl
          WHERE id = :id
        `, {
          replacements: { thumbnailUrl: newThumbnailUrl, id: video.id }
        });

        process.stdout.write('✅ Done\n');
        success++;

      } catch (error: any) {
        process.stdout.write(`❌ Failed: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
regenerateThumbnails()
  .then(() => {
    console.log('\n✨ Thumbnail regeneration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
