const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Book = require('../models/Book');

exports.createUserToken = async (role = 'user', overrides = {}) => {
  const user = new User({
    name: 'Test User',
    email: `user${Date.now()}@example.com`,
    password: 'password',
    role,
    ...overrides,
  });
  await user.save();
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  return { user, token };
};

exports.createBook = async (adminToken, overrides = {}) => {
  const request = require('supertest');
  const app = require('../app');
  const data = {
    title: 'Test Book',
    author: 'Some Author',
    stock: 3,
    ...overrides,
  };
  const res = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(data);
  return res.body;
};
