import dbConnection from './config/database.js';
import CRUDOperations from './services/crudOperations.js';
import TransactionService from './services/transactionService.js';
import AggregationExamples from './services/aggregationExamples.js';

/**
 * Main application demonstrating MongoDB operations
 */
class MongoDBApp {
  constructor() {
    this.users = new CRUDOperations('users');
    this.products = new CRUDOperations('products');
    this.orders = new CRUDOperations('orders');
    this.transactionService = new TransactionService();
    this.aggregationExamples = new AggregationExamples();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('🚀 Starting MongoDB Application...\n');

      // Connect to database
      await dbConnection.connect();
      
      // Setup graceful shutdown
      dbConnection.setupGracefulShutdown();

      // Create initial indexes
      await this.setupIndexes();

      // Run example operations
      await this.runExamples();

      console.log('\n✅ Application initialized successfully!');
      console.log('📝 Check the console output above for operation results');
      console.log('🔧 Modify src/index.js to customize operations');
      console.log('🧪 Run "npm test" to execute the test suite');

    } catch (error) {
      console.error('\n❌ Application initialization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Setup database indexes
   */
  async setupIndexes() {
    console.log('📊 Setting up database indexes...');

    try {
      // User indexes
      await this.users.createIndexes([
        { key: { email: 1 }, unique: true, name: 'email_unique' },
        { key: { status: 1 }, name: 'status_index' },
        { key: { userType: 1 }, name: 'userType_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      // Product indexes
      await this.products.createIndexes([
        { key: { name: 1 }, name: 'name_index' },
        { key: { category: 1 }, name: 'category_index' },
        { key: { price: 1 }, name: 'price_index' },
        { key: { stock: 1 }, name: 'stock_index' },
        { key: { name: 'text', description: 'text' }, name: 'text_search' }
      ]);

      // Order indexes
      await this.orders.createIndexes([
        { key: { userId: 1 }, name: 'userId_index' },
        { key: { status: 1 }, name: 'status_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' },
        { key: { 'items.productId': 1 }, name: 'items_productId' }
      ]);

      console.log('✅ Database indexes created successfully\n');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
  }

  /**
   * Run example operations
   */
  async runExamples() {
    console.log('🔧 Running example operations...\n');

    // Example 1: Create sample data
    await this.createSampleData();

    // Example 2: Demonstrate CRUD operations
    await this.demonstrateCRUD();

    // Example 3: Show transaction usage
    await this.demonstrateTransactions();

    // Example 4: Run aggregation examples
    await this.demonstrateAggregations();
  }

  /**
   * Create sample data
   */
  async createSampleData() {
    console.log('📝 Creating sample data...');

    try {
      // Check if data already exists
      const userCount = await this.users.count();
      if (userCount > 0) {
        console.log('  ℹ️  Sample data already exists, skipping creation\n');
        return;
      }

      // Create sample users
      const users = await this.users.createMany([
        {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          userType: 'premium',
          status: 'active',
          balance: 1500,
          preferences: { newsletter: true, notifications: true }
        },
        {
          name: 'Bob Smith',
          email: 'bob@example.com',
          userType: 'regular',
          status: 'active',
          balance: 750,
          preferences: { newsletter: false, notifications: true }
        },
        {
          name: 'Carol Davis',
          email: 'carol@example.com',
          userType: 'premium',
          status: 'active',
          balance: 2000,
          preferences: { newsletter: true, notifications: false }
        }
      ]);

      // Create sample products
      const products = await this.products.createMany([
        {
          name: 'MacBook Pro',
          category: 'Laptops',
          price: 1999.99,
          stock: 25,
          description: 'High-performance laptop for professionals',
          features: ['M2 Chip', '16GB RAM', '512GB SSD']
        },
        {
          name: 'Wireless Mouse',
          category: 'Accessories',
          price: 49.99,
          stock: 150,
          description: 'Ergonomic wireless mouse',
          features: ['Bluetooth', 'Rechargeable', 'Ergonomic']
        },
        {
          name: 'Mechanical Keyboard',
          category: 'Accessories',
          price: 129.99,
          stock: 80,
          description: 'RGB mechanical keyboard',
          features: ['RGB Lighting', 'Cherry MX Switches', 'USB-C']
        },
        {
          name: '4K Monitor',
          category: 'Monitors',
          price: 399.99,
          stock: 40,
          description: '27-inch 4K monitor',
          features: ['4K Resolution', 'HDR', 'USB-C Hub']
        }
      ]);

      console.log(`  ✅ Created ${users.length} users and ${products.length} products\n`);
    } catch (error) {
      console.error('  ❌ Error creating sample data:', error.message);
    }
  }

  /**
   * Demonstrate CRUD operations
   */
  async demonstrateCRUD() {
    console.log('🔧 Demonstrating CRUD operations...');

    try {
      // READ: Find all active users
      const activeUsers = await this.users.find(
        { status: 'active' },
        { sort: { createdAt: -1 }, limit: 3 }
      );
      console.log(`  📖 Found ${activeUsers.length} active users`);

      // READ: Find products by category
      const laptops = await this.products.find(
        { category: 'Laptops' },
        { sort: { price: -1 } }
      );
      console.log(`  📖 Found ${laptops.length} laptops`);

      // UPDATE: Update user preferences
      if (activeUsers.length > 0) {
        const updateResult = await this.users.updateById(activeUsers[0]._id, {
          $set: { 
            'preferences.lastLogin': new Date(),
            'preferences.theme': 'dark'
          }
        });
        console.log(`  ✏️  Updated user preferences: ${updateResult.name}`);
      }

      // CREATE: Add a new product
      const newProduct = await this.products.createOne({
        name: 'Webcam HD',
        category: 'Accessories',
        price: 89.99,
        stock: 60,
        description: 'High-definition webcam',
        features: ['1080p', 'Auto-focus', 'Built-in Microphone']
      });
      console.log(`  ➕ Created new product: ${newProduct.name}`);

      // DELETE: Remove the new product (cleanup)
      await this.products.deleteById(newProduct._id);
      console.log(`  🗑️  Deleted product: ${newProduct.name}`);

      console.log('  ✅ CRUD operations completed\n');
    } catch (error) {
      console.error('  ❌ Error in CRUD operations:', error.message);
    }
  }

  /**
   * Demonstrate transaction operations
   */
  async demonstrateTransactions() {
    console.log('💳 Demonstrating transaction operations...');

    try {
      // Get sample users and products
      const users = await this.users.find({ status: 'active' }, { limit: 2 });
      const products = await this.products.find({}, { limit: 2 });

      if (users.length < 2 || products.length < 2) {
        console.log('  ⚠️  Insufficient data for transaction demo\n');
        return;
      }

      // Process an order (transactional)
      const orderResult = await this.transactionService.processOrder(
        {
          userId: users[0]._id,
          shippingAddress: '123 Main St, Anytown, AT 12345',
          paymentMethod: 'credit_card'
        },
        [
          { productId: products[0]._id, quantity: 1 },
          { productId: products[1]._id, quantity: 2 }
        ]
      );
      console.log(`  🛒 Order processed: ${orderResult.order._id}`);
      console.log(`  💰 Total amount: $${orderResult.totalAmount}`);

      // Transfer funds between users
      const transferResult = await this.transactionService.transferFunds(
        users[1]._id,
        users[0]._id,
        150,
        'Payment for services'
      );
      console.log(`  💸 Transfer completed: $${transferResult.amount}`);

      console.log('  ✅ Transaction operations completed\n');
    } catch (error) {
      console.error('  ❌ Error in transaction operations:', error.message);
    }
  }

  /**
   * Demonstrate aggregation operations
   */
  async demonstrateAggregations() {
    console.log('📊 Demonstrating aggregation operations...');

    try {
      // User statistics
      const userStats = await this.aggregationExamples.getUserStatistics();
      console.log(`  📈 User statistics generated for ${userStats.length} user types`);
      
      if (userStats.length > 0) {
        console.log(`    - ${userStats[0]._id}: ${userStats[0].totalUsers} users`);
      }

      // Monthly sales trends
      const salesTrends = await this.aggregationExamples.getMonthlySalesTrends(3);
      console.log(`  📅 Sales trends for last ${salesTrends.length} months`);

      // Customer segmentation
      const segments = await this.aggregationExamples.getCustomerSegmentation();
      console.log(`  👥 Customer segmentation: ${segments.length} segments`);
      
      segments.forEach(segment => {
        console.log(`    - ${segment._id}: ${segment.customerCount} customers`);
      });

      // Inventory analysis
      const inventory = await this.aggregationExamples.getInventoryAnalysis();
      console.log(`  📦 Inventory analysis: ${inventory.length} categories`);

      console.log('  ✅ Aggregation operations completed\n');
    } catch (error) {
      console.error('  ❌ Error in aggregation operations:', error.message);
    }
  }
}

// Initialize and run the application
const app = new MongoDBApp();
app.initialize().catch(console.error);

export default MongoDBApp;