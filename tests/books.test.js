const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const { createUserToken, createBook } = require('./utils');

// --- Layer 1: Basic Functional Tests for /books
describe('Book Endpoints - Basic', () => {
  test('should list books (empty array initially)', async () => {
    const res = await request(app).get('/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('admin can add and retrieve a book', async () => {
    const { token } = await createUserToken('admin');
    const book = await createBook(token, { title: 'Book A' });

    const res = await request(app).get(`/books/${book._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Book A');
  });

  test('admin can update and delete a book', async () => {
    const { token } = await createUserToken('admin');
    const book = await createBook(token, { title: 'Book B' });

    const update = await request(app)
      .put(`/books/${book._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Book' });
    expect(update.statusCode).toBe(200);
    expect(update.body.title).toBe('Updated Book');

    const del = await request(app)
      .delete(`/books/${book._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.statusCode).toBe(200);
    expect(del.body.message).toBe('Book deleted');
  });
});

// --- Layer 2: Edge Case & Validation Testing for /books
describe('Book Endpoints - Edge Cases', () => {
  test('non-admin cannot add a book', async () => {
    const { token } = await createUserToken('user');
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fail Book', author: 'X', stock: 1 });
    expect(res.statusCode).toBe(403);
  });

  test('get book with invalid id returns 404', async () => {
    const res = await request(app).get('/books/612345678901234567890123');
    expect(res.statusCode).toBe(404);
  });
});

// --- Layer 3: Out-of-the-Box & Production Practices for /books
describe('Book Endpoints - Production Scenarios', () => {
  test('should handle long title when adding book', async () => {
    const { token } = await createUserToken('admin');
    const longTitle = 'b'.repeat(500);
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: longTitle, author: 'Author', stock: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(longTitle);
  });

  test('missing auth header results in 401', async () => {
    const res = await request(app).post('/books').send({ title: 'X', author: 'Y', stock: 1 });
    expect(res.statusCode).toBe(401);
  });
});
