const jwt = require('jsonwebtoken');
const { Client } = require('@azure/msal-node');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authorization token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Add user information to request object
    req.user = user;
    next();
  });
};

// Azure Entra ID Token Validation Middleware
const validateEntraToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authorization token'
      });
    }

    // For production, implement proper token validation against Azure Entra ID
    // This is a simplified version for development
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Invalid token format',
        message: 'The provided token could not be decoded'
      });
    }

    // Add decoded token information to request
    req.entraUser = decoded.payload;
    next();
  } catch (error) {
    console.error('Entra token validation error:', error);
    return res.status(500).json({ 
      error: 'Token validation failed',
      message: 'An error occurred while validating the token'
    });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  validateEntraToken,
  requireRole
};