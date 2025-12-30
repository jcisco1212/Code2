import { Express } from 'express';
import request from 'supertest';

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
    .post('/api/auth/register')
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
  email: string,
  password: string
): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

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
 * Clean up test data
 */
export async function cleanupTestUser(app: Express, token: string): Promise<void> {
  try {
    await authRequest(app, token).delete('/api/users/me');
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
