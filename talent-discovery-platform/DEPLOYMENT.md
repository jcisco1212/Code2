# Get-Noticed Deployment Guide

## Pre-Deployment Checklist

### 1. Security Checklist

- [ ] **Generate new JWT secrets** (don't use development secrets!)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Run this 4 times for: JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_JWT_SECRET, ADMIN_JWT_REFRESH_SECRET

- [ ] **Use strong database password** (min 32 characters, mixed case, numbers, symbols)

- [ ] **Enable SSL** for database connections (`DB_SSL=true`)

- [ ] **Configure CORS** to only allow your frontend domain

- [ ] **Set up HTTPS** on both frontend and backend

- [ ] **Remove any hardcoded credentials** from code

- [ ] **Review .gitignore** - ensure .env files are not committed

### 2. Infrastructure Setup

#### Database (PostgreSQL)
Recommended services:
- **AWS RDS** - Scalable, managed PostgreSQL
- **DigitalOcean Managed Databases** - Simple, affordable
- **Supabase** - PostgreSQL with extras (auth, realtime)
- **Railway** - Easy deployment with database included

#### Redis (Caching/Sessions)
Recommended services:
- **Upstash** - Serverless Redis, free tier available
- **Redis Cloud** - Managed Redis
- **AWS ElastiCache** - If using AWS

#### File Storage (Videos/Images)
Recommended services:
- **AWS S3** - Industry standard
- **Cloudflare R2** - S3-compatible, no egress fees
- **DigitalOcean Spaces** - S3-compatible, affordable

#### Hosting
Frontend options:
- **Vercel** - Best for React apps, automatic deployments
- **Netlify** - Similar to Vercel
- **Cloudflare Pages** - Fast, free tier

Backend options:
- **Railway** - Easy Node.js deployment
- **Render** - Simple, good free tier
- **DigitalOcean App Platform** - Straightforward
- **AWS EC2/ECS** - More control, more complex

### 3. Environment Variables

1. Copy `.env.production.example` files:
   ```bash
   # Backend
   cp backend/.env.production.example backend/.env

   # Frontend
   cp frontend/.env.production.example frontend/.env.production
   ```

2. Fill in all values with production credentials

3. **Never commit .env files to git!**

### 4. Build Process

#### Frontend
```bash
cd frontend
npm install
npm run build
# Output is in /build folder - deploy this
```

#### Backend
```bash
cd backend
npm install
npm run build
# Start with: npm start (or use PM2 in production)
```

### 5. Database Migrations

For first deployment:
```bash
cd backend
npm run db:migrate  # If you have migrations
# Or let Sequelize sync on first start (not recommended for production)
```

### 6. Post-Deployment

- [ ] Test all critical flows (login, registration, video upload)
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure backups for database
- [ ] Set up SSL certificate auto-renewal
- [ ] Test email sending
- [ ] Create admin account

---

## Quick Deployment Options

### Option 1: Railway (Easiest)
1. Connect GitHub repo to Railway
2. Add PostgreSQL and Redis from Railway's marketplace
3. Set environment variables
4. Deploy

### Option 2: Vercel + Railway
1. Deploy frontend to Vercel
2. Deploy backend + database to Railway
3. Connect with environment variables

### Option 3: DigitalOcean
1. Create Managed Database (PostgreSQL)
2. Create Managed Redis
3. Deploy backend on App Platform
4. Deploy frontend on App Platform or Spaces

---

## Environment Variable Reference

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379` |
| `JWT_SECRET` | JWT signing secret (64 bytes hex) | `a1b2c3...` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `d4e5f6...` |
| `CORS_ORIGIN` | Frontend URL | `https://get-noticed.com` |
| `FRONTEND_URL` | Frontend URL | `https://get-noticed.com` |

### Recommended for Production

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Error tracking |
| `SMTP_*` | Email configuration |
| `AWS_*` / `S3_*` | File storage |
| `OPENAI_API_KEY` | AI features |

---

## Troubleshooting

### Database Connection Issues
- Ensure `DB_SSL=true` for cloud databases
- Check if your IP is whitelisted in database firewall
- Verify connection string format

### CORS Errors
- Ensure `CORS_ORIGIN` matches your exact frontend URL
- Include protocol (https://)
- No trailing slash

### File Upload Issues
- Check S3 bucket permissions
- Verify AWS credentials
- Ensure bucket CORS is configured

---

## Support

For issues, check:
1. Backend logs for errors
2. Browser console for frontend errors
3. Database connection status
4. Redis connection status
