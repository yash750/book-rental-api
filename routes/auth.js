const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile); // ✅ New route

module.exports = router;