const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const inventoryController = require('../controller/inventoryController');

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Inventory routes
router.get('/', inventoryController.getAllInventory);
router.get('/:productId', inventoryController.getInventoryById);
router.get('/:productId/batches', inventoryController.getProductBatches);

module.exports = router;
