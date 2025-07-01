const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User.model');

let mongoServer;

const JEST_TIMEOUT = 60000; // 60 seconds

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, JEST_TIMEOUT);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, JEST_TIMEOUT);

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.role).toBe('user');
    });

    it('should register a new admin user if role is specified', async () => {
        const res = await request(app)
          .post('/auth/register')
          .send({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
          });
  
        expect(res.statusCode).toEqual(201);
        const user = await User.findOne({ email: 'admin@example.com' });
        expect(user.role).toBe('admin');
      });

    it('should return 400 for duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password456',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
        await request(app)
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: 'login@example.com',
            password: 'password123',
          });
      });

    it('should login an existing user and return a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
        const res = await request(app)
          .post('/auth/login')
          .send({
            email: 'login@example.com',
            password: 'wrongpassword',
          });
  
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid credentials');
      });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile for an authenticated user', async () => {
        const loginRes = await request(app)
            .post('/auth/register')
            .send({ name: 'Profile User', email: 'profile@example.com', password: 'password123' });

        const token = loginRes.body.token;

        const profileRes = await request(app)
            .get('/auth/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(profileRes.statusCode).toEqual(200);
        expect(profileRes.body.email).toBe('profile@example.com');
        expect(profileRes.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).get('/auth/profile');
        expect(res.statusCode).toEqual(401);
    });
  });
});