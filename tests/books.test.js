const request = require('supertest');
const app = require('../app');
const User = require('../models/user');
const Book = require('../models/Book');

async function getAdminToken() {
  const admin = new User({ name: 'Admin', email: 'admin@example.com', password: 'pass', role: 'admin' });
  await admin.save();
  const res = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'pass' });
  return res.body.token;
}

// --- Layer 1: Basic Functional Tests for /books

describe('Book API', () => {
  test('adds, retrieves and deletes a book as admin', async () => {
    const token = await getAdminToken();
    const addRes = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Book A', author: 'Author A', stock: 5 });
    expect(addRes.statusCode).toBe(201);
    const bookId = addRes.body._id;

    const getRes = await request(app).get(`/books/${bookId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.title).toBe('Book A');

    const delRes = await request(app)
      .delete(`/books/${bookId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.message).toBe('Book deleted');
  });

  test('lists books', async () => {
    await Book.create({ title: 'Book1', author: 'A', stock: 1 });
    const res = await request(app).get('/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // --- Layer 2: Edge Cases for /books
  test('cannot get non-existent book', async () => {
    const res = await request(app).get('/books/612345678901234567890123');
    expect(res.statusCode).toBe(404);
  });

  test('user cannot add book', async () => {
    const user = new User({ name: 'User', email: 'user@example.com', password: 'pass' });
    await user.save();
    const login = await request(app).post('/auth/login').send({ email: 'user@example.com', password: 'pass' });
    const token = login.body.token;
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Book', author: 'A', stock: 1 });
    expect(res.statusCode).toBe(403);
  });

  test('fails to delete with invalid token', async () => {
    const book = await Book.create({ title: 'Bad', author: 'B', stock: 1 });
    const res = await request(app)
      .delete(`/books/${book._id}`)
      .set('Authorization', 'Bearer invalid.token');
    expect(res.statusCode).toBe(401);
  });

  // --- Layer 3: Real World for /books
  test('update book with long title', async () => {
    const token = await getAdminToken();
    const book = await Book.create({ title: 'Old', author: 'A', stock: 1 });
    const longTitle = 'A'.repeat(300);
    const res = await request(app)
      .put(`/books/${book._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: longTitle });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(longTitle);
  });
});

