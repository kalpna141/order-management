import request from 'supertest';
import createApp from '../src/app.js';

const app = createApp();

describe('Menu API', () => {
  describe('GET /api/menu', () => {
    it('returns the seeded list of menu items', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });
  });

  describe('GET /api/menu/:id', () => {
    it('returns a single menu item', async () => {
      const list = await request(app).get('/api/menu');
      const target = list.body[0];

      const res = await request(app).get(`/api/menu/${target.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(target.id);
    });

    it('returns 404 for a non-existent item', async () => {
      const res = await request(app).get('/api/menu/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/menu', () => {
    it('creates a new menu item with valid data', async () => {
      const res = await request(app).post('/api/menu').send({
        name: 'Veggie Wrap',
        description: 'Grilled veggies wrapped in a warm tortilla.',
        price: 6.5,
        image: 'https://example.com/wrap.jpg',
        category: 'Wraps',
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Veggie Wrap');
      expect(res.body.price).toBe(6.5);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app).post('/api/menu').send({ name: 'Incomplete' });
      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('rejects a negative price', async () => {
      const res = await request(app).post('/api/menu').send({
        name: 'Bad Item',
        description: 'Invalid price test',
        price: -5,
        image: 'https://example.com/img.jpg',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/menu/:id', () => {
    it('updates an existing menu item', async () => {
      const list = await request(app).get('/api/menu');
      const target = list.body[0];

      const res = await request(app).put(`/api/menu/${target.id}`).send({
        name: target.name,
        description: target.description,
        price: 99.99,
        image: target.image,
      });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(99.99);
    });

    it('returns 404 when updating a non-existent item', async () => {
      const res = await request(app).put('/api/menu/does-not-exist').send({
        name: 'X',
        description: 'Y',
        price: 1,
        image: 'https://example.com/x.jpg',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/menu/:id', () => {
    it('deletes an existing menu item', async () => {
      const list = await request(app).get('/api/menu');
      const target = list.body[0];

      const res = await request(app).delete(`/api/menu/${target.id}`);
      expect(res.status).toBe(204);

      const check = await request(app).get(`/api/menu/${target.id}`);
      expect(check.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent item', async () => {
      const res = await request(app).delete('/api/menu/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});
