import dbConnection from '../config/database.js';
import CRUDOperations from './crudOperations.js';

/**
 * Transaction service for multi-document operations
 */
class TransactionService {
  constructor() {
    this.users = new CRUDOperations('users');
    this.orders = new CRUDOperations('orders');
    this.products = new CRUDOperations('products');
    this.inventory = new CRUDOperations('inventory');
  }

  /**
   * Process order with inventory update (transactional)
   * @param {Object} orderData Order information
   * @param {Array} items Array of order items
   * @returns {Promise<Object>} Transaction result
   */
  async processOrder(orderData, items) {
    return await this.users.withTransaction(async (session) => {
      try {
        // Step 1: Validate user exists
        const user = await this.users.findById(orderData.userId);
        if (!user) {
          throw new Error('User not found');
        }

        // Step 2: Validate and reserve inventory
        const inventoryUpdates = [];
        let totalAmount = 0;

        for (const item of items) {
          const product = await this.products.findById(item.productId);
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          // Calculate item total
          const itemTotal = product.price * item.quantity;
          totalAmount += itemTotal;

          // Prepare inventory update
          inventoryUpdates.push({
            productId: item.productId,
            quantityToReduce: item.quantity,
            currentStock: product.stock
          });

          // Update item with current price
          item.price = product.price;
          item.total = itemTotal;
        }

        // Step 3: Create order
        const order = await this.orders.createOne({
          ...orderData,
          items,
          total: totalAmount,
          status: 'pending'
        }, { session });

        // Step 4: Update inventory
        for (const update of inventoryUpdates) {
          await this.products.updateById(
            update.productId,
            {
              $inc: { stock: -update.quantityToReduce },
              $push: {
                stockHistory: {
                  orderId: order._id,
                  change: -update.quantityToReduce,
                  timestamp: new Date(),
                  reason: 'order_placed'
                }
              }
            },
            { session }
          );
        }

        // Step 5: Update user's order history
        await this.users.updateById(
          orderData.userId,
          {
            $push: { orderHistory: order._id },
            $inc: { totalOrders: 1, totalSpent: totalAmount }
          },
          { session }
        );

        console.log(`✅ Order ${order._id} processed successfully`);
        return {
          success: true,
          order,
          totalAmount,
          message: 'Order processed successfully'
        };

      } catch (error) {
        console.error('❌ Transaction failed:', error.message);
        throw error;
      }
    });
  }

  /**
   * Transfer funds between user accounts (transactional)
   * @param {string} fromUserId Source user ID
   * @param {string} toUserId Destination user ID
   * @param {number} amount Transfer amount
   * @param {string} description Transfer description
   * @returns {Promise<Object>} Transaction result
   */
  async transferFunds(fromUserId, toUserId, amount, description = '') {
    return await this.users.withTransaction(async (session) => {
      try {
        // Validate amount
        if (amount <= 0) {
          throw new Error('Transfer amount must be positive');
        }

        // Get source user
        const fromUser = await this.users.findById(fromUserId);
        if (!fromUser) {
          throw new Error('Source user not found');
        }

        // Get destination user
        const toUser = await this.users.findById(toUserId);
        if (!toUser) {
          throw new Error('Destination user not found');
        }

        // Check sufficient balance
        if (fromUser.balance < amount) {
          throw new Error(`Insufficient balance. Available: ${fromUser.balance}, Requested: ${amount}`);
        }

        // Create transaction record
        const transactionId = new Date().getTime().toString();
        const timestamp = new Date();

        // Debit from source user
        await this.users.updateById(
          fromUserId,
          {
            $inc: { balance: -amount },
            $push: {
              transactions: {
                id: transactionId,
                type: 'debit',
                amount: -amount,
                toUserId,
                description,
                timestamp,
                status: 'completed'
              }
            }
          },
          { session }
        );

        // Credit to destination user
        await this.users.updateById(
          toUserId,
          {
            $inc: { balance: amount },
            $push: {
              transactions: {
                id: transactionId,
                type: 'credit',
                amount: amount,
                fromUserId,
                description,
                timestamp,
                status: 'completed'
              }
            }
          },
          { session }
        );

        console.log(`✅ Transfer of ${amount} from ${fromUserId} to ${toUserId} completed`);
        return {
          success: true,
          transactionId,
          amount,
          fromUserId,
          toUserId,
          timestamp,
          message: 'Transfer completed successfully'
        };

      } catch (error) {
        console.error('❌ Transfer transaction failed:', error.message);
        throw error;
      }
    });
  }

