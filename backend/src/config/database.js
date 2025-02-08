const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.debug('MongoDB URI:', process.env.MONGODB_URI?.substring(0, process.env.MONGODB_URI.indexOf('@')));
    logger.info('Initializing MongoDB connection...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.debug('MongoDB connection details:', {
      database: conn.connection.name,
      port: conn.connection.port,
      models: Object.keys(conn.models)
    });

    // Manejo de eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', {
        error: err.message,
        name: err.name,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        logger.info('Received SIGINT. Closing MongoDB connection...');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', {
          error: err.message,
          name: err.name,
          stack: err.stack
        });
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      codeName: error.codeName
    });
    throw error;
  }
};

module.exports = {
  connectDB
}; 