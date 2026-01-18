# Get-Noticed Production Deployment Checklist

**Domain:** get-noticed.net
**Last Updated:** January 2026

---

## Pre-Deployment

### 1. AWS Account Setup
- [ ] AWS Account created and verified
- [ ] IAM user created with appropriate permissions
- [ ] MFA enabled on AWS root account
- [ ] Billing alerts configured

### 2. Domain & SSL
- [ ] Domain `get-noticed.net` registered
- [ ] DNS configured (Route 53 or external)
- [ ] ACM Certificate requested for:
  - [ ] `get-noticed.net`
  - [ ] `*.get-noticed.net` (wildcard)
- [ ] Certificate validated and issued
- [ ] Certificate ARN noted for Terraform

### 3. Terraform State Backend
- [ ] S3 bucket created: `get-noticed-terraform-state`
- [ ] Bucket versioning enabled
- [ ] Bucket encryption enabled
- [ ] DynamoDB table created: `terraform-locks`

### 4. ECR Repositories Created
- [ ] `get-noticed-api`
- [ ] `get-noticed-worker`
- [ ] `get-noticed-ai`
- [ ] `get-noticed-frontend`

---

## Security Configuration

### 5. Generate Secrets
Run these commands to generate secure secrets:

```bash
# JWT Secrets (run 4 times for different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

- [ ] JWT_SECRET generated
- [ ] JWT_REFRESH_SECRET generated
- [ ] ADMIN_JWT_SECRET generated
- [ ] ADMIN_JWT_REFRESH_SECRET generated
- [ ] SESSION_SECRET generated
- [ ] ENCRYPTION_KEY generated
- [ ] Database password generated (min 32 chars)

### 6. CloudFront Signed URLs
- [ ] CloudFront key pair created in AWS Console
- [ ] Private key downloaded and secured
- [ ] Key pair ID noted

### 7. Email Service
- [ ] Email provider selected (SendGrid/SES/Mailgun)
- [ ] API key generated
- [ ] Domain verified for sending
- [ ] SPF, DKIM, DMARC records configured

---

## Infrastructure Deployment

### 8. Terraform Configuration
```bash
cd infrastructure/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Apply (review carefully!)
terraform apply tfplan
```

- [ ] `terraform.tfvars` configured with production values
- [ ] `terraform init` successful
- [ ] `terraform plan` reviewed
- [ ] `terraform apply` completed
- [ ] Outputs saved (ALB DNS, CloudFront domain, etc.)

### 9. DNS Configuration
After Terraform apply, configure DNS:

- [ ] A record: `get-noticed.net` → ALB DNS
- [ ] A record: `api.get-noticed.net` → ALB DNS
- [ ] CNAME: `cdn.get-noticed.net` → CloudFront domain
- [ ] DNS propagation verified

---

## Application Configuration

### 10. Backend Environment
```bash
cd backend
cp .env.production.example .env
# Edit .env with production values
```

Required variables:
- [ ] `DATABASE_URL` (from Terraform output)
- [ ] `REDIS_URL` (from Terraform output)
- [ ] `JWT_SECRET` and related secrets
- [ ] `CORS_ORIGIN=https://get-noticed.net`
- [ ] AWS credentials for S3
- [ ] SMTP configuration
- [ ] `SENTRY_DSN` (optional but recommended)

### 11. Frontend Environment
```bash
cd frontend
cp .env.production.example .env.production
```

- [ ] `REACT_APP_API_URL=https://api.get-noticed.net/api/v1`
- [ ] `REACT_APP_SOCKET_URL=wss://api.get-noticed.net`
- [ ] Sentry DSN configured (optional)

### 12. AI Services Environment
```bash
cd ai-services
cp .env.production.example .env
```

- [ ] AWS credentials configured
- [ ] OpenAI API key (optional)
- [ ] Sentry DSN configured (optional)

---

## Deployment

### 13. Build & Deploy

**Option A: Manual Deployment**
```bash
# Set AWS Account ID
export AWS_ACCOUNT_ID=your-account-id

# Run deployment script
./scripts/deploy.sh deploy
```

