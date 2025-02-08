const { createClient } = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = process.env.REDIS_TTL || 3600; // 1 hora en segundos
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Error connecting to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis Client Disconnected');
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) return false;
      
      await this.client.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (!this.isConnected) return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      if (!this.isConnected) return false;
      
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  // Métodos de utilidad para generar claves consistentes
  generateKey(prefix, id) {
    return `${prefix}:${id}`;
  }

  generateListKey(prefix, filter = '') {
    return `${prefix}:list:${filter}`;
  }
}

// Exportar una única instancia del servicio
const cacheService = new CacheService();
module.exports = cacheService; 