import request from 'supertest';
import { getTestApp } from '../helpers';

describe('Categories API', () => {
  let app: any;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe('GET /api/v1/categories', () => {
    it('should return list of categories', async () => {
      const res = await request(app)
        .get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return 404 for non-existent slug', async () => {
      const res = await request(app)
        .get('/api/v1/categories/slug/nonexistent-category-slug');

      expect(res.status).toBe(404);
    });
  });

  describe('Category structure', () => {
    it('should have expected fields in category', async () => {
      const res = await request(app)
        .get('/api/v1/categories');

      expect(res.status).toBe(200);
      if (res.body.categories.length > 0) {
        const category = res.body.categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });
  });
});
