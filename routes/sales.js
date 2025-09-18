const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const salesController = require('../controller/salesController');

const router = express.Router();

router.use(authenticateToken);

router.post('/', salesController.createSale);
router.get('/:productId', salesController.getSalesByProduct);

module.exports = router;
