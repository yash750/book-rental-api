const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const User = require('../../../models/user');

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

describe('auth routes', () => {
  test('registers a user and hashes password', async () => {
    const res = await request(app).post('/auth/register').send({ name: 't', email: 't@e.com', password: 'pass' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    const user = await User.findOne({ email: 't@e.com' });
    expect(user).toBeTruthy();
    expect(user.password).not.toBe('pass');
  });

  test('prevents duplicate registration', async () => {
    await request(app).post('/auth/register').send({ name: 't', email: 'dup@e.com', password: 'pass' });
    const res = await request(app).post('/auth/register').send({ name: 't', email: 'dup@e.com', password: 'pass' });
    expect(res.status).toBe(400);
  });

  test('registers admin role', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'admin', email: 'admin@e.com', password: 'pass', role: 'admin' });
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.role).toBe('admin');
  });

  test('logs in with valid credentials', async () => {
    await request(app).post('/auth/register').send({ name: 'u', email: 'login@e.com', password: 'pass' });
    const res = await request(app).post('/auth/login').send({ email: 'login@e.com', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/auth/register').send({ name: 'u', email: 'wrong@e.com', password: 'pass' });
    const res = await request(app).post('/auth/login').send({ email: 'wrong@e.com', password: 'bad' });
    expect(res.status).toBe(401);
  });

  test('returns profile for authenticated user', async () => {
    const reg = await request(app).post('/auth/register').send({ name: 'u', email: 'prof@e.com', password: 'pass' });
    const res = await request(app).get('/auth/profile').set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('prof@e.com');
    expect(res.body.password).toBeUndefined();
  });

  test('rejects profile access with invalid token', async () => {
    const res = await request(app).get('/auth/profile').set('Authorization', 'Bearer bad');
    expect(res.status).toBe(401);
  });
});
