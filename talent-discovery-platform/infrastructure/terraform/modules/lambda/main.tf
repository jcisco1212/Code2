# Lambda Module for Video Processing Triggers

variable "environment" {
  type = string
}

variable "video_bucket_arn" {
  type = string
}

variable "video_bucket_name" {
  type = string
}

variable "sqs_queue_arn" {
  type = string
}

variable "mediaconvert_endpoint" {
  type = string
}

variable "mediaconvert_role_arn" {
  type = string
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "get-noticed-${var.environment}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "Lambda Execution Role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda" {
  name = "lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectTagging"
        ]
        Resource = "${var.video_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.sqs_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:DescribeEndpoints"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = var.mediaconvert_role_arn
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/get-noticed-${var.environment}-video-trigger"
  retention_in_days = 14

  tags = {
    Name = "Lambda Logs"
  }
}

# Lambda Function - Video Upload Trigger
resource "aws_lambda_function" "video_trigger" {
  function_name = "get-noticed-${var.environment}-video-trigger"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      SQS_QUEUE_URL        = aws_sqs_queue.video_processing.url
      MEDIACONVERT_ENDPOINT = var.mediaconvert_endpoint
      MEDIACONVERT_ROLE_ARN = var.mediaconvert_role_arn
      OUTPUT_BUCKET         = var.video_bucket_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda
  ]

  tags = {
    Name = "Video Upload Trigger"
  }
}

# Lambda source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    content  = <<EOF
const { MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const mediaConvert = new MediaConvertClient({
  endpoint: process.env.MEDIACONVERT_ENDPOINT
});
const sqs = new SQSClient({});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Only process uploads in 'uploads/' prefix
    if (!key.startsWith('uploads/')) {
      console.log('Skipping non-upload file:', key);
      continue;
    }

    const videoId = key.split('/')[1];
    console.log('Processing video:', videoId);

    // Send message to processing queue
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        videoId,
        bucket,
        key,
        action: 'transcode'
      }),
      MessageAttributes: {
        'VideoId': {
          DataType: 'String',
          StringValue: videoId
        }
      }
    }));

    // Create MediaConvert job
    const jobParams = {
      Role: process.env.MEDIACONVERT_ROLE_ARN,
      Settings: {
        Inputs: [{
          FileInput: `s3://${bucket}/${key}`,
          AudioSelectors: {
            'Audio Selector 1': { DefaultSelection: 'DEFAULT' }
          },
          VideoSelector: {}
        }],
        OutputGroups: [
          {
            Name: 'HLS',
            OutputGroupSettings: {
              Type: 'HLS_GROUP_SETTINGS',
              HlsGroupSettings: {
                Destination: `s3://${process.env.OUTPUT_BUCKET}/processed/${videoId}/`,
                SegmentLength: 6,
                MinSegmentLength: 0
              }
            },
            Outputs: [
              {
                NameModifier: '_1080p',
                VideoDescription: {
                  Width: 1920,
                  Height: 1080,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      MaxBitrate: 8000000,
                      QvbrSettings: { QvbrQualityLevel: 8 }
                    }
                  }
                },
                AudioDescriptions: [{
                  AudioSourceName: 'Audio Selector 1',
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: { Bitrate: 128000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 }
                  }
                }],
                ContainerSettings: { Container: 'M3U8' }
              },
              {
                NameModifier: '_720p',
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      MaxBitrate: 5000000,
                      QvbrSettings: { QvbrQualityLevel: 7 }
                    }
                  }
                },
                AudioDescriptions: [{
                  AudioSourceName: 'Audio Selector 1',
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: { Bitrate: 128000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 }
                  }
                }],
                ContainerSettings: { Container: 'M3U8' }
              },
              {
                NameModifier: '_480p',
                VideoDescription: {
                  Width: 854,
                  Height: 480,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      MaxBitrate: 2500000,
                      QvbrSettings: { QvbrQualityLevel: 6 }
                    }
                  }
                },
                AudioDescriptions: [{
                  AudioSourceName: 'Audio Selector 1',
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: { Bitrate: 96000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 }
                  }
                }],
                ContainerSettings: { Container: 'M3U8' }
              }
            ]
          },
          {
            Name: 'Thumbnails',
            OutputGroupSettings: {
              Type: 'FILE_GROUP_SETTINGS',
              FileGroupSettings: {
                Destination: `s3://${process.env.OUTPUT_BUCKET}/processed/${videoId}/thumbnails/`
              }
            },
            Outputs: [{
              NameModifier: '_thumb',
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'FRAME_CAPTURE',
                  FrameCaptureSettings: {
                    FramerateNumerator: 1,
                    FramerateDenominator: 10,
                    MaxCaptures: 10,
                    Quality: 80
                  }
                }
              },
              ContainerSettings: { Container: 'RAW' }
            }]
          }
        ]
      }
    };

    try {
      const result = await mediaConvert.send(new CreateJobCommand(jobParams));
      console.log('MediaConvert job created:', result.Job.Id);
    } catch (error) {
      console.error('Failed to create MediaConvert job:', error);
      throw error;
    }
  }

  return { statusCode: 200, body: 'Processed' };
};
EOF
    filename = "index.js"
  }
}

