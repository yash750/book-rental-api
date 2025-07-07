const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Book = require('../models/Book.model');

// We will create a mock bookController and routes for testing purposes
// as they were not provided in the context.
const bookController = {
    createBook: async (req, res) => {
        try {
            const book = new Book(req.body);
            await book.save();
            res.status(201).json(book);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    getBooks: async (req, res) => {
        const books = await Book.find({});
        res.json(books);
    },
    getBookById: async (req, res) => {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return res.status(404).json({ message: 'Book not found' });
            res.json(book);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },
    updateBook: async (req, res) => {
        try {
            const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!book) return res.status(404).json({ message: 'Book not found' });
            res.json(book);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    deleteBook: async (req, res) => {
        try {
            const book = await Book.findByIdAndDelete(req.params.id);
            if (!book) return res.status(404).json({ message: 'Book not found' });
            res.status(200).json({ message: 'Book deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
};

// Mock middleware to simulate authentication and role checks
const mockAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For public routes, just continue
        if (req.method === 'GET') return next();
        return res.status(401).json({ message: 'Authentication token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const mockAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }
};

const app = express();
app.use(express.json());

// Setup mock routes
app.post('/books', mockAuth, mockAdmin, bookController.createBook);
app.get('/books', bookController.getBooks);
app.get('/books/:id', bookController.getBookById);
app.put('/books/:id', mockAuth, mockAdmin, bookController.updateBook);
app.delete('/books/:id', mockAuth, mockAdmin, bookController.deleteBook);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
});

describe('Book Controller', () => {
    let userToken, adminToken, book1;

    beforeEach(async () => {
        const user = await User.create({ name: 'Test User', email: 'user@example.com', password: 'password123', role: 'user' });
        const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' });
        userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);

        book1 = await Book.create({ name: 'The Hobbit', author: 'J.R.R. Tolkien', copiesAvailable: 3 });
    });

    const bookPayload = { name: '1984', author: 'George Orwell', copiesAvailable: 5 };

    describe('POST /books', () => {
        it('should allow an admin to create a book', async () => {
            const res = await request(app)
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bookPayload);
            expect(res.status).toBe(201);
            expect(res.body.name).toBe(bookPayload.name);
        });

        it('should NOT allow a regular user to create a book', async () => {
            const res = await request(app)
                .post('/books')
                .set('Authorization', `Bearer ${userToken}`)
                .send(bookPayload);
            expect(res.status).toBe(403);
        });

        it('should return 400 for missing required fields', async () => {
            const { name, ...payloadWithoutName } = bookPayload;
            const res = await request(app)
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(payloadWithoutName);
            expect(res.status).toBe(400);
        });
    });

    describe('GET /books', () => {
        it('should allow anyone to get a list of all books', async () => {
            const res = await request(app).get('/books');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe(book1.name);
        });
    });

    describe('GET /books/:id', () => {
        it('should allow anyone to get a single book by ID', async () => {
            const res = await request(app).get(`/books/${book1._id}`);
            expect(res.status).toBe(200);
            expect(res.body.name).toBe(book1.name);
        });

        it('should return 404 for a non-existent book ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/books/${nonExistentId}`);
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /books/:id', () => {
        const updatePayload = { copiesAvailable: 10 };

        it('should allow an admin to update a book', async () => {
            const res = await request(app)
                .put(`/books/${book1._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePayload);
            expect(res.status).toBe(200);
            expect(res.body.copiesAvailable).toBe(10);

            const updatedBook = await Book.findById(book1._id);
            expect(updatedBook.copiesAvailable).toBe(10);
        });

        it('should NOT allow a regular user to update a book', async () => {
            const res = await request(app)
                .put(`/books/${book1._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updatePayload);
            expect(res.status).toBe(403);
        });

        it('should return 404 when trying to update a non-existent book', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/books/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePayload);
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /books/:id', () => {
        it('should allow an admin to delete a book', async () => {
            const res = await request(app)
                .delete(`/books/${book1._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);

            const deletedBook = await Book.findById(book1._id);
            expect(deletedBook).toBeNull();
        });

        it('should NOT allow a regular user to delete a book', async () => {
            const res = await request(app)
                .delete(`/books/${book1._id}`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });

        it('should return 404 when trying to delete a non-existent book', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/books/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });
});