import dbConnection from './config/database.js';
import CRUDOperations from './services/crudOperations.js';
import TransactionService from './services/transactionService.js';
import AggregationExamples from './services/aggregationExamples.js';

/**
 * Comprehensive test suite for MongoDB operations
 */
class MongoDBTest {
  constructor() {
    this.users = new CRUDOperations('users');
    this.products = new CRUDOperations('products');
    this.orders = new CRUDOperations('orders');
    this.transactionService = new TransactionService();
    this.aggregationExamples = new AggregationExamples();
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    try {
      console.log('🚀 Starting MongoDB Test Suite...\n');

      // Connect to database
      await dbConnection.connect();

      // Setup test data
      await this.setupTestData();

      // Run CRUD tests
      await this.testCRUDOperations();

      // Run transaction tests
      await this.testTransactions();

      // Run aggregation tests
      await this.testAggregations();

      // Cleanup
      await this.cleanup();

      console.log('\n✅ All tests completed successfully!');

    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      throw error;
    } finally {
      await dbConnection.close();
    }
  }

  /**
   * Setup test data
   */
  async setupTestData() {
    console.log('📊 Setting up test data...');

    // Create indexes
    await this.users.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { createdAt: -1 } }
    ]);

    await this.products.createIndexes([
      { key: { name: 1 } },
      { key: { category: 1 } },
      { key: { price: 1 } },
      { key: { stock: 1 } }
    ]);

    await this.orders.createIndexes([
      { key: { userId: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } }
    ]);

    // Create test users
    const users = await this.users.createMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        userType: 'premium',
        status: 'active',
        balance: 1000
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        userType: 'regular',
        status: 'active',
        balance: 500
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        userType: 'premium',
        status: 'active',
        balance: 2000
      }
    ]);

    // Create test products
    const products = await this.products.createMany([
      {
        name: 'Laptop',
        category: 'Electronics',
        price: 999.99,
        stock: 50,
        description: 'High-performance laptop'
      },
      {
        name: 'Mouse',
        category: 'Electronics',
        price: 29.99,
        stock: 100,
        description: 'Wireless mouse'
      },
      {
        name: 'Keyboard',
        category: 'Electronics',
        price: 79.99,
        stock: 75,
        description: 'Mechanical keyboard'
      },
      {
        name: 'Monitor',
        category: 'Electronics',
        price: 299.99,
        stock: 25,
        description: '24-inch monitor'
      }
    ]);

    // Create test orders
    await this.orders.createMany([
      {
        userId: users[0]._id,
        items: [
          { productId: products[0]._id, quantity: 1, price: 999.99, total: 999.99 }
        ],
        total: 999.99,
        status: 'completed'
      },
      {
        userId: users[1]._id,
        items: [
          { productId: products[1]._id, quantity: 2, price: 29.99, total: 59.98 },
          { productId: products[2]._id, quantity: 1, price: 79.99, total: 79.99 }
        ],
        total: 139.97,
        status: 'completed'
      }
    ]);

    console.log('✅ Test data setup completed\n');
  }

  /**
   * Test CRUD operations
   */
  async testCRUDOperations() {
    console.log('🔧 Testing CRUD Operations...');

    // Test CREATE
    console.log('  Testing CREATE operations...');
    const newUser = await this.users.createOne({
      name: 'Test User',
      email: 'test@example.com',
      userType: 'regular',
      status: 'active'
    });
    console.log(`    ✅ Created user: ${newUser.name}`);

    // Test READ
    console.log('  Testing READ operations...');
    const foundUser = await this.users.findById(newUser._id);
    console.log(`    ✅ Found user by ID: ${foundUser.name}`);

    const activeUsers = await this.users.find(
      { status: 'active' },
      { sort: { createdAt: -1 }, limit: 5 }
    );
    console.log(`    ✅ Found ${activeUsers.length} active users`);

    const userCount = await this.users.count({ status: 'active' });
    console.log(`    ✅ Total active users: ${userCount}`);

    // Test UPDATE
    console.log('  Testing UPDATE operations...');
    const updatedUser = await this.users.updateById(newUser._id, {
      $set: { name: 'Updated Test User' }
    });
    console.log(`    ✅ Updated user name: ${updatedUser.name}`);

    const updateResult = await this.users.updateMany(
      { userType: 'regular' },
      { $set: { lastUpdated: new Date() } }
    );
    console.log(`    ✅ Updated ${updateResult.modifiedCount} regular users`);

    // Test DELETE
    console.log('  Testing DELETE operations...');
    const deletedUser = await this.users.deleteById(newUser._id);
    console.log(`    ✅ Deleted user: ${deletedUser.name}`);

    console.log('✅ CRUD operations test completed\n');
  }

  /**
   * Test transaction operations
   */
  async testTransactions() {
    console.log('💳 Testing Transaction Operations...');

    // Get test users and products
    const users = await this.users.find({ status: 'active' }, { limit: 2 });
    const products = await this.products.find({}, { limit: 2 });

    if (users.length < 2 || products.length < 2) {
      console.log('    ⚠️  Insufficient test data for transaction tests');
      return;
    }

    // Test order processing
    console.log('  Testing order processing transaction...');
    const orderResult = await this.transactionService.processOrder(
      {
        userId: users[0]._id,
        shippingAddress: '123 Test St, Test City, TC 12345'
      },
      [
        { productId: products[0]._id, quantity: 1 },
        { productId: products[1]._id, quantity: 2 }
      ]
    );
    console.log(`    ✅ Order processed: ${orderResult.order._id}, Total: $${orderResult.totalAmount}`);

    // Test fund transfer
    console.log('  Testing fund transfer transaction...');
    const transferResult = await this.transactionService.transferFunds(
      users[1]._id,
      users[0]._id,
      100,
      'Test transfer'
    );
    console.log(`    ✅ Transfer completed: $${transferResult.amount}`);

    // Test order cancellation
    console.log('  Testing order cancellation transaction...');
    const cancelResult = await this.transactionService.cancelOrder(
      orderResult.order._id,
      'Test cancellation'
    );
    console.log(`    ✅ Order cancelled: ${cancelResult.orderId}`);

    console.log('✅ Transaction operations test completed\n');
  }

  /**
   * Test aggregation operations
   */
  async testAggregations() {
    console.log('📊 Testing Aggregation Operations...');

    // Test user statistics
    console.log('  Testing user statistics aggregation...');
    const userStats = await this.aggregationExamples.getUserStatistics();
    console.log(`    ✅ Generated statistics for ${userStats.length} user types`);

    // Test monthly sales trends
    console.log('  Testing monthly sales trends...');
    const salesTrends = await this.aggregationExamples.getMonthlySalesTrends(6);
    console.log(`    ✅ Generated sales trends for ${salesTrends.length} months`);

    // Test customer segmentation
    console.log('  Testing customer segmentation...');
    const segments = await this.aggregationExamples.getCustomerSegmentation();
    console.log(`    ✅ Generated ${segments.length} customer segments`);

    // Test inventory analysis
    console.log('  Testing inventory analysis...');
    const inventory = await this.aggregationExamples.getInventoryAnalysis();
    console.log(`    ✅ Generated inventory analysis for ${inventory.length} categories`);

    console.log('✅ Aggregation operations test completed\n');
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    // Drop test collections
    await this.users.dropCollection();
    await this.products.dropCollection();
    await this.orders.dropCollection();

    console.log('✅ Cleanup completed');
  }

  /**
   * Test database connection and health
   */
  async testConnection() {
    console.log('🔌 Testing database connection...');

    const isConnected = dbConnection.isConnectedToDatabase();
    console.log(`  Connection status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);

    const pingResult = await dbConnection.ping();
    console.log(`  Ping result: ${pingResult ? '✅ Success' : '❌ Failed'}`);

    console.log('✅ Connection test completed\n');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new MongoDBTest();
  
  test.runAllTests()
    .then(() => {
      console.log('\n🎉 Test suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export default MongoDBTest;