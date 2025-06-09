const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

// --- Layer 1: Basic Functional Tests for /auth
setTimeout(() => {
  jest.setTimeout(10000);
})
describe('Auth API', () => {
  test('registers a user and returns a token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'John', email: 'john@example.com', password: 'pass123' });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test('login returns a token for valid credentials', async () => {
    const user = new User({ name: 'Jane', email: 'jane@example.com', password: 'secret' });
    await user.save();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'secret' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('gets profile for authenticated user', async () => {
    const user = new User({ name: 'Bob', email: 'bob@example.com', password: 'secret' });
    await user.save();
    const login = await request(app).post('/auth/login').send({ email: 'bob@example.com', password: 'secret' });
    const token = login.body.token;
    const res = await request(app).get('/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('bob@example.com');
    expect(res.body.password).toBeUndefined();
  });

  // --- Layer 2: Edge Cases for /auth

  test('fails to register with duplicate email', async () => {
    await request(app).post('/auth/register').send({ name: 'Joe', email: 'joe@example.com', password: 'pass' });
    const res = await request(app).post('/auth/register').send({ name: 'Joe', email: 'joe@example.com', password: 'pass' });
    expect(res.statusCode).toBe(400);
  });

  test('login fails with wrong password', async () => {
    const user = new User({ name: 'Sam', email: 'sam@example.com', password: 'good' });
    await user.save();
    const res = await request(app).post('/auth/login').send({ email: 'sam@example.com', password: 'bad' });
    expect(res.statusCode).toBe(401);
  });

  test('profile route fails without token', async () => {
    const res = await request(app).get('/auth/profile');
    expect(res.statusCode).toBe(401);
  });

  // --- Layer 3: Real World for /auth

  test('token cannot be used if malformed', async () => {
    const res = await request(app).get('/auth/profile').set('Authorization', 'Bearer wrong.token');
    expect(res.statusCode).toBe(401);
  });
});

