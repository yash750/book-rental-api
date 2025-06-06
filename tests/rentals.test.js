const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const Rental = require('../models/Rental');
const { createUserToken, createBook } = require('./utils');

// --- Layer 1: Basic Functional Tests for /rentals
describe('Rental Endpoints - Basic', () => {
  test('user can rent and return a book', async () => {
    const { token } = await createUserToken('user');
    const admin = await createUserToken('admin');
    const book = await createBook(admin.token, { stock: 2 });

    const rentRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(rentRes.statusCode).toBe(201);

    const returnRes = await request(app)
      .post('/rentals/return')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(returnRes.statusCode).toBe(200);
    expect(returnRes.body.message).toBe('Book returned');
  });

  test('user can view rental history', async () => {
    const { token } = await createUserToken('user');
    const admin = await createUserToken('admin');
    const book = await createBook(admin.token);

    await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });

    const res = await request(app)
      .get('/rentals/history')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

// --- Layer 2: Edge Case & Validation Testing for /rentals
describe('Rental Endpoints - Edge Cases', () => {
  test('cannot rent unavailable book', async () => {
    const admin = await createUserToken('admin');
    const { token } = await createUserToken('user');
    const book = await createBook(admin.token, { stock: 0 });

    const res = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(res.statusCode).toBe(400);
  });

  test('returning non-rented book fails', async () => {
    const { token } = await createUserToken('user');
    const admin = await createUserToken('admin');
    const book = await createBook(admin.token);

    const res = await request(app)
      .post('/rentals/return')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(res.statusCode).toBe(400);
  });

  test('access history without auth should fail', async () => {
    const res = await request(app).get('/rentals/history');
    expect(res.statusCode).toBe(401);
  });
});

// --- Layer 3: Out-of-the-Box & Production Practices for /rentals
describe('Rental Endpoints - Production Scenarios', () => {
  test('should not allow renting same book twice without return', async () => {
    const user = await createUserToken('user');
    const admin = await createUserToken('admin');
    const book = await createBook(admin.token);

    await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ bookId: book._id });

    const res = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ bookId: book._id });
    expect(res.statusCode).toBe(400);
  });

  test('missing token results in 401 when renting', async () => {
    const admin = await createUserToken('admin');
    const book = await createBook(admin.token);

    const res = await request(app).post('/rentals').send({ bookId: book._id });
    expect(res.statusCode).toBe(401);
  });
});
