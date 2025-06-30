const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../app');
const Book = require('../../../models/Book');
let mongoServer;
let tokenA;
let tokenB;

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

describe('rentals extra', () => {
  beforeEach(async () => {
    tokenA = await register('a');
    tokenB = await register('b');
  });

  test('returning twice yields error', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${tokenA}`).send({ bookId: book._id });
    await request(app).post('/rentals/return').set('Authorization', `Bearer ${tokenA}`).send({ bookId: book._id });
    const res = await request(app).post('/rentals/return').set('Authorization', `Bearer ${tokenA}`).send({ bookId: book._id });
    expect(res.status).toBe(400);
  });

  test('book becomes rentable after return', async () => {
    const book = await Book.create({ title: 'b', stock: 1 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${tokenA}`).send({ bookId: book._id });
    await request(app).post('/rentals/return').set('Authorization', `Bearer ${tokenA}`).send({ bookId: book._id });
    const rentB = await request(app).post('/rentals').set('Authorization', `Bearer ${tokenB}`).send({ bookId: book._id });
    expect(rentB.status).toBe(201);
  });

  test('history empty when no rentals', async () => {
    const res = await request(app).get('/rentals/history').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('invalid book id returns error', async () => {
    const rent = await request(app).post('/rentals').set('Authorization', `Bearer ${tokenA}`).send({ bookId: 'bad' });
    expect(rent.status).toBe(500);
    const ret = await request(app).post('/rentals/return').set('Authorization', `Bearer ${tokenA}`).send({ bookId: 'bad' });
    expect(ret.status).toBe(500);
  });
});
