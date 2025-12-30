import request from 'supertest';
import { getTestApp, randomString } from '../helpers';

describe('Authentication API', () => {
  let app: any;

  const testUserData = {
    email: '',
    username: '',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    // Generate unique test data for each test
    const timestamp = Date.now();
    testUserData.email = `test_${timestamp}_${randomString(5)}@example.com`;
    testUserData.username = `testuser_${timestamp}`;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: testUserData.username,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUserData.email);
      expect(res.body.user.username).toBe(testUserData.username);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          username: testUserData.username,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: testUserData.username,
          password: '123',
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: testUserData.username,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });

      // Duplicate registration
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: `different_${Date.now()}`,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: testUserData.username,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUserData.email,
          password: testUserData.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUserData.email,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: testUserData.password
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserData.email,
          username: testUserData.username,
          password: testUserData.password,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName
        });
      authToken = registerRes.body.token;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUserData.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
    });
  });
});