# SQS Queue (defined here for the Lambda to use)
resource "aws_sqs_queue" "video_processing" {
  name                       = "get-noticed-${var.environment}-lambda-video-processing"
  visibility_timeout_seconds = 3600
}

# S3 Bucket Notification
resource "aws_s3_bucket_notification" "video_upload" {
  bucket = var.video_bucket_name

  lambda_function {
    lambda_function_arn = aws_lambda_function.video_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.s3]
}

# Lambda Permission for S3
resource "aws_lambda_permission" "s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.video_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.video_bucket_arn
}

# Lambda Function - MediaConvert Job Complete
resource "aws_lambda_function" "job_complete" {
  function_name = "get-noticed-${var.environment}-job-complete"
  role          = aws_iam_role.lambda.arn
  handler       = "complete.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.complete_lambda_zip.output_path
  source_code_hash = data.archive_file.complete_lambda_zip.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name = "MediaConvert Job Complete"
  }
}

data "archive_file" "complete_lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/complete_lambda.zip"

  source {
    content  = <<EOF
exports.handler = async (event) => {
  console.log('MediaConvert Job Event:', JSON.stringify(event, null, 2));

  const detail = event.detail;
  const status = detail.status;
  const jobId = detail.jobId;

  if (status === 'COMPLETE') {
    console.log('Job completed successfully:', jobId);
    // Update database via API or direct DB connection
  } else if (status === 'ERROR') {
    console.error('Job failed:', jobId, detail.errorMessage);
    // Handle error - notify, retry, etc.
  }

  return { statusCode: 200 };
};
EOF
    filename = "complete.js"
  }
}

# EventBridge Rule for MediaConvert
resource "aws_cloudwatch_event_rule" "mediaconvert" {
  name        = "get-noticed-${var.environment}-mediaconvert-events"
  description = "Capture MediaConvert job state changes"

  event_pattern = jsonencode({
    source      = ["aws.mediaconvert"]
    detail-type = ["MediaConvert Job State Change"]
    detail = {
      status = ["COMPLETE", "ERROR"]
    }
  })

  tags = {
    Name = "MediaConvert Events"
  }
}

resource "aws_cloudwatch_event_target" "mediaconvert" {
  rule      = aws_cloudwatch_event_rule.mediaconvert.name
  target_id = "MediaConvertJobComplete"
  arn       = aws_lambda_function.job_complete.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.job_complete.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.mediaconvert.arn
}

# Outputs
output "video_trigger_arn" {
  value = aws_lambda_function.video_trigger.arn
}

output "job_complete_arn" {
  value = aws_lambda_function.job_complete.arn
}
