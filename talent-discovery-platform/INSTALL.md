# TalentVault Installation Guide

Complete installation instructions for the TalentVault AI-powered video sharing platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [AWS Cloud Deployment](#aws-cloud-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [AI Services Setup](#ai-services-setup)
7. [Video Processing Setup](#video-processing-setup)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Docker | 24.0+ | Container runtime |
| Docker Compose | 2.20+ | Multi-container orchestration |
| Node.js | 18.x LTS | Backend & Frontend |
| Python | 3.11+ | AI Services |
| Git | 2.40+ | Version control |
| AWS CLI | 2.x | AWS deployment |
| Terraform | 1.5+ | Infrastructure as Code |

### System Requirements

**Local Development:**
- CPU: 4+ cores recommended
- RAM: 8GB minimum, 16GB recommended
- Storage: 20GB free space
- OS: Linux, macOS, or Windows with WSL2

**Production (AWS):**
- See AWS resource sizing in the Terraform configuration

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/talent-discovery-platform.git
cd talent-discovery-platform
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

Required environment variables:
```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/talentvault

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# S3/MinIO (local development)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=talentvault-videos
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

# Email (MailHog for local development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# AI Services
AI_SERVICE_URL=http://localhost:8000
```

### Step 3: Start All Services with Docker Compose

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

This starts the following services:
- **PostgreSQL** (port 5432) - Primary database
- **Redis** (port 6379) - Caching & job queues
- **MinIO** (ports 9000, 9001) - S3-compatible storage
- **MailHog** (ports 1025, 8025) - Email testing
- **ClamAV** (port 3310) - Virus scanning
- **Backend API** (port 3000) - Node.js/Express
- **Worker** - Background job processor
- **AI Services** (port 8000) - Python/FastAPI
- **Frontend** (port 3001) - React application

### Step 4: Initialize the Database

```bash
# Run migrations
docker-compose exec api npm run db:migrate

# Seed initial data (categories, admin user)
docker-compose exec api npm run db:seed
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **MailHog**: http://localhost:8025

### Step 6: Create Initial Admin User

```bash
# Using the CLI tool
docker-compose exec api npm run create-admin -- \
  --email admin@example.com \
  --password YourSecurePassword123!
```

---

## AWS Cloud Deployment

### Option A: Using Terraform (Recommended)

#### Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or export environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

#### Step 2: Create Terraform State Backend

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://talentvault-terraform-state --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

#### Step 3: Configure Terraform Variables

```bash
cd infrastructure/terraform

# Copy and edit the variables file
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Key variables to configure:
```hcl
environment = "production"
aws_region  = "us-east-1"

# SSL Certificate (must be in us-east-1 for CloudFront)
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx"

# Database credentials
database_username = "admin"
database_password = "your-secure-database-password"

# Docker images (after pushing to ECR)
api_image      = "123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-api:latest"
worker_image   = "123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-worker:latest"
ai_image       = "123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-ai:latest"
frontend_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-frontend:latest"

# Secrets
jwt_secret         = "your-production-jwt-secret-min-32-characters"
jwt_refresh_secret = "your-production-refresh-secret-min-32-characters"

# Alerts
alarm_email = "alerts@yourdomain.com"
```

#### Step 4: Generate CloudFront Key Pair

```bash
# Generate RSA key pair for CloudFront signed URLs
openssl genrsa -out private_key.pem 2048
openssl rsa -pubout -in private_key.pem -out public_key.pem

# Copy public key to CloudFront module
cp public_key.pem infrastructure/terraform/modules/cloudfront/
```

#### Step 5: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Save outputs
terraform output > outputs.txt
```

#### Step 6: Build and Push Docker Images

```bash
# Create ECR repositories
aws ecr create-repository --repository-name talentvault-api
aws ecr create-repository --repository-name talentvault-worker
aws ecr create-repository --repository-name talentvault-ai
aws ecr create-repository --repository-name talentvault-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t talentvault-api:latest ./backend
docker tag talentvault-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/talentvault-api:latest

# Repeat for worker, ai-services, and frontend
```

#### Step 7: Run Database Migrations

```bash
# Connect to ECS task and run migrations
aws ecs execute-command \
  --cluster talentvault-production \
  --task <task-id> \
  --container api \
  --interactive \
  --command "npm run db:migrate"
```

### Option B: Using CloudFormation

```bash
cd infrastructure/cloudformation

# Create the stack
aws cloudformation create-stack \
  --stack-name talentvault-production \
  --template-body file://main.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789012:certificate/xxxxx \
    ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword \
    ParameterKey=JwtSecret,ParameterValue=your-jwt-secret-min-32-chars \
    ParameterKey=AlarmEmail,ParameterValue=alerts@yourdomain.com \
  --capabilities CAPABILITY_IAM

# Monitor stack creation
aws cloudformation describe-stack-events --stack-name talentvault-production
```

---

## Environment Configuration

### Development vs Production Settings

| Setting | Development | Production |
|---------|-------------|------------|
| NODE_ENV | development | production |
| DEBUG | true | false |
| LOG_LEVEL | debug | info |
| RATE_LIMIT | 1000/min | 100/min |
| 2FA_REQUIRED | false | true |
| VIRUS_SCAN | optional | required |

### Required Secrets (Production)

Store these in AWS Secrets Manager:
- `JWT_SECRET` - 256-bit random string
- `JWT_REFRESH_SECRET` - 256-bit random string
- `ENCRYPTION_KEY` - 256-bit AES key
- `DATABASE_PASSWORD` - Strong password
- `CLOUDFRONT_PRIVATE_KEY` - RSA private key

Generate secure secrets:
```bash
# Generate random 256-bit key
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32
```

---

## Database Setup

### Schema Migration

```bash
# Development
npm run db:migrate

# Production (via ECS)
aws ecs execute-command --cluster talentvault-production \
  --task <task-id> --container api \
  --command "npm run db:migrate"
```

### Initial Data Seeding

```bash
# Seed categories
npm run db:seed:categories

# Create admin user
npm run create-admin -- --email admin@domain.com --password SecurePass123!
```

### Database Maintenance

```bash
# Backup (RDS)
aws rds create-db-snapshot \
  --db-instance-identifier talentvault-production \
  --db-snapshot-identifier backup-$(date +%Y%m%d)

# Performance tuning
# See RDS parameter group in Terraform for optimized settings
```

---

## AI Services Setup

### Local Development

The AI services use mock implementations by default. For real AI capabilities:

1. **Install ML Dependencies:**
```bash
cd ai-services
pip install -r requirements.txt
pip install torch torchvision mediapipe librosa
```

2. **Download Pre-trained Models:**
```bash
# MediaPipe models are downloaded automatically
# For custom models, place them in ai-services/models/
```

### Production AI Services

For production, consider:
- GPU-enabled ECS instances (p3.2xlarge or g4dn.xlarge)
- SageMaker endpoints for inference
- Model versioning with MLflow

---

## Video Processing Setup

### Local Development (FFmpeg)

```bash
# The Docker container includes FFmpeg
# For local development without Docker:
brew install ffmpeg  # macOS
apt install ffmpeg   # Ubuntu
```

### Production (AWS MediaConvert)

MediaConvert is automatically configured via Terraform. Key settings:
- HLS output with 1080p, 720p, 480p variants
- Thumbnail generation (10 frames)
- Audio transcoding to AAC

---

## Security Configuration

### SSL/TLS Certificates

1. **Create ACM Certificate:**
```bash
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS \
  --subject-alternative-names cdn.yourdomain.com
```

2. **Validate DNS:**
Follow ACM instructions to add CNAME records.

### WAF Rules

The Terraform configuration includes:
- Rate limiting (2000 requests/5 minutes per IP)
- SQL injection protection
- XSS protection
- Known bad inputs blocking
- Bot control
- Geo-blocking for sanctioned countries

### Security Headers

Configured in the API middleware:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

---

## Monitoring & Logging

### CloudWatch Dashboard

Access via AWS Console or:
```bash
aws cloudwatch get-dashboard --dashboard-name talentvault-production
```

### Key Metrics to Monitor

- API response time (p99 < 2s)
- Error rate (< 1%)
- ECS CPU/Memory utilization
- RDS connections and CPU
- SQS queue depth
- Video processing success rate

### Alerts Configuration

Alerts are sent to the configured SNS topic for:
- High API latency (> 2s average)
- 5xx error spike (> 10/minute)
- ECS CPU > 85%
- RDS CPU > 80%
- Storage < 10GB
- Messages in DLQ

### Log Access

```bash
# CloudWatch Logs
aws logs tail /ecs/talentvault-production --follow

# Download logs
aws logs get-log-events \
  --log-group-name /ecs/talentvault-production \
  --log-stream-name api/xxx
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Compose Won't Start

```bash
# Check for port conflicts
lsof -i :3000
lsof -i :5432

# Reset Docker
docker-compose down -v
docker system prune -a
docker-compose up -d
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Check connection string in .env
echo $DATABASE_URL
```

#### 3. Video Upload Fails

```bash
# Check MinIO/S3 connection
docker-compose exec api node -e "require('./src/config/s3').testConnection()"

# Check ClamAV is running
docker-compose ps clamav
docker-compose logs clamav
```

#### 4. AI Services Not Responding

```bash
# Check AI service health
curl http://localhost:8000/health

# View AI service logs
docker-compose logs ai-services
```

#### 5. Email Not Sending

```bash
# Check MailHog (development)
open http://localhost:8025

# Check SMTP configuration
docker-compose exec api node -e "require('./src/services/emailService').testConnection()"
```

### AWS Troubleshooting

#### ECS Task Failing

```bash
# View task stopped reason
aws ecs describe-tasks \
  --cluster talentvault-production \
  --tasks <task-arn>

# View container logs
aws logs get-log-events \
  --log-group-name /ecs/talentvault-production \
  --log-stream-name api/<task-id>
```

#### RDS Connection Issues

```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity from ECS
aws ecs execute-command \
  --cluster talentvault-production \
  --task <task-id> \
  --container api \
  --command "nc -zv <rds-endpoint> 5432"
```

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the `/docs` folder
- **Logs**: Always include relevant log output
- **Environment**: Specify local/staging/production

---

## Quick Reference Commands

```bash
# Local Development
docker-compose up -d              # Start all services
docker-compose logs -f api        # View API logs
docker-compose exec api bash      # Shell into API container
docker-compose down               # Stop all services

# Database
npm run db:migrate                # Run migrations
npm run db:rollback              # Rollback last migration
npm run db:seed                  # Seed data

# Testing
npm run test                     # Run tests
npm run test:coverage           # Run with coverage

# Production (Terraform)
terraform plan                   # Preview changes
terraform apply                  # Deploy changes
terraform destroy               # Tear down infrastructure

# AWS ECS
aws ecs update-service --cluster talentvault-production --service api --force-new-deployment
```
