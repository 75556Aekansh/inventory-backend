const fifoService = require('../services/fifoService');

const getTransactionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const transactions = await fifoService.getTransactionHistory(limit, offset);

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total: transactions.length }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction history' });
  }
};

module.exports = { getTransactionHistory };
