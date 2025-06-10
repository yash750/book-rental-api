const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../app');
const Book = require('../../../models/Book');
let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  mongoServer = await MongoMemoryServer.create({ binary: { version: '4.4.10' } });
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const registerUser = async (role = 'user') => {
  const res = await request(app).post('/auth/register').send({ name: role, email: `${role}@e.com`, password: 'pass', role });
  return res.body.token;
};

describe('books routes', () => {
  beforeEach(async () => {
    adminToken = await registerUser('admin');
    userToken = await registerUser('user2');
  });

  test('gets empty books list', async () => {
    const res = await request(app).get('/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('admin adds a book', async () => {
    const res = await request(app).post('/books').set('Authorization', `Bearer ${adminToken}`).send({ title: 'b', author: 'a', stock: 2 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('b');
    const books = await Book.find();
    expect(books.length).toBe(1);
  });

  test('non admin cannot add book', async () => {
    const res = await request(app).post('/books').set('Authorization', `Bearer ${userToken}`).send({ title: 'b' });
    expect(res.status).toBe(403);
  });

  test('unauthenticated add book denied', async () => {
    const res = await request(app).post('/books').send({ title: 'b' });
    expect(res.status).toBe(401);
  });

  test('gets book by id and handles not found', async () => {
    const created = await request(app).post('/books').set('Authorization', `Bearer ${adminToken}`).send({ title: 'b', author: 'a', stock: 1 });
    const found = await request(app).get(`/books/${created.body._id}`);
    expect(found.status).toBe(200);
    expect(found.body.title).toBe('b');
    const nf = await request(app).get('/books/507f1f77bcf86cd799439011');
    expect(nf.status).toBe(404);
  });

  test('updates and deletes book as admin', async () => {
    const created = await request(app).post('/books').set('Authorization', `Bearer ${adminToken}`).send({ title: 'b', author: 'a', stock: 1 });
    const upd = await request(app).put(`/books/${created.body._id}`).set('Authorization', `Bearer ${adminToken}`).send({ title: 'bb' });
    expect(upd.status).toBe(200);
    expect(upd.body.title).toBe('bb');
    const del = await request(app).delete(`/books/${created.body._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    expect(del.body.message).toBe('Book deleted');
  });

  test('update and delete forbidden for user', async () => {
    const created = await request(app).post('/books').set('Authorization', `Bearer ${adminToken}`).send({ title: 'b', stock: 1 });
    const upd = await request(app).put(`/books/${created.body._id}`).set('Authorization', `Bearer ${userToken}`).send({ title: 'bb' });
    expect(upd.status).toBe(403);
    const del = await request(app).delete(`/books/${created.body._id}`).set('Authorization', `Bearer ${userToken}`);
    expect(del.status).toBe(403);
  });
});
