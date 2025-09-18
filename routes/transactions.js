const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const transactionController = require('../controller/transactionController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', transactionController.getTransactionHistory);

module.exports = router;
