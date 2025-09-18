const { sendMessage } = require('../config/kafka');
const kafkaConsumerService = require('../services/kafkaConsumer');
const { simulateEvents } = require('../scripts/producer');

const sendMessageController = async (req, res) => {
  try {
    const { product_id, event_type, quantity, unit_price } = req.body;

    if (!product_id || !event_type || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const message = { product_id, event_type, quantity: parseInt(quantity), timestamp: new Date().toISOString() };
    if (event_type.toLowerCase() === 'purchase') message.unit_price = parseFloat(unit_price);

    await sendMessage(message);

    res.json({ success: true, message: 'Event sent to Kafka', data: message });
  } catch (error) {
    console.error('Error sending Kafka message:', error);
    res.status(500).json({ success: false, message: 'Failed to send Kafka message' });
  }
};

const getStatus = (req, res) => {
  try {
    const status = kafkaConsumerService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting Kafka status:', error);
    res.status(500).json({ success: false, message: 'Failed to get Kafka status' });
  }
};

const simulateEventsController = async (req, res) => {
  try {
    await simulateEvents();
    res.json({ success: true, message: 'Simulation events pushed to Kafka' });
  } catch (error) {
    console.error('Error simulating events:', error);
    res.status(500).json({ success: false, message: 'Simulation failed', error: error.message });
  }
};

module.exports = { sendMessage: sendMessageController, getStatus, simulateEvents: simulateEventsController };
