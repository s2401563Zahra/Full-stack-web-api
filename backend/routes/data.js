const express = require('express');
const sql = require('mssql');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const dbConnection = require('../config/database');

const router = express.Router();

// Apply authentication middleware to all data routes
router.use(authenticateToken);

// Initialize database connection
let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      await dbConnection.connect();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
};

// GET /api/users - Get all users from database
router.get('/users', async (req, res) => {
  try {
    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          email,
          display_name,
          created_at,
          last_login,
          is_active
        FROM users
        ORDER BY created_at DESC
      `);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.recordset,
      count: result.recordset.length,
      user: req.user.email // Include current user info
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error.message.includes('Invalid object name')) {
      res.status(500).json({
        success: false,
        error: 'Database table not found',
        message: 'The users table does not exist. Please run database setup first.',
        suggestion: 'Create the users table using the provided SQL scripts'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }
});

// GET /api/products - Get all products from database
router.get('/products', async (req, res) => {
  try {
    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          name,
          description,
          price,
          category,
          stock_quantity,
          created_at,
          updated_at,
          is_active
        FROM products
        WHERE is_active = 1
        ORDER BY name ASC
      `);

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.recordset,
      count: result.recordset.length,
      user: req.user.email
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error.message.includes('Invalid object name')) {
      res.status(500).json({
        success: false,
        error: 'Database table not found',
        message: 'The products table does not exist. Please run database setup first.',
        suggestion: 'Create the products table using the provided SQL scripts'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        message: error.message
      });
    }
  }
});

// GET /api/orders - Get orders for authenticated user
router.get('/orders', async (req, res) => {
  try {
    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    const result = await pool.request()
      .input('userEmail', sql.VarChar, req.user.email)
      .query(`
        SELECT 
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          o.updated_at,
          u.email as user_email,
          u.display_name as user_name
        FROM orders o
        INNER JOIN users u ON o.user_id = u.id
        WHERE u.email = @userEmail
        ORDER BY o.created_at DESC
      `);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result.recordset,
      count: result.recordset.length,
      user: req.user.email
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error.message.includes('Invalid object name')) {
      res.status(500).json({
        success: false,
        error: 'Database table not found',
        message: 'The orders or users table does not exist. Please run database setup first.',
        suggestion: 'Create the required tables using the provided SQL scripts'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
        message: error.message
      });
    }
  }
});

// POST /api/products - Create a new product (admin only)
router.post('/products', async (req, res) => {
  try {
    // Check if user has admin role
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role required to create products'
      });
    }

    // Validate input
    const schema = Joi.object({
      name: Joi.string().required().max(255),
      description: Joi.string().max(1000),
      price: Joi.number().positive().precision(2).required(),
      category: Joi.string().max(100),
      stock_quantity: Joi.number().integer().min(0).default(0)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    const result = await pool.request()
      .input('name', sql.VarChar, value.name)
      .input('description', sql.VarChar, value.description)
      .input('price', sql.Decimal(10, 2), value.price)
      .input('category', sql.VarChar, value.category)
      .input('stock_quantity', sql.Int, value.stock_quantity)
      .query(`
        INSERT INTO products (name, description, price, category, stock_quantity, created_at, updated_at, is_active)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @price, @category, @stock_quantity, GETUTCDATE(), GETUTCDATE(), 1)
      `);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.recordset[0],
      user: req.user.email
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// GET /api/stats - Get database statistics
router.get('/stats', async (req, res) => {
  try {
    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    
    // Get table counts
    const queries = [
      pool.request().query('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
      pool.request().query('SELECT COUNT(*) as count FROM products WHERE is_active = 1'),
      pool.request().query('SELECT COUNT(*) as count FROM orders')
    ];

    const [usersResult, productsResult, ordersResult] = await Promise.all(queries);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        users: usersResult.recordset[0].count,
        products: productsResult.recordset[0].count,
        orders: ordersResult.recordset[0].count,
        timestamp: new Date().toISOString()
      },
      user: req.user.email
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Health check for database connection
router.get('/health', async (req, res) => {
  try {
    await initializeDatabase();
    
    const pool = dbConnection.getPool();
    await pool.request().query('SELECT 1 as health_check');

    res.json({
      success: true,
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
      user: req.user.email
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message
    });
  }
});

module.exports = router;