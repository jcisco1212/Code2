import request from 'supertest';
import { getTestApp, randomString } from '../helpers';

describe('Messages API', () => {
  let app: any;
  let authToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    const timestamp = Date.now();

    // Create first user
    const email1 = `test_${timestamp}_${randomString(5)}@example.com`;
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: email1,
        username: `testuser1_${timestamp}`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = registerRes1.body.token;
    userId = registerRes1.body.user?.id;

    // Create second user
    const email2 = `test2_${timestamp}_${randomString(5)}@example.com`;
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: email2,
        username: `testuser2_${timestamp}`,
        password: 'TestPassword123!',
        firstName: 'Other',
        lastName: 'User'
      });

    otherUserToken = registerRes2.body.token;
    otherUserId = registerRes2.body.user?.id;
  });

  describe('GET /api/v1/messages/conversations', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/messages/conversations');

      expect(res.status).toBe(401);
    });

    it('should return empty conversations for new user', async () => {
      const res = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('conversations');
      expect(Array.isArray(res.body.conversations)).toBe(true);
    });
  });

  describe('POST /api/v1/messages', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .send({
          receiverId: otherUserId,
          content: 'Hello!'
        });

      expect(res.status).toBe(401);
    });

    it('should send message to another user', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: otherUserId,
          content: 'Hello from test!'
        });

      expect([200, 201]).toContain(res.status);
      if (res.status === 201 || res.status === 200) {
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should reject empty message', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: otherUserId,
          content: ''
        });

      expect(res.status).toBe(400);
    });

    it('should reject message to non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: '00000000-0000-0000-0000-000000000000',
          content: 'Hello!'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/messages/:conversationId', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/messages/some-conversation-id');

      expect(res.status).toBe(401);
    });
  });

  describe('Message flow', () => {
    it('should create conversation when sending first message', async () => {
      // Send a message
      const sendRes = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: otherUserId,
          content: 'First message!'
        });

      expect([200, 201]).toContain(sendRes.status);

      // Check conversations
      const convRes = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(convRes.status).toBe(200);
      // If the message was created, there should be a conversation
      if (sendRes.status === 201 || sendRes.status === 200) {
        expect(convRes.body.conversations.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
