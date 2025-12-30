import request from 'supertest';
import { getTestApp, randomString } from '../helpers';

describe('Videos API', () => {
  let app: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    const email = `test_${timestamp}_${randomString(5)}@example.com`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        username: `testuser_${timestamp}`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user?.id;
  });

  describe('GET /api/v1/videos', () => {
    it('should return a list of public videos', async () => {
      const res = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
      expect(Array.isArray(res.body.videos)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/videos')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/v1/videos')
        .query({ categoryId: 'some-category-id' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/videos/:id', () => {
    it('should return 404 for non-existent video', async () => {
      const res = await request(app)
        .get('/api/v1/videos/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/videos/trending', () => {
    it('should return trending videos', async () => {
      const res = await request(app)
        .get('/api/v1/videos/trending');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
      expect(Array.isArray(res.body.videos)).toBe(true);
    });
  });

  describe('POST /api/v1/videos/:id/like', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/videos/some-video-id/like');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/videos/feed', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/videos/feed');

      expect(res.status).toBe(401);
    });

    it('should return personalized feed when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/videos/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });
});
