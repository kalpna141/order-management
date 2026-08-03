import request from 'supertest';
import createApp from '../src/app.js';
import Order from '../src/models/Order.js';

const app = createApp();

const validCustomer = {
  name: 'Jane Doe',
  address: '123 Main St, Springfield',
  phone: '9876543210',
};

async function getMenu() {
  const res = await request(app).get('/api/menu');
  return res.body;
}

describe('Order API', () => {
  describe('POST /api/orders', () => {
    it('places an order and computes the total server-side', async () => {
      const menu = await getMenu();
      const item = menu[0];

      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: item.id, quantity: 2 }],
          customer: validCustomer,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('Order Received');
      expect(res.body.totalAmount).toBeCloseTo(item.price * 2, 2);
      expect(res.body.items[0].quantity).toBe(2);
      expect(res.body.customer.name).toBe('Jane Doe');
    });

    it('supports multiple line items and sums the total correctly', async () => {
      const menu = await getMenu();
      const [itemA, itemB] = menu;

      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [
            { menuItemId: itemA.id, quantity: 1 },
            { menuItemId: itemB.id, quantity: 3 },
          ],
          customer: validCustomer,
        });

      const expectedTotal = itemA.price * 1 + itemB.price * 3;
      expect(res.status).toBe(201);
      expect(res.body.totalAmount).toBeCloseTo(expectedTotal, 2);
    });

    it('rejects an order with no items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [], customer: validCustomer });
      expect(res.status).toBe(400);
    });

    it('rejects an order with missing customer details', async () => {
      const menu = await getMenu();
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: menu[0].id, quantity: 1 }],
          customer: { name: 'Jane Doe' }, // missing address & phone
        });
      expect(res.status).toBe(400);
    });

    it('rejects an order with an invalid phone number', async () => {
      const menu = await getMenu();
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: menu[0].id, quantity: 1 }],
          customer: { ...validCustomer, phone: 'abc' },
        });
      expect(res.status).toBe(400);
    });

    it('rejects phone numbers containing more than 10 digits', async () => {
      const menu = await getMenu();
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: menu[0].id, quantity: 1 }],
          customer: { ...validCustomer, phone: '918626881161' },
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toMatch(/exactly 10 digits/i);
    });

    it('rejects an order referencing a non-existent menu item', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: 'does-not-exist', quantity: 1 }],
          customer: validCustomer,
        });
      expect(res.status).toBe(400);
    });

    it('rejects a quantity of zero or a non-integer quantity', async () => {
      const menu = await getMenu();
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: menu[0].id, quantity: 0 }],
          customer: validCustomer,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orders and /api/orders/:id', () => {
    it('lists placed orders', async () => {
      const menu = await getMenu();
      await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });

      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('filters orders by customer phone number', async () => {
      const menu = await getMenu();
      await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });
      await request(app)
        .post('/api/orders')
        .send({
          items: [{ menuItemId: menu[0].id, quantity: 1 }],
          customer: { ...validCustomer, phone: '9999999999' },
        });

      const res = await request(app).get('/api/orders').query({ phone: validCustomer.phone });
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].customer.phone).toBe(validCustomer.phone);
    });

    it('finds an international phone number using its local-number suffix', async () => {
      const menu = await getMenu();
      await Order.create({
        customer: { ...validCustomer, phone: '+918626881161', phoneNormalized: '918626881161' },
        items: [{ menuItemId: menu[0].id, name: menu[0].name, price: menu[0].price, quantity: 1 }],
        totalAmount: menu[0].price,
      });

      const res = await request(app).get('/api/orders').query({ phone: '8626881161' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].customer.phone).toBe('+918626881161');
    });

    it('fetches a single order by id', async () => {
      const menu = await getMenu();
      const created = await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });

      const res = await request(app).get(`/api/orders/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('returns 404 for a non-existent order', async () => {
      const res = await request(app).get('/api/orders/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('updates the order status to a valid value', async () => {
      const menu = await getMenu();
      const created = await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });

      const res = await request(app)
        .patch(`/api/orders/${created.body.id}/status`)
        .send({ status: 'Preparing' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Preparing');
    });

    it('rejects an invalid status value', async () => {
      const menu = await getMenu();
      const created = await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });

      const res = await request(app)
        .patch(`/api/orders/${created.body.id}/status`)
        .send({ status: 'Teleporting' });

      expect(res.status).toBe(400);
    });

    it('returns 404 when updating status of a non-existent order', async () => {
      const res = await request(app)
        .patch('/api/orders/does-not-exist/status')
        .send({ status: 'Preparing' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/orders/:id (cancel)', () => {
    it('cancels an existing order', async () => {
      const menu = await getMenu();
      const created = await request(app)
        .post('/api/orders')
        .send({ items: [{ menuItemId: menu[0].id, quantity: 1 }], customer: validCustomer });

      const res = await request(app).delete(`/api/orders/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Cancelled');
    });
  });
});
