const { consumer } = require('../config/kafka');
const fifoService = require('./fifoService');

class KafkaConsumerService {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Kafka consumer is already running');
        return;
      }

      console.log('🔄 Starting Kafka consumer...');

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = message.value.toString();
            console.log(`📨 Received message from ${topic}[${partition}]:`, messageValue);

            const eventData = JSON.parse(messageValue);
            await this.processInventoryEvent(eventData);
            
            console.log('✅ Message processed successfully');
          } catch (error) {
            console.error('❌ Error processing Kafka message:', error);
            // In production, you might want to send this to a dead letter queue
            // or implement retry logic
          }
        },
      });

      this.isRunning = true;
      console.log('✅ Kafka consumer started successfully');
    } catch (error) {
      console.error('❌ Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Process inventory events (purchase/sale)
   * @param {Object} eventData - The inventory event data
   */
  async processInventoryEvent(eventData) {
    try {
      // Validate event data
      this.validateEventData(eventData);

      const { product_id, event_type, quantity, unit_price, timestamp } = eventData;
      const eventTimestamp = timestamp || new Date().toISOString();

      switch (event_type.toLowerCase()) {
        case 'purchase':
          await this.processPurchaseEvent(product_id, quantity, unit_price, eventTimestamp);
          break;
          
        case 'sale':
          await this.processSaleEvent(product_id, quantity, eventTimestamp);
          break;
          
        default:
          throw new Error(`Unknown event type: ${event_type}`);
      }
    } catch (error) {
      console.error('❌ Error processing inventory event:', error);
      throw error;
    }
  }

  /**
   * Process purchase event
   * @param {string} productId 
   * @param {number} quantity 
   * @param {number} unitPrice 
   * @param {string} timestamp 
   */
  async processPurchaseEvent(productId, quantity, unitPrice, timestamp) {
    try {
      console.log(`🛒 Processing purchase: ${quantity} units of ${productId} at $${unitPrice}/unit`);
      
      const result = await fifoService.processPurchase(productId, quantity, unitPrice, timestamp);
      
      console.log('✅ Purchase event processed successfully:', result);
    } catch (error) {
      console.error('❌ Error processing purchase event:', error);
      throw error;
    }
  }

  /**
   * Process sale event
   * @param {string} productId 
   * @param {number} quantity 
   * @param {string} timestamp 
   */
  async processSaleEvent(productId, quantity, timestamp) {
    try {
      console.log(`💰 Processing sale: ${quantity} units of ${productId}`);
      
      const result = await fifoService.processSale(productId, quantity, timestamp);
      
      console.log('✅ Sale event processed successfully:', {
        totalCost: result.totalCost,
        averageUnitCost: result.averageUnitCost,
        batchesUsed: result.usedBatches.length
      });
    } catch (error) {
      console.error('❌ Error processing sale event:', error);
      throw error;
    }
  }

  /**
   * Validate event data structure
   * @param {Object} eventData 
   */
  validateEventData(eventData) {
    const { product_id, event_type, quantity, unit_price } = eventData;

    if (!product_id || typeof product_id !== 'string') {
      throw new Error('Invalid or missing product_id');
    }

    if (!event_type || !['purchase', 'sale'].includes(event_type.toLowerCase())) {
      throw new Error('Invalid or missing event_type. Must be "purchase" or "sale"');
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      throw new Error('Invalid or missing quantity. Must be a positive number');
    }

    // For purchase events, unit_price is required
    if (event_type.toLowerCase() === 'purchase') {
      if (!unit_price || typeof unit_price !== 'number' || unit_price <= 0) {
        throw new Error('Invalid or missing unit_price for purchase event. Must be a positive number');
      }
    }
  }

  /**
   * Stop the Kafka consumer
   */
  async stop() {
    try {
      if (!this.isRunning) {
        console.log('⚠️ Kafka consumer is not running');
        return;
      }

      console.log('🔄 Stopping Kafka consumer...');
      await consumer.stop();
      this.isRunning = false;
      console.log('✅ Kafka consumer stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Get consumer status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      groupId: process.env.KAFKA_GROUP_ID,
      topic: process.env.KAFKA_TOPIC
    };
  }
}

module.exports = new KafkaConsumerService();