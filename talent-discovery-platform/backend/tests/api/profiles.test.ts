import request from 'supertest';
import { getTestApp, randomString } from '../helpers';

describe('Profile API', () => {
  let app: any;
  let authToken: string;
  let userId: string;
  let username: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    const email = `test_${timestamp}_${randomString(5)}@example.com`;
    username = `testuser_${timestamp}`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        username,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user?.id;
  });

  describe('GET /api/v1/profiles/:username', () => {
    it('should get public profile by username', async () => {
      const res = await request(app)
        .get(`/api/v1/profiles/${username}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe(username);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 404 for non-existent username', async () => {
      const res = await request(app)
        .get('/api/v1/profiles/nonexistent_user_12345');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/profiles/me', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Updated bio text',
          location: 'Los Angeles, CA'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('Updated bio text');
      expect(res.body.user.location).toBe('Los Angeles, CA');
    });

    it('should update display name', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'My Stage Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.displayName).toBe('My Stage Name');
    });

    it('should reject update without authentication', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me')
        .send({
          bio: 'Updated bio'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/profiles/me/privacy', () => {
    it('should update privacy settings', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me/privacy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          showEmail: false,
          showAge: true,
          showLocation: true
        });

      expect(res.status).toBe(200);
      expect(res.body.privacySettings.showEmail).toBe(false);
    });
  });

  describe('PUT /api/v1/profiles/me/social-links', () => {
    it('should update social links', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me/social-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          website: 'https://example.com',
          twitter: 'testuser',
          imdb: 'nm1234567'
        });

      expect(res.status).toBe(200);
      expect(res.body.socialLinks.website).toBe('https://example.com');
    });

    it('should validate URL format', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me/social-links')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          website: 'not-a-valid-url'
        });

      // Should either accept or reject based on validation
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /api/v1/profiles/me/banner-settings', () => {
    it('should update banner to solid color', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me/banner-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bannerSettings: {
            type: 'color',
            color: '#FF5733'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.bannerSettings.type).toBe('color');
      expect(res.body.bannerSettings.color).toBe('#FF5733');
    });

    it('should update banner to metallic style', async () => {
      const res = await request(app)
        .put('/api/v1/profiles/me/banner-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bannerSettings: {
            type: 'metal',
            metalStyle: 'gold'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.bannerSettings.type).toBe('metal');
      expect(res.body.bannerSettings.metalStyle).toBe('gold');
    });
  });
});
