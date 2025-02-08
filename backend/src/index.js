require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const cacheService = require('./services/cacheService');
const validateEnv = require('./utils/envCheck');

// Routes
const authRoutes = require('./routes/auth.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Detailed logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  logger.info('Running in development mode');
  logger.debug('Environment variables loaded:', {
    port: process.env.PORT,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
    nodeEnv: process.env.NODE_ENV
  });
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/employees', employeeRoutes);
// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Validate environment variables first
    logger.info('Starting server initialization...');
    validateEnv();

    // Connect to MongoDB
    logger.info('Attempting to connect to MongoDB...');
    await connectDB();
    logger.info('MongoDB connection established successfully');

    // Connect to Redis
    logger.info('Attempting to connect to Redis...');
    try {
      await cacheService.connect();
      logger.info('Redis connection established successfully');
    } catch (redisError) {
      logger.warn('Failed to connect to Redis, continuing without cache:', redisError.message);
      // Continue without Redis - it's not critical for the application
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info('Server initialization completed successfully');
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });

    server.on('error', (error) => {
      logger.error('Server error:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        syscall: error.syscall
      });
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          if (cacheService.isConnected) {
            await cacheService.disconnect();
            logger.info('Redis connection closed');
          }
          
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  process.exit(1);
});

// Start the server
startServer(); 