  /**
   * Cancel order and restore inventory (transactional)
   * @param {string} orderId Order ID to cancel
   * @param {string} reason Cancellation reason
   * @returns {Promise<Object>} Transaction result
   */
  async cancelOrder(orderId, reason = 'User requested') {
    return await this.orders.withTransaction(async (session) => {
      try {
        // Get order
        const order = await this.orders.findById(orderId);
        if (!order) {
          throw new Error('Order not found');
        }

        if (order.status === 'cancelled') {
          throw new Error('Order is already cancelled');
        }

        if (['shipped', 'delivered'].includes(order.status)) {
          throw new Error('Cannot cancel shipped or delivered orders');
        }

        // Restore inventory for each item
        for (const item of order.items) {
          await this.products.updateById(
            item.productId,
            {
              $inc: { stock: item.quantity },
              $push: {
                stockHistory: {
                  orderId: order._id,
                  change: item.quantity,
                  timestamp: new Date(),
                  reason: 'order_cancelled'
                }
              }
            },
            { session }
          );
        }

        // Update order status
        await this.orders.updateById(
          orderId,
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationReason: reason
            }
          },
          { session }
        );

        // Update user statistics
        await this.users.updateById(
          order.userId,
          {
            $pull: { orderHistory: order._id },
            $inc: { 
              totalOrders: -1, 
              totalSpent: -order.total,
              cancelledOrders: 1
            }
          },
          { session }
        );

        console.log(`✅ Order ${orderId} cancelled successfully`);
        return {
          success: true,
          orderId,
          reason,
          restoredItems: order.items.length,
          refundAmount: order.total,
          message: 'Order cancelled and inventory restored'
        };

      } catch (error) {
        console.error('❌ Order cancellation failed:', error.message);
        throw error;
      }
    });
  }

  /**
   * Bulk update product prices with audit trail (transactional)
   * @param {Array} priceUpdates Array of {productId, newPrice, reason}
   * @returns {Promise<Object>} Transaction result
   */
  async bulkUpdatePrices(priceUpdates) {
    return await this.products.withTransaction(async (session) => {
      try {
        const results = [];
        const timestamp = new Date();

        for (const update of priceUpdates) {
          const { productId, newPrice, reason = 'Bulk price update' } = update;

          // Validate price
          if (newPrice <= 0) {
            throw new Error(`Invalid price for product ${productId}: ${newPrice}`);
          }

          // Get current product
          const product = await this.products.findById(productId);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          const oldPrice = product.price;

          // Update product price
          await this.products.updateById(
            productId,
            {
              $set: { price: newPrice },
              $push: {
                priceHistory: {
                  oldPrice,
                  newPrice,
                  change: newPrice - oldPrice,
                  changePercent: ((newPrice - oldPrice) / oldPrice) * 100,
                  reason,
                  timestamp,
                  updatedBy: 'system'
                }
              }
            },
            { session }
          );

          results.push({
            productId,
            productName: product.name,
            oldPrice,
            newPrice,
            change: newPrice - oldPrice,
            changePercent: ((newPrice - oldPrice) / oldPrice) * 100
          });
        }

        console.log(`✅ Bulk price update completed for ${results.length} products`);
        return {
          success: true,
          updatedCount: results.length,
          results,
          timestamp,
          message: 'Bulk price update completed successfully'
        };

      } catch (error) {
        console.error('❌ Bulk price update failed:', error.message);
        throw error;
      }
    });
  }

  /**
   * Create user with initial setup (transactional)
   * @param {Object} userData User data
   * @param {Object} initialSettings Initial user settings
   * @returns {Promise<Object>} Transaction result
   */
  async createUserWithSetup(userData, initialSettings = {}) {
    return await this.users.withTransaction(async (session) => {
      try {
        // Create user
        const user = await this.users.createOne({
          ...userData,
          balance: initialSettings.initialBalance || 0,
          status: 'active',
          preferences: initialSettings.preferences || {},
          orderHistory: [],
          transactions: [],
          totalOrders: 0,
          totalSpent: 0,
          cancelledOrders: 0
        }, { session });

        // Create user profile in separate collection if needed
        if (initialSettings.createProfile) {
          const profiles = new CRUDOperations('profiles');
          await profiles.createOne({
            userId: user._id,
            ...initialSettings.profileData
          }, { session });
        }

        // Create initial wallet transaction if balance > 0
        if (initialSettings.initialBalance > 0) {
          await this.users.updateById(
            user._id,
            {
              $push: {
                transactions: {
                  id: new Date().getTime().toString(),
                  type: 'credit',
                  amount: initialSettings.initialBalance,
                  description: 'Initial balance',
                  timestamp: new Date(),
                  status: 'completed'
                }
              }
            },
            { session }
          );
        }

        console.log(`✅ User ${user._id} created with initial setup`);
        return {
          success: true,
          user,
          message: 'User created successfully with initial setup'
        };

      } catch (error) {
        console.error('❌ User creation with setup failed:', error.message);
        throw error;
      }
    });
  }
}

export default TransactionService;