# AWS Deployment Guide - Budget Edition

## Estimated Monthly Cost: $5-25/month

This guide prioritizes the **cheapest possible AWS setup** while still being production-ready.

---

## Architecture Overview (Budget)

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                      │
│                    (Optional - add later)                │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 S3 Bucket                                │
│         (Frontend static files + uploads)                │
│                  ~$1-3/month                             │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              EC2 t3.micro (or t2.micro)                  │
│    ┌─────────────────────────────────────────────┐      │
│    │  Node.js Backend                            │      │
│    │  PostgreSQL Database                        │      │
│    │  Redis Cache                                │      │
│    └─────────────────────────────────────────────┘      │
│              FREE (first year) or ~$8/month              │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 t3.micro | 750 hrs/month (1 year) | ~$8/month |
| S3 (5GB) | 5GB free | ~$0.12/GB |
| Data Transfer | 100GB out free | ~$0.09/GB |
| Route 53 | - | $0.50/month |
| **Total** | **~$1/month** | **~$10-15/month** |

---

## Step-by-Step Setup

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Create account (requires credit card)
3. You get 12 months of free tier!

### Step 2: Launch EC2 Instance

1. Go to **EC2 Dashboard** → **Launch Instance**

2. **Settings:**
   - Name: `get-noticed-server`
   - AMI: **Ubuntu 22.04 LTS** (free tier eligible)
   - Instance type: **t3.micro** (or t2.micro)
   - Key pair: Create new → Download `.pem` file (SAVE THIS!)
   - Network: Allow SSH, HTTP, HTTPS
   - Storage: 20GB gp3 (free tier allows 30GB)

3. Click **Launch Instance**

### Step 3: Connect to EC2

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 4: Install Everything on EC2

Run these commands on your EC2 instance:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install FFmpeg (for video processing)
sudo apt install -y ffmpeg
```

### Step 5: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER getnoticed WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE get_noticed_prod OWNER getnoticed;
GRANT ALL PRIVILEGES ON DATABASE get_noticed_prod TO getnoticed;
\q
```

### Step 6: Configure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find and change:
# bind 127.0.0.1 ::1
# requirepass YOUR_REDIS_PASSWORD

# Restart Redis
sudo systemctl restart redis-server
```

### Step 7: Create S3 Bucket for Uploads

1. Go to **S3 Dashboard** → **Create bucket**
2. Settings:
   - Name: `get-noticed-uploads-prod`
   - Region: Same as EC2
   - Uncheck "Block all public access" (for public files)
   - Enable versioning (optional)

3. **Bucket Policy** (for public read access to uploads):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::get-noticed-uploads-prod/*"
        }
    ]
}
```

4. **CORS Configuration:**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://your-domain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Step 8: Create IAM User for S3

1. Go to **IAM** → **Users** → **Create user**
2. Name: `get-noticed-s3-user`
3. Attach policy: `AmazonS3FullAccess` (or create custom policy)
4. Create access keys → Save Access Key ID and Secret!

### Step 9: Deploy Backend

```bash
# Clone your repo
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/Code2.git
cd Code2/talent-discovery-platform/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Backend .env:**
```env
NODE_ENV=production
PORT=4000
HOST=127.0.0.1

# Database (local PostgreSQL)
DATABASE_URL=postgresql://getnoticed:YOUR_DB_PASSWORD@localhost:5432/get_noticed_prod
DB_SSL=false

# Redis (local)
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=YOUR_GENERATED_SECRET_1
JWT_REFRESH_SECRET=YOUR_GENERATED_SECRET_2
ADMIN_JWT_SECRET=YOUR_GENERATED_SECRET_3
ADMIN_JWT_REFRESH_SECRET=YOUR_GENERATED_SECRET_4
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
S3_BUCKET=get-noticed-uploads-prod

# Email (use AWS SES or skip initially)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_SES_SMTP_USER
SMTP_PASSWORD=YOUR_SES_SMTP_PASSWORD
SMTP_FROM=noreply@your-domain.com
```

```bash
# Build and start with PM2
npm run build
pm2 start dist/index.js --name "get-noticed-api"
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 10: Build and Deploy Frontend

**Option A: Host on S3 (Cheapest)**

On your local machine:
```bash
cd frontend

# Create .env.production
echo "REACT_APP_API_URL=https://api.your-domain.com/api/v1" > .env.production
echo "REACT_APP_BACKEND_URL=https://api.your-domain.com" >> .env.production

# Build
npm run build

# Install AWS CLI
pip install awscli
aws configure  # Enter your credentials

# Upload to S3
aws s3 sync build/ s3://get-noticed-frontend-prod --delete
```

Create another S3 bucket for frontend:
1. Create bucket: `get-noticed-frontend-prod`
2. Enable static website hosting
3. Set index document: `index.html`
4. Set error document: `index.html`

**Option B: Host on EC2 with Nginx**

```bash
# Build frontend locally and upload
scp -i your-key.pem -r build/* ubuntu@YOUR_EC2_IP:/var/www/html/
```

### Step 11: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 12: Setup Domain & SSL

1. **Route 53** (or use your domain registrar):
   - Create A record: `your-domain.com` → EC2 IP
   - Create A record: `api.your-domain.com` → EC2 IP

2. **Free SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

### Step 13: Setup Backups (Important!)

```bash
# Create backup script
sudo nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U getnoticed get_noticed_prod > /home/ubuntu/backups/db_$DATE.sql
aws s3 cp /home/ubuntu/backups/db_$DATE.sql s3://get-noticed-backups/
find /home/ubuntu/backups -mtime +7 -delete
```

```bash
chmod +x /home/ubuntu/backup.sh
mkdir -p /home/ubuntu/backups

# Add to crontab (daily backup at 3 AM)
crontab -e
# Add: 0 3 * * * /home/ubuntu/backup.sh
```

---

## Even Cheaper Alternatives

### Use Lightsail Instead of EC2
- **$3.50/month** for 512MB RAM, 1 vCPU
- **$5/month** for 1GB RAM, 1 vCPU
- Includes: static IP, data transfer, DNS management

### Use Free Tier Services
- **Upstash Redis**: Free tier (10K commands/day)
- **Supabase**: Free tier (500MB database)
- **Vercel/Netlify**: Free frontend hosting

---

## Cost Saving Tips

1. **Use Reserved Instances** - Save 30-40% by committing to 1 year
2. **Set up billing alerts** - AWS Console → Billing → Budgets
3. **Stop instance when not needed** - During development/testing
4. **Use S3 Intelligent Tiering** - Automatically moves data to cheaper storage
5. **Clean up unused resources** - EBS snapshots, old AMIs, unused IPs

---

## Monitoring

```bash
# View logs
pm2 logs get-noticed-api

# Monitor resources
htop

# Check disk space
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('get_noticed_prod'));"
```

---

## Quick Commands Reference

```bash
# Restart backend
pm2 restart get-noticed-api

# View backend logs
pm2 logs get-noticed-api --lines 100

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql

# Restart Redis
sudo systemctl restart redis-server

# Update code
cd /home/ubuntu/Code2/talent-discovery-platform
git pull
cd backend && npm install && npm run build
pm2 restart get-noticed-api
```
