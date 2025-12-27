import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// S3 Client configuration
const s3Config: any = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
};

// For local development with MinIO
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  s3Config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
}

export const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET || 'get-noticed-videos';
const THUMBNAILS_BUCKET = process.env.S3_THUMBNAILS_BUCKET || 'get-noticed-thumbnails';
const PROFILES_BUCKET = process.env.S3_PROFILES_BUCKET || 'get-noticed-profiles';

// Generate presigned URL for upload (PUT)
export const generateUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600,
  bucket: string = BUCKET_NAME
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// Generate presigned POST for multipart upload
export const generatePresignedPost = async (
  key: string,
  contentType: string,
  maxSizeBytes: number = 524288000, // 500MB default
  expiresIn: number = 3600,
  bucket: string = BUCKET_NAME
): Promise<PresignedPost> => {
  return createPresignedPost(s3Client, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ['content-length-range', 0, maxSizeBytes],
      ['starts-with', '$Content-Type', contentType.split('/')[0]]
    ],
    Fields: {
      'Content-Type': contentType
    },
    Expires: expiresIn
  });
};

// Generate presigned URL for download (GET)
export const generateDownloadUrl = async (
  key: string,
  expiresIn: number = 3600,
  bucket: string = BUCKET_NAME
): Promise<string> => {
  // If CloudFront is configured, use signed URLs
  if (process.env.CLOUDFRONT_DOMAIN && process.env.CLOUDFRONT_KEY_PAIR_ID && process.env.CLOUDFRONT_PRIVATE_KEY) {
    return generateCloudFrontSignedUrl(key, expiresIn);
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// Generate CloudFront signed URL
export const generateCloudFrontSignedUrl = (
  key: string,
  expiresIn: number = 3600
): string => {
  const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString();

  return getCloudFrontSignedUrl({
    url,
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
    dateLessThan
  });
};

// Delete object from S3
export const deleteObject = async (key: string, bucket: string = BUCKET_NAME): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await s3Client.send(command);
    logger.info(`Deleted object: ${key} from bucket: ${bucket}`);
  } catch (error) {
    logger.error(`Error deleting object ${key}:`, error);
    throw error;
  }
};

// Check if object exists
export const objectExists = async (key: string, bucket: string = BUCKET_NAME): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Upload file directly to S3
export const uploadFile = async (
  key: string,
  body: Buffer | string,
  contentType: string,
  bucket: string = BUCKET_NAME
): Promise<void> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });
    await s3Client.send(command);
    logger.info(`Uploaded file: ${key} to bucket: ${bucket}`);
  } catch (error) {
    logger.error(`Error uploading file ${key}:`, error);
    throw error;
  }
};

// Get S3 object URL (for public buckets or with presigning)
export const getObjectUrl = (key: string, bucket: string = BUCKET_NAME): string => {
  if (process.env.CLOUDFRONT_DOMAIN) {
    return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  }

  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT}/${bucket}/${key}`;
  }

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const buckets = {
  videos: BUCKET_NAME,
  thumbnails: THUMBNAILS_BUCKET,
  profiles: PROFILES_BUCKET
};

export default s3Client;
