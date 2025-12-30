import request from 'supertest';
import { app } from '../../src/index';

describe('Categories API', () => {
  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      const res = await request(app)
        .get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/categories')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .get('/api/categories/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/categories/slug/:slug', () => {
    it('should return 404 for non-existent slug', async () => {
      const res = await request(app)
        .get('/api/categories/slug/nonexistent-category-slug');

      expect(res.status).toBe(404);
    });
  });

  describe('Category structure', () => {
    it('should have expected fields in category', async () => {
      const res = await request(app)
        .get('/api/categories');

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
