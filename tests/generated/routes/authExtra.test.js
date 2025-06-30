const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
let mongoServer;

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

const register = data => request(app).post('/auth/register').send(data);

describe('auth extra', () => {
  test('sanitizes unexpected role', async () => {
    const res = await register({ name: 'x', email: 'x@e.com', password: 'p', role: 'super' });
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.role).toBe('user');
  });

  test('login fails for non existing user', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'no@e.com', password: 'p' });
    expect(res.status).toBe(401);
  });

  test('profile requires token header', async () => {
    await register({ name: 'u', email: 'u@e.com', password: 'p' });
    const res = await request(app).get('/auth/profile');
    expect(res.status).toBe(401);
  });
});
