const fifoService = require('../services/fifoService');

const getAllInventory = async (req, res) => {
  try {
    const inventory = await fifoService.getAllInventoryStatus();
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory data' });
  }
};

const getInventoryById = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await fifoService.getInventoryStatus(productId);

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product inventory data' });
  }
};

const getProductBatches = async (req, res) => {
  try {
    const { productId } = req.params;
    const batches = await fifoService.getProductBatches(productId);
    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('Error fetching product batches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product batches data' });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  getProductBatches
};
