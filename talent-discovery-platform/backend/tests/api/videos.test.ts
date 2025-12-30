import request from 'supertest';
import { app } from '../../src/index';
import { randomString } from '../helpers';

describe('Videos API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const timestamp = Date.now();
    const email = `test_${timestamp}_${randomString(5)}@example.com`;

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        username: `testuser_${timestamp}`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  describe('GET /api/videos', () => {
    it('should return a list of public videos', async () => {
      const res = await request(app)
        .get('/api/videos')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
      expect(Array.isArray(res.body.videos)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/videos')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/videos')
        .query({ categoryId: 'some-category-id' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return 404 for non-existent video', async () => {
      const res = await request(app)
        .get('/api/videos/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/videos/trending', () => {
    it('should return trending videos', async () => {
      const res = await request(app)
        .get('/api/videos/trending');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
      expect(Array.isArray(res.body.videos)).toBe(true);
    });
  });

  describe('POST /api/videos/:id/like', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/videos/some-video-id/like');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/videos/feed', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/videos/feed');

      expect(res.status).toBe(401);
    });

    it('should return personalized feed when authenticated', async () => {
      const res = await request(app)
        .get('/api/videos/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });
});
