const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User.model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test-secret-for-auth';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

describe('Auth API', () => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };

    const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
    };

    describe('POST /auth/register', () => {
        it('should register a new user with default "user" role and return a token', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');

            const userInDb = await User.findOne({ email: userData.email });
            expect(userInDb).not.toBeNull();
            expect(userInDb.role).toBe('user');
            expect(userInDb.borrowedBooksCount).toBe(0);
            expect(userInDb.outstandingFine).toBe(0);
        });

        it('should allow registration of an admin user when role is specified', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(adminData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');

            const userInDb = await User.findOne({ email: adminData.email });
            expect(userInDb).not.toBeNull();
            expect(userInDb.role).toBe('admin');
        });

        it('should default role to "user" if an invalid role is provided', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ ...userData, email: 'test2@example.com', role: 'superadmin' });

            expect(res.status).toBe(201);
            const userInDb = await User.findOne({ email: 'test2@example.com' });
            expect(userInDb.role).toBe('user');
        });

        it('should return 400 if email is already taken', async () => {
            await new User(userData).save();
            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('duplicate key error');
        });

        it('should return 400 for missing password', async () => {
            const { password, ...userWithoutPassword } = userData;
            const res = await request(app)
                .post('/auth/register')
                .send(userWithoutPassword);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('`password` is required');
        });

        it('should return 400 for missing email', async () => {
            const { email, ...userWithoutEmail } = userData;
            const res = await request(app)
                .post('/auth/register')
                .send(userWithoutEmail);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('`email` is required');
        });

        it('should ignore extra fields in the payload', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ ...userData, unexpectedField: 'shouldBeIgnored' });

            expect(res.status).toBe(201);
            const userInDb = await User.findOne({ email: userData.email });
            expect(userInDb).not.toBeNull();
            expect(userInDb.unexpectedField).toBeUndefined();
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/auth/register').send(userData);
        });

        it('should login a registered user and return a token', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 for invalid credentials (wrong password)', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should return 401 for a non-existent user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: 'nouser@example.com', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should return 401 if password is not provided', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });
    });

    describe('GET /auth/profile', () => {
        let user;
        let token;

        beforeEach(async () => {
            const registerRes = await request(app).post('/auth/register').send(userData);
            token = registerRes.body.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id);
        });

        it('should get the user profile with a valid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(userData.email);
            expect(res.body.name).toBe(userData.name);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 401 if no token is provided', async () => {
            const res = await request(app).get('/auth/profile');
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Access denied');
        });

        it('should return 401 for an invalid token signature', async () => {
            const badToken = jwt.sign({ id: user._id, role: user.role }, 'wrong-secret');
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${badToken}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid token');
        });

        it('should return 401 for a malformed token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer not-a-real-token`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid token');
        });

        it('should return 401 for an expired token', async () => {
            const expiredToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '0s' });
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid token');
        });

        it('should return 404 if user in token does not exist in DB', async () => {
            await User.findByIdAndDelete(user._id);
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('User not found');
        });
    });
});