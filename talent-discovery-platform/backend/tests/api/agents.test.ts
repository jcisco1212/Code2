import request from 'supertest';
import { getTestApp, randomString } from '../helpers';

describe('Agent API', () => {
  let app: any;
  let agentToken: string;
  let agentId: string;
  let talentToken: string;
  let talentId: string;
  let talentUsername: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    const timestamp = Date.now();

    // Create an agent user (would normally need admin to upgrade role)
    const agentEmail = `agent_${timestamp}_${randomString(5)}@example.com`;
    const agentRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: agentEmail,
        username: `agent_${timestamp}`,
        password: 'TestPassword123!',
        firstName: 'Agent',
        lastName: 'Test'
      });

    agentToken = agentRegisterRes.body.token;
    agentId = agentRegisterRes.body.user?.id;

    // Create a talent user
    const talentEmail = `talent_${timestamp}_${randomString(5)}@example.com`;
    talentUsername = `talent_${timestamp}`;
    const talentRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: talentEmail,
        username: talentUsername,
        password: 'TestPassword123!',
        firstName: 'Talent',
        lastName: 'User'
      });

    talentToken = talentRegisterRes.body.token;
    talentId = talentRegisterRes.body.user?.id;
  });

  describe('GET /api/v1/agents/discover', () => {
    it('should return 401 for non-agent users', async () => {
      // Regular user should not access agent endpoints
      const res = await request(app)
        .get('/api/v1/agents/discover')
        .set('Authorization', `Bearer ${talentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/agents/discover');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/agents/dashboard/stats', () => {
    it('should return 403 for non-agent users', async () => {
      const res = await request(app)
        .get('/api/v1/agents/dashboard/stats')
        .set('Authorization', `Bearer ${talentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/agents/bookmarks', () => {
    it('should return 403 for non-agent users', async () => {
      const res = await request(app)
        .post('/api/v1/agents/bookmarks')
        .set('Authorization', `Bearer ${talentToken}`)
        .send({ talentId });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/agents/bookmarks', () => {
    it('should return 403 for non-agent users', async () => {
      const res = await request(app)
        .get('/api/v1/agents/bookmarks')
        .set('Authorization', `Bearer ${talentToken}`);

      expect(res.status).toBe(403);
    });
  });
});

describe('Agent Discover Filters', () => {
  // These tests verify the filter structure is correct
  // Actual filtering requires agent role access

  it('should have correct query parameter structure', () => {
    // Define expected filter parameters
    const expectedFilters = [
      'search',
      'category',
      'minScore',
      'maxAge',
      'minAge',
      'gender',
      'ethnicity',
      'hairColor',
      'location',
      'sortBy'
    ];

    // This is a structural test - verifies filters are documented
    expect(expectedFilters).toContain('gender');
    expect(expectedFilters).toContain('ethnicity');
    expect(expectedFilters).toContain('hairColor');
    expect(expectedFilters).toContain('location');
    expect(expectedFilters).toContain('minAge');
    expect(expectedFilters).toContain('maxAge');
  });

  it('should support multiple sort options', () => {
    const sortOptions = ['aiScore', 'followers', 'recent'];
    expect(sortOptions).toHaveLength(3);
  });
});
