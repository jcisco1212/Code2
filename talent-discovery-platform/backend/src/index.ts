import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

import { sequelize } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import videoRoutes from './routes/videos';
import profileRoutes from './routes/profiles';
import commentRoutes from './routes/comments';
import followRoutes from './routes/follows';
import likeRoutes from './routes/likes';
import categoryRoutes from './routes/categories';
import agentRoutes from './routes/agents';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import messageRoutes from './routes/messages';
import savedVideoRoutes from './routes/savedVideos';
import historyRoutes from './routes/history';
import playlistRoutes from './routes/playlists';
import castingListRoutes from './routes/castingLists';
import announcementRoutes from './routes/announcements';
import talentNotesRoutes from './routes/talentNotes';
import adminAuditLogsRoutes from './routes/adminAuditLogs';
import blocksRoutes from './routes/blocks';
import clipsRoutes from './routes/clips';
import compCardsRoutes from './routes/compCards';
import chatRoomsRoutes from './routes/chatRooms';
import contactRoutes from './routes/contact';
import challengesRoutes from './routes/challenges';
import achievementsRoutes from './routes/achievements';
import duetsRoutes from './routes/duets';
import watchPartiesRoutes from './routes/watchParties';
import featureFlagsRoutes from './routes/featureFlags';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(','),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*.amazonaws.com', 'localhost:*'],
      mediaSrc: ["'self'", 'blob:', '*.amazonaws.com', '*.cloudfront.net', 'localhost:*'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'localhost:*']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'),
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Serve uploaded files (for development without S3)
// Disable CORP header for uploads to allow cross-origin access
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/follows', followRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/saved-videos', savedVideoRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/casting-lists', castingListRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/talent-notes', talentNotesRoutes);
app.use('/api/v1/admin/audit-logs', adminAuditLogsRoutes);
app.use('/api/v1/blocks', blocksRoutes);
app.use('/api/v1/clips', clipsRoutes);
app.use('/api/v1/comp-cards', compCardsRoutes);
app.use('/api/v1/chat-rooms', chatRoomsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/challenges', challengesRoutes);
app.use('/api/v1/achievements', achievementsRoutes);
app.use('/api/v1/duets', duetsRoutes);
app.use('/api/v1/watch-parties', watchPartiesRoutes);
app.use('/api/v1/features', featureFlagsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    logger.info(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Initialize database and start server
const PORT = parseInt(process.env.PORT || '4000');
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established successfully');

    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

startServer();

export { app, io };
