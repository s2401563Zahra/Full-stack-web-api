import React, { useState, useEffect } from 'react';
import { dataAPI, Product, Order, DatabaseUser, Stats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'users'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const promises = [
        dataAPI.getStats(),
        dataAPI.getProducts(),
        dataAPI.getOrders(),
        dataAPI.getUsers()
      ];

      const [statsResponse, productsResponse, ordersResponse, usersResponse] = await Promise.allSettled(promises);

      // Handle stats
      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.data as Stats);
      }

      // Handle products
      if (productsResponse.status === 'fulfilled') {
        setProducts(productsResponse.value.data as Product[]);
      }

      // Handle orders
      if (ordersResponse.status === 'fulfilled') {
        setOrders(ordersResponse.value.data as Order[]);
      }

      // Handle users
      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value.data as DatabaseUser[]);
      }

      // Check if any requests failed
      const failed = [statsResponse, productsResponse, ordersResponse, usersResponse]
        .filter(result => result.status === 'rejected');

      if (failed.length > 0) {
        console.warn('Some data requests failed:', failed);
      }

    } catch (err: any) {
      console.error('Dashboard data loading error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Dashboard</h2>
          <p>Fetching data from Azure SQL Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>! Here's your data from Azure SQL Database.</p>
        </div>
        <button onClick={loadDashboardData} className="refresh-button" title="Refresh data">
          <span className="refresh-icon">🔄</span>
          Refresh
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={loadDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="tab-icon">📦</span>
          Products ({products.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="tab-icon">🛒</span>
          Orders ({orders.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          Users ({users.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats?.users || 0}</p>
                  <span className="stat-label">Active users</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>Products</h3>
                  <p className="stat-number">{stats?.products || 0}</p>
                  <span className="stat-label">In catalog</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div className="stat-content">
                  <h3>Orders</h3>
                  <p className="stat-number">{stats?.orders || 0}</p>
                  <span className="stat-label">Total orders</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🕒</div>
                <div className="stat-content">
                  <h3>Last Updated</h3>
                  <p className="stat-time">{stats?.timestamp ? formatDate(stats.timestamp) : 'N/A'}</p>
                  <span className="stat-label">Data freshness</span>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h2>Database Connection Status</h2>
              <div className="connection-status">
                <span className="status-indicator success">✅</span>
                <div className="status-details">
                  <h3>Connected to Azure SQL Database</h3>
                  <p>Successfully authenticated using Azure Entra ID and retrieved data from the database.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products-tab">
            <div className="tab-header">
              <h2>Products from Database</h2>
              <p>Products retrieved from Azure SQL Database</p>
            </div>
            {products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h3>No Products Found</h3>
                <p>The products table appears to be empty or doesn't exist yet.</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <div className="product-name">
                            <strong>{product.name}</strong>
                            {product.description && (
                              <small>{product.description}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">{product.category}</span>
                        </td>
                        <td className="price">{formatCurrency(product.price)}</td>
                        <td className="stock">{product.stock_quantity}</td>
                        <td className="date">{formatDate(product.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div className="tab-header">
              <h2>Your Orders</h2>
              <p>Orders associated with your account</p>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🛒</span>
                <h3>No Orders Found</h3>
                <p>You don't have any orders yet, or the orders table doesn't exist.</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Customer</th>
                      <th>Created</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td className="price">{formatCurrency(order.total_amount)}</td>
                        <td>
                          <span className={`status-badge status-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="customer-info">
                            <strong>{order.user_name}</strong>
                            <small>{order.user_email}</small>
                          </div>
                        </td>
                        <td className="date">{formatDate(order.created_at)}</td>
                        <td className="date">{formatDate(order.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="tab-header">
              <h2>Database Users</h2>
              <p>Users stored in the Azure SQL Database</p>
            </div>
            {users.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <h3>No Users Found</h3>
                <p>The users table appears to be empty or doesn't exist yet.</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((dbUser) => (
                      <tr key={dbUser.id} className={dbUser.email === user?.email ? 'current-user' : ''}>
                        <td>{dbUser.id}</td>
                        <td>
                          <div className="user-name">
                            <strong>{dbUser.display_name}</strong>
                            {dbUser.email === user?.email && (
                              <span className="current-user-badge">You</span>
                            )}
                          </div>
                        </td>
                        <td>{dbUser.email}</td>
                        <td>
                          <span className={`status-badge ${dbUser.is_active ? 'status-active' : 'status-inactive'}`}>
                            {dbUser.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="date">{formatDate(dbUser.created_at)}</td>
                        <td className="date">
                          {dbUser.last_login ? formatDate(dbUser.last_login) : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;