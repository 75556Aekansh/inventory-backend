#!/usr/bin/env node

/**
 * Kafka Producer Script for Testing Inventory Events
 * 
 * Usage:
 * node scripts/producer.js purchase PRD001 100 50.0
 * node scripts/producer.js sale PRD001 25  
 * node scripts/producer.js simulate
 */

require('dotenv').config();
const { sendMessage, connectProducer, disconnect } = require('../config/kafka');

const args = process.argv.slice(2);

const printUsage = () => {
  console.log('\n📖 Usage:');
  console.log('  Purchase: node scripts/producer.js purchase <product_id> <quantity> <unit_price>');
  console.log('  Sale:     node scripts/producer.js sale <product_id> <quantity>');
  console.log('  Simulate: node scripts/producer.js simulate');
  console.log('\n📝 Examples:');
  console.log('  node scripts/producer.js purchase PRD001 100 50.0');
  console.log('  node scripts/producer.js sale PRD001 25');
  console.log('  node scripts/producer.js simulate\n');
};

const sendPurchaseEvent = async (productId, quantity, unitPrice) => {
  const message = {
    product_id: productId,
    event_type: 'purchase',
    quantity: parseInt(quantity),
    unit_price: parseFloat(unitPrice),
    timestamp: new Date().toISOString()
  };

  await sendMessage(message);
  console.log(' Purchase event sent:', message);
};

const sendSaleEvent = async (productId, quantity) => {
  const message = {
    product_id: productId,
    event_type: 'sale',
    quantity: parseInt(quantity),
    timestamp: new Date().toISOString()
  };

  await sendMessage(message);
  console.log(' Sale event sent:', message);
};

const simulateEvents = async () => {
  console.log('🎭 Simulating inventory events...\n');

  const events = [
    // Initial purchases
    { type: 'purchase', product: 'PRD001', quantity: 100, price: 50.0, desc: 'Initial stock for Widget A' },
    { type: 'purchase', product: 'PRD002', quantity: 200, price: 30.0, desc: 'Initial stock for Gadget B' },
    { type: 'purchase', product: 'PRD003', quantity: 150, price: 75.0, desc: 'Initial stock for Tool C' },
    
    // Some sales
    { type: 'sale', product: 'PRD001', quantity: 25, desc: 'First sale of Widget A' },
    { type: 'sale', product: 'PRD002', quantity: 50, desc: 'First sale of Gadget B' },
    
    // More purchases (different prices to test FIFO)
    { type: 'purchase', product: 'PRD001', quantity: 80, price: 55.0, desc: 'Restock Widget A at higher price' },
    { type: 'purchase', product: 'PRD002', quantity: 120, price: 32.0, desc: 'Restock Gadget B at slightly higher price' },
    
    // More sales (should use FIFO - oldest batches first)
    { type: 'sale', product: 'PRD001', quantity: 40, desc: 'Second sale of Widget A (FIFO test)' },
    { type: 'sale', product: 'PRD003', quantity: 30, desc: 'First sale of Tool C' },
    { type: 'sale', product: 'PRD001', quantity: 50, desc: 'Third sale of Widget A (should mix batches)' },
    { type: 'sale', product: 'PRD002', quantity: 80, desc: 'Second sale of Gadget B' },
    
    // Final purchases
    { type: 'purchase', product: 'PRD003', quantity: 100, price: 80.0, desc: 'Restock Tool C at higher price' },
    { type: 'sale', product: 'PRD003', quantity: 60, desc: 'Second sale of Tool C (FIFO test)' }
  ];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    console.log(`📦 Event ${i + 1}/${events.length}: ${event.desc}`);
    
    try {
      if (event.type === 'purchase') {
        await sendPurchaseEvent(event.product, event.quantity, event.price);
      } else {
        await sendSaleEvent(event.product, event.quantity);
      }
      
      // Add small delay between events
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Failed to send event ${i + 1}:`, error.message);
    }
  }

  console.log('\n🎉 Simulation completed!');
};

const main = async () => {
  try {
    console.log('🚀 Starting Kafka Producer...');
    
    // Connect to Kafka
    await connectProducer();
    console.log('Connected to Kafka\n');

    const command = args[0];

    switch (command) {
      case 'purchase':
        if (args.length !== 4) {
          console.error(' Invalid arguments for purchase command');
          printUsage();
          process.exit(1);
        }
        await sendPurchaseEvent(args[1], args[2], args[3]);
        break;

      case 'sale':
        if (args.length !== 3) {
          console.error(' Invalid arguments for sale command');
          printUsage();
          process.exit(1);
        }
        await sendSaleEvent(args[1], args[2]);
        break;

      case 'simulate':
        await simulateEvents();
        break;

      default:
        console.error(' Invalid command');
        printUsage();
        process.exit(1);
    }

  } catch (error) {
    console.error('Producer error:', error);
    process.exit(1);
  } finally {
    // Disconnect from Kafka
    await disconnect();
    console.log('👋 Disconnected from Kafka');
    process.exit(0);
  }
};

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\nReceived interrupt signal, shutting down...');
  await disconnect();
  process.exit(0);
});


module.exports = { simulateEvents };
