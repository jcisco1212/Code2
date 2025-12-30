import express, { Application, Express } from 'express';
import cors from 'cors';
import request from 'supertest';

let testApp: Application | null = null;
let dbInitialized = false;

/**
 * Initialize database for tests
 */
async function initializeDatabase(): Promise<void> {
  if (dbInitialized) return;

  try {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Import and connect to database
    const { sequelize } = await import('../src/config/database');
    await sequelize.authenticate();

    // Import and connect to Redis (with mock if not available)
    try {
      const { redis } = await import('../src/config/redis');
      await redis.ping();
    } catch (redisError) {
      // Redis might not be available in test environment, continue without it
      console.log('Redis not available for tests, continuing without it');
    }

    dbInitialized = true;
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

/**
 * Get or create test Express app (without starting server)
 */
export async function getTestApp(): Promise<Application> {
  if (testApp) {
    return testApp;
  }

  // Initialize database first
  await initializeDatabase();

  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Import routes dynamically (after database is initialized)
  const authRoutes = (await import('../src/routes/auth')).default;
  const userRoutes = (await import('../src/routes/users')).default;
  const videoRoutes = (await import('../src/routes/videos')).default;
  const profileRoutes = (await import('../src/routes/profiles')).default;
  const commentRoutes = (await import('../src/routes/comments')).default;
  const followRoutes = (await import('../src/routes/follows')).default;
  const likeRoutes = (await import('../src/routes/likes')).default;
  const categoryRoutes = (await import('../src/routes/categories')).default;
  const agentRoutes = (await import('../src/routes/agents')).default;
  const reportRoutes = (await import('../src/routes/reports')).default;
  const messageRoutes = (await import('../src/routes/messages')).default;

  // Mount routes with /api/v1 prefix
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/videos', videoRoutes);
  app.use('/api/v1/profiles', profileRoutes);
  app.use('/api/v1/comments', commentRoutes);
  app.use('/api/v1/follows', followRoutes);
  app.use('/api/v1/likes', likeRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/agents', agentRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/messages', messageRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test error:', err.message);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error'
    });
  });

  testApp = app;
  return app;
}

/**
 * Test helper utilities for API testing
 */

export interface TestUser {
  id: string;
  email: string;
  username: string;
  token: string;
  role: string;
}

/**
 * Create a test user and return auth token
 */
export async function createTestUser(
  app: Express,
  userData?: Partial<{
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }>
): Promise<TestUser> {
  const timestamp = Date.now();
  const defaultData = {
    email: `test_${timestamp}@example.com`,
    username: `testuser_${timestamp}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  const registerData = { ...defaultData, ...userData };

  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send(registerData);

  if (registerRes.status !== 201) {
    throw new Error(`Failed to create test user: ${JSON.stringify(registerRes.body)}`);
  }

  return {
    id: registerRes.body.user.id,
    email: registerData.email,
    username: registerData.username,
    token: registerRes.body.token,
    role: registerRes.body.user.role
  };
}

/**
 * Login and return auth token
 */
export async function loginTestUser(
  app: Express,
  identifier: string,
  password: string
): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier, password });

  if (res.status !== 200) {
    throw new Error(`Failed to login: ${JSON.stringify(res.body)}`);
  }

  return res.body.token;
}

/**
 * Make an authenticated request
 */
export function authRequest(app: Express, token: string) {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
}

/**
 * Clean up test user
 */
export async function cleanupTestUser(app: Express, token: string): Promise<void> {
  try {
    await authRequest(app, token).delete('/api/v1/users/me');
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Wait for a specified time
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Assert response shape
 */
export function expectSuccessResponse(res: request.Response) {
  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(300);
}

export function expectErrorResponse(res: request.Response, expectedStatus: number) {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toHaveProperty('message');
}
