import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration and connection management
 */
class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    
    // Connection configuration
    this.config = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DATABASE || 'myapp',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
        retryWrites: true,
        retryReads: true,
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
      }
    };

    // Add authentication if credentials are provided
    if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
      this.config.options.auth = {
        username: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD
      };
    }
  }

  /**
   * Establish connection to MongoDB
   * @returns {Promise<MongoClient>} MongoDB client instance
   */
  async connect() {
    try {
      if (this.isConnected && this.client) {
        return this.client;
      }

      console.log('🔄 Connecting to MongoDB...');
      
      this.client = new MongoClient(this.config.uri, this.config.options);
      
      // Connect with retry logic
      await this.connectWithRetry();
      
      this.db = this.client.db(this.config.database);
      this.isConnected = true;

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ Successfully connected to MongoDB');
      console.log(`📊 Database: ${this.config.database}`);
      
      return this.client;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Connect with retry logic
   * @param {number} maxRetries Maximum number of retry attempts
   * @param {number} retryDelay Delay between retries in milliseconds
   */
  async connectWithRetry(maxRetries = 3, retryDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.client.connect();
        return;
      } catch (error) {
        console.warn(`⚠️  Connection attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`🔄 Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Set up event listeners for connection monitoring
   */
  setupEventListeners() {
    this.client.on('connectionPoolCreated', () => {
      console.log('🏊 Connection pool created');
    });

    this.client.on('connectionPoolClosed', () => {
      console.log('🏊 Connection pool closed');
    });

    this.client.on('serverHeartbeatFailed', (event) => {
      console.warn('💔 Server heartbeat failed:', event.failure.message);
    });

    this.client.on('topologyDescriptionChanged', (event) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Topology changed:', event.newDescription.type);
      }
    });
  }

  /**
   * Get database instance
   * @returns {Db} MongoDB database instance
   */
  getDatabase() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get collection instance
   * @param {string} collectionName Name of the collection
   * @returns {Collection} MongoDB collection instance
   */
  getCollection(collectionName) {
    return this.getDatabase().collection(collectionName);
  }

  /**
   * Check if database is connected
   * @returns {boolean} Connection status
   */
  isConnectedToDatabase() {
    return this.isConnected && this.client && this.db;
  }

  /**
   * Ping database to check connection
   * @returns {Promise<boolean>} Connection health status
   */
  async ping() {
    try {
      if (!this.isConnectedToDatabase()) {
        return false;
      }
      
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ Database ping failed:', error.message);
      return false;
    }
  }

  /**
   * Create database indexes
   * @param {string} collectionName Collection name
   * @param {Array} indexes Array of index specifications
   */
  async createIndexes(collectionName, indexes) {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.createIndexes(indexes);
      console.log(`📊 Created ${result.length} indexes for ${collectionName}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to create indexes for ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Gracefully close database connection
   */
  async close() {
    try {
      if (this.client && this.isConnected) {
        console.log('🔄 Closing MongoDB connection...');
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.db = null;
        console.log('✅ MongoDB connection closed successfully');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      await this.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection;