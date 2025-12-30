import request from 'supertest';
import { app } from '../../src/index';
import { randomString } from '../helpers';

describe('Reports API', () => {
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

  describe('POST /api/reports', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          targetId: '00000000-0000-0000-0000-000000000000',
          targetType: 'video',
          type: 'spam'
        });

      expect(res.status).toBe(401);
    });

    it('should require valid targetType', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetId: '00000000-0000-0000-0000-000000000000',
          targetType: 'invalid',
          type: 'spam'
        });

      expect(res.status).toBe(400);
    });

    it('should require valid report type', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetId: '00000000-0000-0000-0000-000000000000',
          targetType: 'video',
          type: 'invalid_type'
        });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent target', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetId: '00000000-0000-0000-0000-000000000000',
          targetType: 'video',
          type: 'spam',
          description: 'This is spam'
        });

      expect(res.status).toBe(404);
    });

    it('should accept valid report types', () => {
      const validTypes = [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'sexual_content',
        'copyright',
        'misinformation',
        'impersonation',
        'other'
      ];
      expect(validTypes).toHaveLength(9);
    });

    it('should accept valid target types', () => {
      const validTargets = ['video', 'comment', 'user'];
      expect(validTargets).toHaveLength(3);
    });
  });

  describe('GET /api/reports/my-reports', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/reports/my-reports');

      expect(res.status).toBe(401);
    });

    it('should return empty reports for new user', async () => {
      const res = await request(app)
        .get('/api/reports/my-reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/reports/my-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
    });
  });
});
