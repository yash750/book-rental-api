const express = require('express');
const router = express.Router();
const nestedController = require('../controllers/nestedController');

router.get('/:input?', nestedController.getAlphaValue);

module.exports = router;