**Option B: GitHub Actions (Recommended)**
1. Configure GitHub Secrets:
   - [ ] `AWS_ACCESS_KEY_ID`
   - [ ] `AWS_SECRET_ACCESS_KEY`
   - [ ] `PRIVATE_SUBNET_IDS`
   - [ ] `ECS_SECURITY_GROUP`

2. Push to main branch to trigger deployment

### 14. Database Setup
- [ ] Database migrations run
- [ ] Initial admin user created
- [ ] Categories seeded (if applicable)

```bash
# Connect to database and run migrations
npm run db:migrate

# Create admin user (if needed)
npm run create-admin
```

---

## Post-Deployment Verification

### 15. Health Checks
- [ ] `https://api.get-noticed.net/health` returns 200
- [ ] `https://get-noticed.net` loads correctly
- [ ] SSL certificate valid (check in browser)

### 16. Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] 2FA setup works
- [ ] Video upload works
- [ ] Video playback works
- [ ] Comments work
- [ ] Notifications work
- [ ] Email sending works
- [ ] Password reset email received
- [ ] AI analysis runs (if enabled)

### 17. Security Verification
- [ ] HTTPS redirect works (HTTP → HTTPS)
- [ ] HSTS header present
- [ ] CSP header configured
- [ ] CORS only allows `get-noticed.net`
- [ ] Rate limiting functional
- [ ] WAF rules active

---

## Monitoring Setup

### 18. CloudWatch
- [ ] Log groups created for all services
- [ ] Alarms configured:
  - [ ] High CPU utilization
  - [ ] High memory utilization
  - [ ] 5xx error rate
  - [ ] Unhealthy targets
- [ ] Dashboard created

### 19. Error Tracking
- [ ] Sentry project created
- [ ] Backend errors reporting
- [ ] Frontend errors reporting
- [ ] AI services errors reporting

### 20. Uptime Monitoring
- [ ] UptimeRobot or similar configured
- [ ] Alerts set up for downtime
- [ ] Status page configured (optional)

---

## Backup & Disaster Recovery

### 21. Database Backups
- [ ] RDS automated backups enabled
- [ ] Backup retention period set (7+ days)
- [ ] Manual snapshot taken post-deployment
- [ ] Backup restoration tested

### 22. S3 Backups
- [ ] Versioning enabled on all buckets
- [ ] Cross-region replication (optional)
- [ ] Lifecycle policies configured

---

## Documentation

### 23. Operations Documentation
- [ ] Runbook created for common issues
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] On-call rotation established

### 24. Security Documentation
- [ ] Incident response plan created
- [ ] Security contacts documented
- [ ] Vulnerability disclosure process defined

---

## Final Steps

### 25. Go-Live
- [ ] All tests passing
- [ ] Team notified of deployment
- [ ] User communications sent (if applicable)
- [ ] Go-live monitoring active

### 26. Post-Go-Live
- [ ] Monitor for first 24 hours
- [ ] Address any issues immediately
- [ ] Collect feedback
- [ ] Schedule retrospective

---

## Quick Reference

### Important URLs
- **Frontend:** https://get-noticed.net
- **API:** https://api.get-noticed.net
- **CDN:** https://cdn.get-noticed.net
- **Health Check:** https://api.get-noticed.net/health

### AWS Resources
- **Region:** us-east-1
- **ECS Cluster:** get-noticed-production
- **ECR Registry:** {account-id}.dkr.ecr.us-east-1.amazonaws.com

### Emergency Contacts
- **AWS Support:** (configure based on support plan)
- **On-Call Engineer:** (add contact)
- **Sentry:** (add project link)

---

## Maintenance Commands

```bash
# View logs
aws logs tail /ecs/get-noticed-production --follow

# Restart API service
aws ecs update-service --cluster get-noticed-production --service api --force-new-deployment

# Check service status
aws ecs describe-services --cluster get-noticed-production --services api worker ai

# Database backup
pg_dump -h <rds-endpoint> -U <user> <database> > backup.sql

# Scale service
aws ecs update-service --cluster get-noticed-production --service api --desired-count 5
```
