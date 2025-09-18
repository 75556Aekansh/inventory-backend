const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const kafkaController = require('../controller/kafkaController');

const router = express.Router();

// Apply authentication middleware to all Kafka routes
router.use(authenticateToken);

// Kafka endpoints
router.post('/send', kafkaController.sendMessage);
router.get('/status', kafkaController.getStatus);
router.post('/simulate', kafkaController.simulateEvents);

module.exports = router;
