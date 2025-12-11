/**
 * MediaConvert Stub Server
 *
 * A local development stub that mimics AWS MediaConvert API
 * Uses FFmpeg for actual video transcoding
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const app = express();
app.use(express.json());

// Configure S3 client for MinIO
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Store jobs in memory
const jobs = new Map();

// Create job endpoint
app.post('/2017-08-29/jobs', async (req, res) => {
  const jobId = uuidv4();
  const job = {
    Id: jobId,
    Status: 'SUBMITTED',
    CreatedAt: new Date().toISOString(),
    Settings: req.body.Settings,
    Role: req.body.Role
  };

  jobs.set(jobId, job);

  // Start processing asynchronously
  processJob(jobId, req.body);

  res.status(201).json({
    Job: job
  });
});

// Get job status
app.get('/2017-08-29/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json({ Job: job });
});

// List jobs
app.get('/2017-08-29/jobs', (req, res) => {
  const jobList = Array.from(jobs.values());
  res.json({ Jobs: jobList });
});

// Describe endpoints (required by SDK)
app.post('/2017-08-29/endpoints', (req, res) => {
  res.json({
    Endpoints: [{
      Url: `http://localhost:${process.env.PORT || 8080}`
    }]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

async function processJob(jobId, jobConfig) {
  const job = jobs.get(jobId);
  job.Status = 'PROGRESSING';

  try {
    const input = jobConfig.Settings.Inputs[0];
    const inputPath = input.FileInput;

    // Parse S3 URL
    const s3Match = inputPath.match(/s3:\/\/([^/]+)\/(.+)/);
    if (!s3Match) {
      throw new Error('Invalid S3 input path');
    }

    const [, bucket, key] = s3Match;
    const localInputPath = `/tmp/${jobId}_input`;
    const localOutputDir = `/tmp/${jobId}_output`;

    fs.mkdirSync(localOutputDir, { recursive: true });

    // Download input file from S3/MinIO
    console.log(`Downloading ${inputPath}...`);
    const inputData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    fs.writeFileSync(localInputPath, inputData.Body);

    // Process each output group
    for (const outputGroup of jobConfig.Settings.OutputGroups) {
      if (outputGroup.OutputGroupSettings.Type === 'HLS_GROUP_SETTINGS') {
        await processHLS(localInputPath, localOutputDir, outputGroup, bucket);
      } else if (outputGroup.OutputGroupSettings.Type === 'FILE_GROUP_SETTINGS') {
        await processThumbnails(localInputPath, localOutputDir, outputGroup, bucket);
      }
    }

    // Clean up
    fs.unlinkSync(localInputPath);
    fs.rmSync(localOutputDir, { recursive: true, force: true });

    job.Status = 'COMPLETE';
    job.FinishedAt = new Date().toISOString();
    console.log(`Job ${jobId} completed`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    job.Status = 'ERROR';
    job.ErrorMessage = error.message;
    job.FinishedAt = new Date().toISOString();
  }
}

async function processHLS(inputPath, outputDir, outputGroup, bucket) {
  const destination = outputGroup.OutputGroupSettings.HlsGroupSettings.Destination;
  const destMatch = destination.match(/s3:\/\/([^/]+)\/(.+)/);
  const [, destBucket, destPrefix] = destMatch;

  for (const output of outputGroup.Outputs) {
    const { Width, Height } = output.VideoDescription;
    const modifier = output.NameModifier || `_${Height}p`;
    const outputPath = `${outputDir}/stream${modifier}.m3u8`;

    console.log(`Transcoding to ${Width}x${Height}...`);

    // FFmpeg command for HLS
    const ffmpegCmd = [
      'ffmpeg', '-i', inputPath,
      '-vf', `scale=${Width}:${Height}`,
      '-c:v', 'libx264', '-preset', 'fast',
      '-c:a', 'aac', '-b:a', '128k',
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-hls_segment_filename', `${outputDir}/stream${modifier}_%03d.ts`,
      '-f', 'hls',
      outputPath,
      '-y'
    ];

    execSync(ffmpegCmd.join(' '));

    // Upload manifest
    const manifestContent = fs.readFileSync(outputPath);
    await s3.putObject({
      Bucket: destBucket,
      Key: `${destPrefix}stream${modifier}.m3u8`,
      Body: manifestContent,
      ContentType: 'application/x-mpegURL'
    }).promise();

    // Upload segments
    const segments = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts') && f.includes(modifier));
    for (const segment of segments) {
      const segmentPath = `${outputDir}/${segment}`;
      const segmentContent = fs.readFileSync(segmentPath);
      await s3.putObject({
        Bucket: destBucket,
        Key: `${destPrefix}${segment}`,
        Body: segmentContent,
        ContentType: 'video/MP2T'
      }).promise();
    }
  }

  // Create master playlist
  const masterPlaylist = generateMasterPlaylist(outputGroup.Outputs);
  await s3.putObject({
    Bucket: destBucket,
    Key: `${destPrefix}master.m3u8`,
    Body: masterPlaylist,
    ContentType: 'application/x-mpegURL'
  }).promise();
}

function generateMasterPlaylist(outputs) {
  let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

  for (const output of outputs) {
    const { Width, Height } = output.VideoDescription;
    const modifier = output.NameModifier || `_${Height}p`;
    const bandwidth = getBandwidth(Height);

    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${Width}x${Height}\n`;
    playlist += `stream${modifier}.m3u8\n`;
  }

  return playlist;
}

function getBandwidth(height) {
  const bandwidths = {
    1080: 8000000,
    720: 5000000,
    480: 2500000,
    360: 1000000
  };
  return bandwidths[height] || 2000000;
}

async function processThumbnails(inputPath, outputDir, outputGroup, bucket) {
  const destination = outputGroup.OutputGroupSettings.FileGroupSettings.Destination;
  const destMatch = destination.match(/s3:\/\/([^/]+)\/(.+)/);
  const [, destBucket, destPrefix] = destMatch;

  console.log('Generating thumbnails...');

  // Generate thumbnails with FFmpeg
  const thumbPath = `${outputDir}/thumb_%03d.jpg`;
  execSync(`ffmpeg -i ${inputPath} -vf "fps=1/10,scale=1280:720" -frames:v 10 ${thumbPath} -y`);

  // Upload thumbnails
  const thumbs = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
  for (const thumb of thumbs) {
    const thumbContent = fs.readFileSync(`${outputDir}/${thumb}`);
    await s3.putObject({
      Bucket: destBucket,
      Key: `${destPrefix}${thumb}`,
      Body: thumbContent,
      ContentType: 'image/jpeg'
    }).promise();
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MediaConvert stub server running on port ${PORT}`);
});
