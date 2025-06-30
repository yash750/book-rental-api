const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../app');
const Book = require('../../../models/Book');
let mongoServer;
let adminToken;

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

const register = async role => {
  const res = await request(app).post('/auth/register').send({ name: role, email: `${role}@e.com`, password: 'pass', role });
  return res.body.token;
};

describe('books extra', () => {
  beforeEach(async () => {
    adminToken = await register('admin');
  });

  test('update and delete not found return 404', async () => {
    const upd = await request(app).put('/books/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${adminToken}`).send({ title: 'x' });
    expect(upd.status).toBe(404);
    const del = await request(app).delete('/books/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(404);
  });

  test('update requires valid token', async () => {
    const book = await Book.create({ title: 'b' });
    const res = await request(app).put(`/books/${book._id}`).send({ title: 'bb' });
    expect(res.status).toBe(401);
  });

  test('handle invalid book id', async () => {
    const res = await request(app).get('/books/invalid-id');
    expect(res.status).toBe(500);
  });
});
