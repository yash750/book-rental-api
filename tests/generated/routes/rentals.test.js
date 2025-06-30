const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../app');
const Book = require('../../../models/Book');
const Rental = require('../../../models/Rental');
let mongoServer;
let userToken;
let otherToken;

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

const register = async name => {
  const res = await request(app).post('/auth/register').send({ name, email: `${name}@e.com`, password: 'pass' });
  return res.body.token;
};

describe('rental routes', () => {
  beforeEach(async () => {
    userToken = await register('user');
    otherToken = await register('other');
  });

  test('rents and returns a book', async () => {
    const book = await Book.create({ title: 'b', author: 'a', stock: 1 });
    const rent = await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    expect(rent.status).toBe(201);
    const stored = await Book.findById(book._id);
    expect(stored.stock).toBe(0);
    const ret = await request(app).post('/rentals/return').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    expect(ret.status).toBe(200);
    expect(ret.body.message).toBe('Book returned');
    const updated = await Book.findById(book._id);
    expect(updated.stock).toBe(1);
  });

  test('cannot rent unavailable book', async () => {
    const book = await Book.create({ title: 'b', stock: 0 });
    const res = await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    expect(res.status).toBe(400);
  });

  test('renting same book twice when stock runs out fails', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    const res = await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    expect(res.status).toBe(400);
  });

  test('returning without active rental', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    const res = await request(app).post('/rentals/return').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    expect(res.status).toBe(400);
  });

  test('other user cannot return rental', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    const res = await request(app).post('/rentals/return').set('Authorization', `Bearer ${otherToken}`).send({ bookId: book._id });
    expect(res.status).toBe(400);
  });

  test('history returns rentals for user', async () => {
    const book = await Book.create({ title: 'b', stock: 2 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    await request(app).post('/rentals/return').set('Authorization', `Bearer ${userToken}`).send({ bookId: book._id });
    const res = await request(app).get('/rentals/history').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('authentication required for rental actions', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    const rent = await request(app).post('/rentals').send({ bookId: book._id });
    expect(rent.status).toBe(401);
    const ret = await request(app).post('/rentals/return').send({ bookId: book._id });
    expect(ret.status).toBe(401);
    const hist = await request(app).get('/rentals/history');
    expect(hist.status).toBe(401);
  });
});
