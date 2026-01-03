# Get-Noticed Platform - Troubleshooting Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Backend Troubleshooting](#backend-troubleshooting)
3. [Frontend Troubleshooting](#frontend-troubleshooting)
4. [Database Troubleshooting](#database-troubleshooting)
5. [Common Errors & Solutions](#common-errors--solutions)
6. [Useful Commands Reference](#useful-commands-reference)

---

## Quick Start

### Starting the Application

**Terminal 1 - Start Backend:**
```bash
cd talent-discovery-platform/backend
npm run dev
```
Expected output: `Server running on http://0.0.0.0:4000`

**Terminal 2 - Start Frontend:**
```bash
cd talent-discovery-platform/frontend
npm start
```
Expected output: Opens browser at `http://localhost:3001`

### Verify Services Are Running

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Backend Health | http://localhost:4000/health | `{"status":"healthy"...}` |
| Frontend | http://localhost:3001 | Website loads |
| PostgreSQL | Port 5432 | Database connected |
| Redis | Port 6379 | Redis connected |

---

## Backend Troubleshooting

### Check if Backend is Running
```bash
# Check if process is running on port 4000
lsof -i :4000

# Or use curl to test health endpoint
curl http://localhost:4000/health
```

### View Backend Logs
```bash
cd talent-discovery-platform/backend

# Run with visible logs
npm run dev

# Check for errors in real-time
tail -f logs/combined.log
```

### Restart Backend
```bash
# Kill existing process
kill $(lsof -t -i:4000)

# Start fresh
cd talent-discovery-platform/backend
npm run dev
```

### Backend Won't Start - Common Fixes

**Port Already in Use:**
```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Then restart
npm run dev
```

**Missing Dependencies:**
```bash
cd talent-discovery-platform/backend
rm -rf node_modules
npm install
```

**Environment Variables Missing:**
```bash
# Check if .env file exists
cat .env

# Copy from example if missing
cp .env.example .env
```

**Database Connection Failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql
```

**Redis Connection Failed:**
```bash
# Check Redis is running
sudo systemctl status redis

# Start Redis if stopped
sudo systemctl start redis
```

---

## Frontend Troubleshooting

### Check if Frontend is Running
```bash
# Check if process is running on port 3001
lsof -i :3001

# Or open in browser
xdg-open http://localhost:3001
```

### View Frontend Logs
```bash
cd talent-discovery-platform/frontend
npm start
# Logs appear in terminal
```

### Restart Frontend
```bash
# Kill existing process
kill $(lsof -t -i:3001)

# Start fresh
cd talent-discovery-platform/frontend
npm start
```

### Frontend Won't Start - Common Fixes

**Port Already in Use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart
npm start
```

**Missing Dependencies:**
```bash
cd talent-discovery-platform/frontend
rm -rf node_modules
npm install
```

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm start
```

**TypeScript Errors:**
```bash
# Check for type errors
npx tsc --noEmit

# Fix and restart
npm start
```

### Frontend Shows Blank Page

1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify backend is running at http://localhost:4000

---

## Database Troubleshooting

### Check PostgreSQL Status
```bash
# Check if running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Restart
sudo systemctl restart postgresql
```

### Connect to Database
```bash
# Connect as postgres user
psql -U postgres -d get_noticed

# List all tables
\dt

# Exit
\q
```

### Common Database Commands
```bash
# View all users
psql -U postgres -d get_noticed -c "SELECT id, email, username, role FROM users;"

# View all categories
psql -U postgres -d get_noticed -c "SELECT id, name, slug, \"isActive\" FROM categories;"

# View all videos
psql -U postgres -d get_noticed -c "SELECT id, title, status, \"userId\" FROM videos LIMIT 10;"

# Update user role to super_admin
psql -U postgres -d get_noticed -c "UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';"
```

### Reset Database (CAUTION: Deletes All Data)
```bash
cd talent-discovery-platform/backend

# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS get_noticed;"
psql -U postgres -c "CREATE DATABASE get_noticed;"

# Run migrations/sync
npm run dev
# (Sequelize will recreate tables on startup in development mode)
```

### Check Redis Status
```bash
# Check if running
sudo systemctl status redis

# Start if stopped
sudo systemctl start redis

# Test connection
redis-cli ping
# Should respond: PONG
```

---

## Common Errors & Solutions

### Error: "EADDRINUSE: address already in use"
**Cause:** Another process is using the port

**Solution:**
```bash
# For backend (port 4000)
kill $(lsof -t -i:4000)

# For frontend (port 3001)
kill $(lsof -t -i:3001)
```

### Error: "ECONNREFUSED 127.0.0.1:5432"
**Cause:** PostgreSQL is not running

**Solution:**
```bash
sudo systemctl start postgresql
```

### Error: "ECONNREFUSED 127.0.0.1:6379"
**Cause:** Redis is not running

**Solution:**
```bash
sudo systemctl start redis
```

### Error: "Admin access required"
**Cause:** User role is not set correctly

**Solution:**
```bash
psql -U postgres -d get_noticed -c "UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';"
```
Then log out and log back in.

### Error: "Cannot find module"
**Cause:** Dependencies not installed

**Solution:**
```bash
cd talent-discovery-platform/backend  # or /frontend
rm -rf node_modules
npm install
```

### Error: "JWT token expired" or "Invalid token"
**Cause:** Authentication session expired

**Solution:** Log out and log back in through the website.

### Videos Not Playing
**Cause:** Video not transcoded or file missing

**Solution:**
1. Check if video file exists in `backend/uploads/videos/`
2. Check video status in database:
```bash
psql -U postgres -d get_noticed -c "SELECT id, title, status, \"hlsUrl\" FROM videos;"
```
3. Re-upload video if status is not 'ready'

### Images Not Loading
**Cause:** Upload path incorrect or file missing

**Solution:**
1. Check if file exists in `backend/uploads/`
2. Verify the URL path in browser Network tab
3. Check backend console for errors

---

## Useful Commands Reference

### Process Management
```bash
# List all node processes
ps aux | grep node

# Kill all node processes
killall node

# Kill specific port
kill $(lsof -t -i:PORT_NUMBER)
```

### Viewing Logs
```bash
# Backend logs (while running)
cd backend && npm run dev

# System logs
journalctl -u postgresql -f
journalctl -u redis -f
```

### Database Quick Reference
```bash
# Connect
psql -U postgres -d get_noticed

# Inside psql:
\dt                 # List tables
\d tablename        # Describe table
\du                 # List users
\l                  # List databases
\q                  # Quit
```

### NPM Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev        # Backend
npm start          # Frontend

# Build for production
npm run build

# Run tests
npm test

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Git Commands
```bash
# Check status
git status

# Pull latest changes
git pull origin main

# View recent commits
git log --oneline -10
```

---

## Testing

### Run Backend API Tests
```bash
cd talent-discovery-platform/backend
npm test
```

### Run E2E Tests (Browser Tests)
```bash
# Make sure backend and frontend are running first!

cd talent-discovery-platform/e2e
npm install
npx playwright install
npx playwright test --headed --project=chromium
```

---

## Environment Variables

### Backend (.env file)
```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/get_noticed
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Frontend (.env file)
```
REACT_APP_API_URL=http://localhost:4000/api/v1
PORT=3001
```

---

## Support Contacts

For additional help:
- Check GitHub Issues: https://github.com/your-repo/issues
- Review documentation in the `/docs` folder
- Check backend logs for detailed error messages

---

*Last Updated: January 2025*
