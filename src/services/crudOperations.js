import { ObjectId } from 'mongodb';
import dbConnection from '../config/database.js';

/**
 * Comprehensive CRUD operations service for MongoDB
 */
class CRUDOperations {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Get collection instance
   * @returns {Collection} MongoDB collection
   */
  getCollection() {
    return dbConnection.getCollection(this.collectionName);
  }

  /**
   * Validate ObjectId
   * @param {string} id ID to validate
   * @returns {boolean} Validation result
   */
  isValidObjectId(id) {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
  }

  /**
   * Convert string ID to ObjectId if valid
   * @param {string|ObjectId} id ID to convert
   * @returns {ObjectId} Converted ObjectId
   */
  toObjectId(id) {
    if (id instanceof ObjectId) return id;
    if (this.isValidObjectId(id)) return new ObjectId(id);
    throw new Error(`Invalid ObjectId: ${id}`);
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a single document
   * @param {Object} document Document to create
   * @param {Object} options Insert options
   * @returns {Promise<Object>} Created document with _id
   */
  async createOne(document, options = {}) {
    try {
      if (!document || typeof document !== 'object') {
        throw new Error('Document must be a valid object');
      }

      const collection = this.getCollection();
      const docToInsert = {
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(docToInsert, options);
      
      if (!result.acknowledged) {
        throw new Error('Document creation was not acknowledged');
      }

      return {
        _id: result.insertedId,
        ...docToInsert
      };
    } catch (error) {
      console.error(`❌ Error creating document in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Create multiple documents
   * @param {Array} documents Array of documents to create
   * @param {Object} options Insert options
   * @returns {Promise<Array>} Created documents with _ids
   */
  async createMany(documents, options = {}) {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents must be a non-empty array');
      }

      const collection = this.getCollection();
      const docsToInsert = documents.map(doc => ({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = await collection.insertMany(docsToInsert, options);
      
      if (!result.acknowledged) {
        throw new Error('Documents creation was not acknowledged');
      }

      return docsToInsert.map((doc, index) => ({
        _id: result.insertedIds[index],
        ...doc
      }));
    } catch (error) {
      console.error(`❌ Error creating documents in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find documents with advanced filtering and pagination
   * @param {Object} filter Query filter
   * @param {Object} options Query options (projection, sort, limit, skip)
   * @returns {Promise<Array>} Array of documents
   */
  async find(filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      const {
        projection = {},
        sort = {},
        limit = 0,
        skip = 0,
        ...otherOptions
      } = options;

      let cursor = collection.find(filter, { projection, ...otherOptions });

      if (Object.keys(sort).length > 0) {
        cursor = cursor.sort(sort);
      }

      if (skip > 0) {
        cursor = cursor.skip(skip);
      }

      if (limit > 0) {
        cursor = cursor.limit(limit);
      }

      const documents = await cursor.toArray();
      return documents;
    } catch (error) {
      console.error(`❌ Error finding documents in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Find a single document by ID
   * @param {string|ObjectId} id Document ID
   * @param {Object} options Query options
   * @returns {Promise<Object|null>} Document or null
   */
  async findById(id, options = {}) {
    try {
      const objectId = this.toObjectId(id);
      const collection = this.getCollection();
      
      const document = await collection.findOne({ _id: objectId }, options);
      return document;
    } catch (error) {
      console.error(`❌ Error finding document by ID in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Find a single document by filter
   * @param {Object} filter Query filter
   * @param {Object} options Query options
   * @returns {Promise<Object|null>} Document or null
   */
  async findOne(filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      const document = await collection.findOne(filter, options);
      return document;
    } catch (error) {
      console.error(`❌ Error finding document in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Count documents matching filter
   * @param {Object} filter Query filter
   * @param {Object} options Count options
   * @returns {Promise<number>} Document count
   */
  async count(filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      const count = await collection.countDocuments(filter, options);
      return count;
    } catch (error) {
      console.error(`❌ Error counting documents in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if documents exist matching filter
   * @param {Object} filter Query filter
   * @returns {Promise<boolean>} Existence status
   */
  async exists(filter = {}) {
    try {
      const count = await this.count(filter);
      return count > 0;
    } catch (error) {
      console.error(`❌ Error checking document existence in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a single document by ID
   * @param {string|ObjectId} id Document ID
   * @param {Object} update Update operations
   * @param {Object} options Update options
   * @returns {Promise<Object|null>} Updated document
   */
  async updateById(id, update, options = {}) {
    try {
      const objectId = this.toObjectId(id);
      
      if (!update || typeof update !== 'object') {
        throw new Error('Update must be a valid object');
      }

      const collection = this.getCollection();
      const updateDoc = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        updateDoc,
        { returnDocument: 'after', ...options }
      );

      return result.value;
    } catch (error) {
      console.error(`❌ Error updating document by ID in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Update a single document by filter
   * @param {Object} filter Query filter
   * @param {Object} update Update operations
   * @param {Object} options Update options
   * @returns {Promise<Object>} Update result
   */
  async updateOne(filter, update, options = {}) {
    try {
      if (!update || typeof update !== 'object') {
        throw new Error('Update must be a valid object');
      }

      const collection = this.getCollection();
      const updateDoc = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };

      const result = await collection.updateOne(filter, updateDoc, options);
      
      return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId
      };
    } catch (error) {
      console.error(`❌ Error updating document in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Update multiple documents
   * @param {Object} filter Query filter
   * @param {Object} update Update operations
   * @param {Object} options Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(filter, update, options = {}) {
    try {
      if (!update || typeof update !== 'object') {
        throw new Error('Update must be a valid object');
      }

      const collection = this.getCollection();
      const updateDoc = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };

      const result = await collection.updateMany(filter, updateDoc, options);
      
      return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId
      };
    } catch (error) {
      console.error(`❌ Error updating documents in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Replace a single document
   * @param {Object} filter Query filter
   * @param {Object} replacement Replacement document
   * @param {Object} options Replace options
   * @returns {Promise<Object>} Replace result
   */
  async replaceOne(filter, replacement, options = {}) {
    try {
      if (!replacement || typeof replacement !== 'object') {
        throw new Error('Replacement must be a valid object');
      }

      const collection = this.getCollection();
      const replacementDoc = {
        ...replacement,
        updatedAt: new Date()
      };

      const result = await collection.replaceOne(filter, replacementDoc, options);
      
      return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId
      };
    } catch (error) {
      console.error(`❌ Error replacing document in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete a single document by ID
   * @param {string|ObjectId} id Document ID
   * @param {Object} options Delete options
   * @returns {Promise<Object|null>} Deleted document
   */
  async deleteById(id, options = {}) {
    try {
      const objectId = this.toObjectId(id);
      const collection = this.getCollection();
      
      const result = await collection.findOneAndDelete({ _id: objectId }, options);
      return result.value;
    } catch (error) {
      console.error(`❌ Error deleting document by ID in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a single document by filter
   * @param {Object} filter Query filter
   * @param {Object} options Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(filter, options = {}) {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteOne(filter, options);
      
      return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error(`❌ Error deleting document in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete multiple documents
   * @param {Object} filter Query filter
   * @param {Object} options Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(filter, options = {}) {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteMany(filter, options);
      
      return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error(`❌ Error deleting documents in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  // ==================== AGGREGATION OPERATIONS ====================

  /**
   * Execute aggregation pipeline
   * @param {Array} pipeline Aggregation pipeline
   * @param {Object} options Aggregation options
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline, options = {}) {
    try {
      if (!Array.isArray(pipeline)) {
        throw new Error('Pipeline must be an array');
      }

      const collection = this.getCollection();
      const cursor = collection.aggregate(pipeline, options);
      const results = await cursor.toArray();
      
      return results;
    } catch (error) {
      console.error(`❌ Error executing aggregation in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get distinct values for a field
   * @param {string} field Field name
   * @param {Object} filter Query filter
   * @param {Object} options Distinct options
   * @returns {Promise<Array>} Distinct values
   */
  async distinct(field, filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      const values = await collection.distinct(field, filter, options);
      return values;
    } catch (error) {
      console.error(`❌ Error getting distinct values in ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  /**
   * Execute operations within a transaction
   * @param {Function} operations Function containing operations to execute
   * @param {Object} options Transaction options
   * @returns {Promise<any>} Transaction result
   */
  async withTransaction(operations, options = {}) {
    const session = dbConnection.client.startSession();
    
    try {
      const result = await session.withTransaction(async () => {
        return await operations(session);
      }, options);
      
      return result;
    } catch (error) {
      console.error(`❌ Transaction failed in ${this.collectionName}:`, error.message);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Create indexes for the collection
   * @param {Array} indexes Array of index specifications
   * @returns {Promise<Array>} Created index names
   */
  async createIndexes(indexes) {
    try {
      return await dbConnection.createIndexes(this.collectionName, indexes);
    } catch (error) {
      console.error(`❌ Error creating indexes for ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Drop the collection
   * @returns {Promise<boolean>} Drop result
   */
  async dropCollection() {
    try {
      const collection = this.getCollection();
      const result = await collection.drop();
      console.log(`🗑️  Collection ${this.collectionName} dropped`);
      return result;
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log(`ℹ️  Collection ${this.collectionName} does not exist`);
        return true;
      }
      console.error(`❌ Error dropping collection ${this.collectionName}:`, error.message);
      throw error;
    }
  }
}

export default CRUDOperations;