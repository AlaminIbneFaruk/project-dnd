# MongoDB Native Driver Implementation

A complete, production-ready MongoDB implementation using the native MongoDB Node.js driver without Mongoose. This project provides comprehensive CRUD operations, transaction support, aggregation pipelines, and proper connection management.

## 🚀 Features

- **Native MongoDB Driver**: Pure MongoDB driver implementation without ODM overhead
- **Complete CRUD Operations**: Create, Read, Update, Delete with advanced filtering
- **Transaction Support**: Multi-document ACID transactions
- **Connection Management**: Robust connection handling with retry logic and pooling
- **Aggregation Pipelines**: Advanced data analysis and reporting
- **Error Handling**: Comprehensive error handling and logging
- **Modular Architecture**: Clean, maintainable code structure
- **Production Ready**: Environment configuration and graceful shutdown

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+ (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=myapp
   MONGODB_USERNAME=
   MONGODB_PASSWORD=
   
   # Connection Pool Settings
   MONGODB_MAX_POOL_SIZE=10
   MONGODB_MIN_POOL_SIZE=2
   MONGODB_MAX_IDLE_TIME=30000
   MONGODB_SERVER_SELECTION_TIMEOUT=5000
   MONGODB_SOCKET_TIMEOUT=45000
   
   NODE_ENV=development
   PORT=3000
   ```

## 🚀 Quick Start

### 1. Start MongoDB
Make sure MongoDB is running locally or you have access to MongoDB Atlas.

### 2. Run the Application
```bash
npm start
```

### 3. Run Tests
```bash
npm test
```

### 4. Development Mode (with auto-restart)
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # Database connection and configuration
├── services/
│   ├── crudOperations.js    # Complete CRUD operations
│   ├── transactionService.js # Transaction management
│   └── aggregationExamples.js # Aggregation pipelines
├── index.js                 # Main application
└── test.js                  # Comprehensive test suite
```

## 🔧 Usage Examples

### Basic CRUD Operations

```javascript
import CRUDOperations from './services/crudOperations.js';

// Initialize service for a collection
const users = new CRUDOperations('users');

// CREATE
const newUser = await users.createOne({
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
});

// READ
const user = await users.findById(newUser._id);
const activeUsers = await users.find(
  { status: 'active' },
  { sort: { createdAt: -1 }, limit: 10 }
);

// UPDATE
const updatedUser = await users.updateById(user._id, {
  $set: { lastLogin: new Date() }
});

// DELETE
const deletedUser = await users.deleteById(user._id);
```

### Transaction Operations

```javascript
import TransactionService from './services/transactionService.js';

const transactionService = new TransactionService();

// Process order with inventory update
const orderResult = await transactionService.processOrder(
  {
    userId: 'user_id_here',
    shippingAddress: '123 Main St'
  },
  [
    { productId: 'product_id_1', quantity: 2 },
    { productId: 'product_id_2', quantity: 1 }
  ]
);

// Transfer funds between users
const transferResult = await transactionService.transferFunds(
  'from_user_id',
  'to_user_id',
  100.00,
  'Payment for services'
);
```

### Aggregation Pipelines

```javascript
import AggregationExamples from './services/aggregationExamples.js';

const aggregation = new AggregationExamples();

// Get user statistics
const userStats = await aggregation.getUserStatistics();

// Get sales trends
const salesTrends = await aggregation.getMonthlySalesTrends(6);

// Customer segmentation
const segments = await aggregation.getCustomerSegmentation();
```

### Database Connection

```javascript
import dbConnection from './config/database.js';

// Connect to database
await dbConnection.connect();

// Check connection health
const isHealthy = await dbConnection.ping();

// Get database instance
const db = dbConnection.getDatabase();

// Get collection
const collection = dbConnection.getCollection('users');

// Close connection
await dbConnection.close();
```

## 🔍 Available Operations

### CRUD Operations
- `createOne(document, options)` - Create single document
- `createMany(documents, options)` - Create multiple documents
- `find(filter, options)` - Find documents with filtering and pagination
- `findById(id, options)` - Find document by ID
- `findOne(filter, options)` - Find single document
- `count(filter, options)` - Count documents
- `exists(filter)` - Check if documents exist
- `updateById(id, update, options)` - Update document by ID
- `updateOne(filter, update, options)` - Update single document
- `updateMany(filter, update, options)` - Update multiple documents
- `replaceOne(filter, replacement, options)` - Replace document
- `deleteById(id, options)` - Delete document by ID
- `deleteOne(filter, options)` - Delete single document
- `deleteMany(filter, options)` - Delete multiple documents
- `aggregate(pipeline, options)` - Run aggregation pipeline
- `distinct(field, filter, options)` - Get distinct values

### Transaction Operations
- `processOrder(orderData, items)` - Process order with inventory update
- `transferFunds(fromUserId, toUserId, amount, description)` - Transfer funds
- `cancelOrder(orderId, reason)` - Cancel order and restore inventory
- `bulkUpdatePrices(priceUpdates)` - Bulk update product prices
- `createUserWithSetup(userData, initialSettings)` - Create user with setup

### Aggregation Examples
- `getUserStatistics()` - User statistics with order information
- `getProductSalesAnalytics(startDate, endDate)` - Product sales analytics
- `getMonthlySalesTrends(months)` - Monthly sales trends
- `getCustomerSegmentation()` - RFM customer segmentation
- `getInventoryAnalysis()` - Inventory status analysis

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | Database name | `myapp` |
| `MONGODB_USERNAME` | Database username | - |
| `MONGODB_PASSWORD` | Database password | - |
| `MONGODB_MAX_POOL_SIZE` | Maximum connection pool size | `10` |
| `MONGODB_MIN_POOL_SIZE` | Minimum connection pool size | `2` |
| `MONGODB_MAX_IDLE_TIME` | Max idle time for connections (ms) | `30000` |
| `MONGODB_SERVER_SELECTION_TIMEOUT` | Server selection timeout (ms) | `5000` |
| `MONGODB_SOCKET_TIMEOUT` | Socket timeout (ms) | `45000` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |

## 🧪 Testing

The project includes a comprehensive test suite that covers:

- Database connection and health checks
- All CRUD operations
- Transaction operations
- Aggregation pipelines
- Error handling scenarios

Run tests with:
```bash
npm test
```

## 🏗️ Production Deployment

### 1. Environment Configuration
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set appropriate connection pool sizes
- Enable authentication if required

### 2. Security Considerations
- Use MongoDB authentication
- Enable SSL/TLS for connections
- Implement proper error handling
- Set up monitoring and logging

### 3. Performance Optimization
- Create appropriate indexes
- Monitor connection pool usage
- Implement caching where needed
- Use read preferences for scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **Authentication Error**
   - Verify username/password
   - Check database permissions
   - Ensure authentication database is correct

3. **Timeout Errors**
   - Increase timeout values
   - Check network latency
   - Verify server capacity

4. **Index Creation Failed**
   - Check for duplicate data
   - Verify index specifications
   - Ensure sufficient permissions

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed connection and operation logs.

## 📚 Additional Resources

- [MongoDB Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Aggregation Pipeline Builder](https://docs.mongodb.com/compass/current/aggregation-pipeline-builder/)

---

**Ready to use!** This implementation provides everything you need for a production-ready MongoDB application using the native driver. Customize the operations and data models according to your specific requirements.