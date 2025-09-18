const fifoService = require('../services/fifoService');

const createSale = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) return res.status(400).json({ success: false, message: 'Missing fields' });

    const timestamp = new Date().toISOString();
    const saleResult = await fifoService.processSale(product_id, parseInt(quantity), timestamp);

    res.json({ success: true, message: 'Sale processed', data: saleResult });
  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process sale' });
  }
};

const getSalesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await fifoService.getSalesByProduct(productId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales data' });
  }
};

module.exports = { createSale, getSalesByProduct };
