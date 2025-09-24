const sql = require('mssql');
const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.connected = false;
    this.developmentMode = false;
  }

  async connect() {
    try {
      // Check if we're in development mode with placeholder values
      if (process.env.NODE_ENV === 'development' && 
          (process.env.SQL_SERVER === 'localhost' || 
           process.env.SQL_DATABASE === 'development_db')) {
        console.log('🚧 Running in development mode - using mock database connection');
        this.developmentMode = true;
        this.connected = true;
        this.pool = this.createMockPool();
        return this.pool;
      }

      // Configuration for Azure SQL with Entra ID authentication
      const config = {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        options: {
          encrypt: true, // Use encryption
          enableArithAbort: true,
          trustServerCertificate: false,
          connectTimeout: 30000,
          requestTimeout: 30000,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        }
      };

      // Use Azure Entra ID authentication if available
      if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
        console.log('🔐 Using Azure Entra ID authentication for SQL connection');
        
        // For production: Use Managed Identity when running in Azure
        // const credential = new DefaultAzureCredential();
        
        // For development: Use Client Secret credential
        const credential = new ClientSecretCredential(
          process.env.AZURE_TENANT_ID,
          process.env.AZURE_CLIENT_ID,
          process.env.AZURE_CLIENT_SECRET
        );

        // Get access token for Azure SQL
        const tokenResponse = await credential.getToken('https://database.windows.net/');
        config.authentication = {
          type: 'azure-active-directory-access-token',
          options: {
            token: tokenResponse.token
          }
        };
      } else {
        // Fallback to SQL authentication
        console.log('🔑 Using SQL authentication for database connection');
        config.user = process.env.SQL_USERNAME;
        config.password = process.env.SQL_PASSWORD;
      }

      this.pool = await sql.connect(config);
      this.connected = true;
      
      console.log('✅ Connected to Azure SQL Database');
      console.log(`📊 Database: ${process.env.SQL_DATABASE}`);
      console.log(`🖥️  Server: ${process.env.SQL_SERVER}`);

      // Test the connection
      await this.testConnection();
      
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      const result = await this.pool.request().query('SELECT 1 as test');
      if (this.developmentMode) {
        console.log('🧪 Mock database connection test successful');
      } else {
        console.log('🧪 Database connection test successful');
      }
      return result;
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.connected = false;
        console.log('🔌 Disconnected from database');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error.message);
    }
  }

  createMockPool() {
    // Create a mock pool for development mode
    const mockData = {
      users: [
        { id: 1, email: 'dev.user@example.com', display_name: 'Development User', created_at: new Date(), last_login: new Date(), is_active: 1 },
        { id: 2, email: 'admin@example.com', display_name: 'Admin User', created_at: new Date(), last_login: new Date(), is_active: 1 }
      ],
      products: [
        { id: 1, name: 'Sample Product 1', description: 'A sample product for development', price: 29.99, category: 'Electronics', stock_quantity: 10, created_at: new Date(), updated_at: new Date(), is_active: 1 },
        { id: 2, name: 'Sample Product 2', description: 'Another sample product', price: 49.99, category: 'Books', stock_quantity: 5, created_at: new Date(), updated_at: new Date(), is_active: 1 }
      ],
      orders: [
        { id: 1, total_amount: 29.99, status: 'completed', created_at: new Date(), updated_at: new Date(), user_email: 'dev.user@example.com', user_name: 'Development User' }
      ]
    };

    return {
      request: () => ({
        input: () => ({ query: (sql) => this.mockQuery(sql, mockData) }),
        query: (sql) => this.mockQuery(sql, mockData)
      }),
      connected: true
    };
  }

  mockQuery(sql, mockData) {
    // Simple mock query processor for development
    console.log('🧪 Mock query:', sql.substring(0, 100) + '...');
    
    if (sql.includes('SELECT 1 as')) {
      return Promise.resolve({ recordset: [{ test: 1, health_check: 1 }] });
    }
    
    if (sql.includes('FROM users')) {
      return Promise.resolve({ recordset: mockData.users });
    }
    
    if (sql.includes('FROM products')) {
      return Promise.resolve({ recordset: mockData.products });
    }
    
    if (sql.includes('FROM orders')) {
      return Promise.resolve({ recordset: mockData.orders });
    }
    
    if (sql.includes('COUNT(*)')) {
      if (sql.includes('users')) return Promise.resolve({ recordset: [{ count: mockData.users.length }] });
      if (sql.includes('products')) return Promise.resolve({ recordset: [{ count: mockData.products.length }] });
      if (sql.includes('orders')) return Promise.resolve({ recordset: [{ count: mockData.orders.length }] });
    }
    
    // Default response for unknown queries
    return Promise.resolve({ recordset: [] });
  }

  getPool() {
    if (!this.connected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  isConnected() {
    return this.connected && (this.developmentMode || (this.pool && this.pool.connected));
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;