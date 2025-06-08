const request = require('supertest');
const app = require('../app');
const User = require('../models/user');
const Book = require('../models/Book');
const Rental = require('../models/Rental');

async function getUserToken() {
  const user = new User({ name: 'Renter', email: 'renter@example.com', password: 'pass' });
  await user.save();
  const login = await request(app).post('/auth/login').send({ email: 'renter@example.com', password: 'pass' });
  return login.body.token;
}

// --- Layer 1: Basic Functional Tests for /rentals

describe('Rental API', () => {
  test('user rents and returns a book', async () => {
    const token = await getUserToken();
    const book = await Book.create({ title: 'Rentable', author: 'B', stock: 2 });

    const rentRes = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(rentRes.statusCode).toBe(201);
    const rental = await Rental.findOne({ bookId: book._id });
    expect(rental).not.toBeNull();

    const returnRes = await request(app)
      .post('/rentals/return')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(returnRes.statusCode).toBe(200);
    expect(returnRes.body.message).toBe('Book returned');
  });

  // --- Layer 2: Edge Cases for /rentals
  test('cannot rent unavailable book', async () => {
    const token = await getUserToken();
    const book = await Book.create({ title: 'Unavailable', author: 'X', stock: 0 });
    const res = await request(app)
      .post('/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(res.statusCode).toBe(400);
  });

  test('cannot return book not rented', async () => {
    const token = await getUserToken();
    const book = await Book.create({ title: 'Returnless', author: 'Y', stock: 1 });
    const res = await request(app)
      .post('/rentals/return')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book._id });
    expect(res.statusCode).toBe(400);
  });

  // --- Layer 3: Real World for /rentals
  test('renting same book twice decreases stock accordingly', async () => {
    const token = await getUserToken();
    const book = await Book.create({ title: 'Twice', author: 'Z', stock: 1 });
    await request(app).post('/rentals').set('Authorization', `Bearer ${token}`).send({ bookId: book._id });
    const second = await request(app).post('/rentals').set('Authorization', `Bearer ${token}`).send({ bookId: book._id });
    expect(second.statusCode).toBe(400); // stock was 1 then 0
  });
});

