const logger = require('./logger');

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'REDIS_URL',
  'REDIS_PASSWORD',
  'JWT_SECRET'
];

const validateEnv = () => {
  logger.info('Validating environment variables...');
  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('Environment validation completed successfully');
  logger.debug('Environment configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set',
    REDIS_URL: process.env.REDIS_URL ? 'Set (hidden)' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set (hidden)' : 'Not set'
  });
};

module.exports = validateEnv; 