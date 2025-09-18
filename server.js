const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations and services
const { pool,testConnection } = require('./config/database');
const { 
  initializeKafka, 
  connectProducer, 
  connectConsumer, 
  disconnect 
} = require('./config/kafka');
const kafkaConsumerService = require('./services/kafkaConsumer');

// Import routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const transactionRoutes = require('./routes/transactions');
const kafkaRoutes = require('./routes/kafka');
const salesRoutes = require('./routes/sales');


// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/kafka', kafkaRoutes);
app.use('/api/sales', salesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Inventory Management System Backend...');
    
    // Test database connection
    console.log('🔄 Testing database connection...');
    await testConnection();
    console.log('✅ Database connected successfully');

    // Initialize Kafka
    console.log('🔄 Initializing Kafka...');
    await initializeKafka();
    
    // Connect Kafka producer
    console.log('🔄 Connecting Kafka producer...');
    await connectProducer();
    
    // Connect Kafka consumer
    console.log(' Connecting Kafka consumer...');
    await connectConsumer();
    
    // Start Kafka consumer service
    console.log('🔄 Starting Kafka consumer service...');
    await kafkaConsumerService.start();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('Backend initialization completed successfully!');
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop Kafka consumer
        console.log(' Stopping Kafka consumer...');
        await kafkaConsumerService.stop();
        
        // Disconnect Kafka
        console.log('Disconnecting Kafka...');
        await disconnect();
        
        // Close database connections
        console.log('Closing database connections...');
        await pool.end();
        
        // Close HTTP server
        console.log(' Closing HTTP server...');
        server.close(() => {
          console.log('Graceful shutdown completed');
          process.exit(0);
        });
        
        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
          console.log(' Force exit after timeout');
          process.exit(1);
        }, 10000);
        
      } catch (error) {
        console.error(' Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error(' Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();