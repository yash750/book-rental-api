const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

// --- Layer 1: Basic Functional Tests for /auth
describe('Auth Endpoints - Basic', () => {
  test('should register a new user and return token', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'John',
      email: 'john@example.com',
      password: 'password'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('should login an existing user and return token', async () => {
    await request(app).post('/auth/register').send({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'password'
    });
    const res = await request(app).post('/auth/login').send({
      email: 'jane@example.com',
      password: 'password'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

// --- Layer 2: Edge Case & Validation Testing for /auth
describe('Auth Endpoints - Edge Cases', () => {
  test('should not allow duplicate email registration', async () => {
    await request(app).post('/auth/register').send({
      name: 'Dup',
      email: 'dup@example.com',
      password: 'password'
    });
    const res = await request(app).post('/auth/register').send({
      name: 'Dup2',
      email: 'dup@example.com',
      password: 'password'
    });
    expect(res.statusCode).toBe(400);
  });

  test('should reject login with wrong password', async () => {
    await request(app).post('/auth/register').send({
      name: 'Mark',
      email: 'mark@example.com',
      password: 'password'
    });
    const res = await request(app).post('/auth/login').send({
      email: 'mark@example.com',
      password: 'wrong'
    });
    expect(res.statusCode).toBe(401);
  });
});

// --- Layer 3: Out-of-the-Box & Production Practices for /auth
describe('Auth Endpoints - Production Scenarios', () => {
  test('should handle very long names on register', async () => {
    const longName = 'a'.repeat(1000);
    const res = await request(app).post('/auth/register').send({
      name: longName,
      email: `long${Date.now()}@example.com`,
      password: 'password'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('should reject login when password is missing', async () => {
    await request(app).post('/auth/register').send({
      name: 'NoPass',
      email: 'nopass@example.com',
      password: 'password'
    });
    const res = await request(app).post('/auth/login').send({
      email: 'nopass@example.com'
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
