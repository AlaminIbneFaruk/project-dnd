import CRUDOperations from './crudOperations.js';

/**
 * Advanced aggregation pipeline examples
 */
class AggregationExamples {
  constructor() {
    this.users = new CRUDOperations('users');
    this.orders = new CRUDOperations('orders');
    this.products = new CRUDOperations('products');
  }

  /**
   * Get user statistics with order information
   * @returns {Promise<Array>} User statistics
   */
  async getUserStatistics() {
    const pipeline = [
      // Match active users
      {
        $match: {
          status: 'active',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      
      // Lookup orders for each user
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.total'
              }
            }
          },
          averageOrderValue: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: '$orders',
                        as: 'order',
                        in: '$$order.total'
                      }
                    }
                  },
                  { $size: '$orders' }
                ]
              },
              else: 0
            }
          }
        }
      },
      
      // Group by user type and calculate statistics
      {
        $group: {
          _id: '$userType',
          totalUsers: { $sum: 1 },
          averageTotalSpent: { $avg: '$totalSpent' },
          averageOrderCount: { $avg: '$totalOrders' },
          topSpenders: {
            $push: {
              $cond: {
                if: { $gte: ['$totalSpent', 1000] },
                then: {
                  userId: '$_id',
                  name: '$name',
                  email: '$email',
                  totalSpent: '$totalSpent',
                  totalOrders: '$totalOrders'
                },
                else: '$$REMOVE'
              }
            }
          }
        }
      },
      
      // Sort by total users
      {
        $sort: { totalUsers: -1 }
      },
      
      // Limit top spenders to 5 per group
      {
        $addFields: {
          topSpenders: { $slice: ['$topSpenders', 5] }
        }
      }
    ];

    return await this.users.aggregate(pipeline);
  }

  /**
   * Get product sales analytics
   * @param {Date} startDate Start date for analysis
   * @param {Date} endDate End date for analysis
   * @returns {Promise<Array>} Product sales analytics
   */
  async getProductSalesAnalytics(startDate, endDate) {
    const pipeline = [
      // Match orders within date range
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          status: { $in: ['completed', 'shipped', 'delivered'] }
        }
      },
      
      // Unwind order items
      {
        $unwind: '$items'
      },
      
      // Lookup product information
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      
      // Unwind product (should be single item)
      {
        $unwind: '$product'
      },
      
      // Group by product and calculate metrics
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$product.name' },
          category: { $first: '$product.category' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          averagePrice: { $avg: '$items.price' },
          orderCount: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          uniqueCustomerCount: { $size: '$uniqueCustomers' },
          revenuePerOrder: { $divide: ['$totalRevenue', '$orderCount'] }
        }
      },
      
      // Sort by total revenue
      {
        $sort: { totalRevenue: -1 }
      },
      
      // Add ranking
      {
        $group: {
          _id: null,
          products: { $push: '$$ROOT' }
        }
      },
      
      {
        $unwind: {
          path: '$products',
          includeArrayIndex: 'rank'
        }
      },
      
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$products',
              { rank: { $add: ['$rank', 1] } }
            ]
          }
        }
      },
      
      // Remove uniqueCustomers array from output
      {
        $project: {
          uniqueCustomers: 0
        }
      }
    ];

    return await this.orders.aggregate(pipeline);
  }

  /**
   * Get monthly sales trends
   * @param {number} months Number of months to analyze
   * @returns {Promise<Array>} Monthly sales trends
   */
  async getMonthlySalesTrends(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const pipeline = [
      // Match orders within date range
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'shipped', 'delivered'] }
        }
      },
      
      // Group by year and month
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          uniqueCustomerCount: { $size: '$uniqueCustomers' },
          monthName: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          }
        }
      },
      
      // Sort by year and month
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      
      // Project final structure
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: 1,
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          uniqueCustomerCount: 1
        }
      }
    ];

    return await this.orders.aggregate(pipeline);
  }

  /**
   * Get customer segmentation analysis
   * @returns {Promise<Array>} Customer segments
   */
  async getCustomerSegmentation() {
    const pipeline = [
      // Lookup orders for each user
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      
      // Filter users with at least one order
      {
        $match: {
          'orders.0': { $exists: true }
        }
      },
      
      // Calculate customer metrics
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.total'
              }
            }
          },
          lastOrderDate: {
            $max: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.createdAt'
              }
            }
          },
          firstOrderDate: {
            $min: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.createdAt'
              }
            }
          }
        }
      },
      
      // Calculate recency, frequency, and monetary values
      {
        $addFields: {
          recency: {
            $divide: [
              { $subtract: [new Date(), '$lastOrderDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          },
          frequency: '$totalOrders',
          monetary: '$totalSpent',
          customerLifetime: {
            $divide: [
              { $subtract: ['$lastOrderDate', '$firstOrderDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      
      // Segment customers based on RFM analysis
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $lte: ['$recency', 30] },
                      { $gte: ['$frequency', 5] },
                      { $gte: ['$monetary', 500] }
                    ]
                  },
                  then: 'Champions'
                },
                {
                  case: {
                    $and: [
                      { $lte: ['$recency', 60] },
                      { $gte: ['$frequency', 3] },
                      { $gte: ['$monetary', 200] }
                    ]
                  },
                  then: 'Loyal Customers'
                },
                {
                  case: {
                    $and: [
                      { $lte: ['$recency', 30] },
                      { $gte: ['$monetary', 300] }
                    ]
                  },
                  then: 'Potential Loyalists'
                },
                {
                  case: {
                    $and: [
                      { $lte: ['$recency', 30] },
                      { $lte: ['$frequency', 2] }
                    ]
                  },
                  then: 'New Customers'
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$recency', 90] },
                      { $gte: ['$frequency', 3] }
                    ]
                  },
                  then: 'At Risk'
                },
                {
                  case: { $gte: ['$recency', 180] },
                  then: 'Lost Customers'
                }
              ],
              default: 'Regular Customers'
            }
          }
        }
      },
      
      // Group by segment
      {
        $group: {
          _id: '$segment',
          customerCount: { $sum: 1 },
          averageRecency: { $avg: '$recency' },
          averageFrequency: { $avg: '$frequency' },
          averageMonetary: { $avg: '$monetary' },
          totalRevenue: { $sum: '$monetary' },
          customers: {
            $push: {
              userId: '$_id',
              name: '$name',
              email: '$email',
              recency: { $round: ['$recency', 0] },
              frequency: '$frequency',
              monetary: { $round: ['$monetary', 2] }
            }
          }
        }
      },
      
      // Sort by total revenue
      {
        $sort: { totalRevenue: -1 }
      },
      
      // Round averages
      {
        $addFields: {
          averageRecency: { $round: ['$averageRecency', 1] },
          averageFrequency: { $round: ['$averageFrequency', 1] },
          averageMonetary: { $round: ['$averageMonetary', 2] },
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ];

    return await this.users.aggregate(pipeline);
  }

  /**
   * Get inventory analysis
   * @returns {Promise<Array>} Inventory analysis results
   */
  async getInventoryAnalysis() {
    const pipeline = [
      // Lookup recent orders (last 90 days)
      {
        $lookup: {
          from: 'orders',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                status: { $in: ['completed', 'shipped', 'delivered'] }
              }
            },
            { $unwind: '$items' },
            {
              $match: {
                $expr: { $eq: ['$items.productId', '$$productId'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: '$items.quantity' },
                orderCount: { $sum: 1 }
              }
            }
          ],
          as: 'salesData'
        }
      },
      
      // Add sales metrics
      {
        $addFields: {
          salesData: { $arrayElemAt: ['$salesData', 0] },
          daysInStock: {
            $cond: {
              if: { $and: ['$salesData', { $gt: ['$salesData.totalSold', 0] }] },
              then: {
                $divide: [
                  { $multiply: ['$stock', 90] },
                  '$salesData.totalSold'
                ]
              },
              else: null
            }
          }
        }
      },
      
      // Calculate inventory status
      {
        $addFields: {
          totalSold: { $ifNull: ['$salesData.totalSold', 0] },
          orderCount: { $ifNull: ['$salesData.orderCount', 0] },
          inventoryStatus: {
            $switch: {
              branches: [
                {
                  case: { $lte: ['$stock', 10] },
                  then: 'Low Stock'
                },
                {
                  case: { $eq: ['$stock', 0] },
                  then: 'Out of Stock'
                },
                {
                  case: {
                    $and: [
                      { $lt: ['$daysInStock', 30] },
                      { $gt: ['$totalSold', 0] }
                    ]
                  },
                  then: 'Fast Moving'
                },
                {
                  case: {
                    $and: [
                      { $gt: ['$daysInStock', 180] },
                      { $gt: ['$stock', 50] }
                    ]
                  },
                  then: 'Slow Moving'
                },
                {
                  case: { $eq: ['$totalSold', 0] },
                  then: 'No Sales'
                }
              ],
              default: 'Normal'
            }
          }
        }
      },
      
      // Group by inventory status
      {
        $group: {
          _id: '$inventoryStatus',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          products: {
            $push: {
              productId: '$_id',
              name: '$name',
              category: '$category',
              stock: '$stock',
              price: '$price',
              totalSold: '$totalSold',
              daysInStock: { $round: ['$daysInStock', 1] }
            }
          }
        }
      },
      
      // Sort by priority (Low Stock and Out of Stock first)
      {
        $addFields: {
          priority: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'Out of Stock'] }, then: 1 },
                { case: { $eq: ['$_id', 'Low Stock'] }, then: 2 },
                { case: { $eq: ['$_id', 'No Sales'] }, then: 3 },
                { case: { $eq: ['$_id', 'Slow Moving'] }, then: 4 }
              ],
              default: 5
            }
          }
        }
      },
      
      {
        $sort: { priority: 1 }
      },
      
      // Clean up output
      {
        $project: {
          priority: 0,
          'products.productId': 0
        }
      }
    ];

    return await this.products.aggregate(pipeline);
  }
}

export default AggregationExamples;