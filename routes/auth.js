const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

// Login route
router.post('/login', authController.login);

module.exports = router;
