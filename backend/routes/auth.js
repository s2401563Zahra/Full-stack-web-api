const express = require('express');
const jwt = require('jsonwebtoken');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const axios = require('axios');

const router = express.Router();

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development' && 
  (process.env.AZURE_CLIENT_ID === 'development_placeholder' || 
   process.env.AZURE_CLIENT_SECRET === 'development_placeholder_secret');

// Azure Entra ID configuration
let pca = null;

if (!isDevelopment) {
  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    }
  };

  try {
    pca = new ConfidentialClientApplication(msalConfig);
  } catch (error) {
    console.warn('Azure MSAL configuration failed:', error.message);
    console.warn('Running in development mode without Azure authentication');
  }
}

// Login endpoint - redirect to Azure Entra ID or development mode
router.get('/login', (req, res) => {
  try {
    if (isDevelopment) {
      // Development mode - return a mock auth URL
      res.json({ 
        success: true,
        authUrl: `${process.env.AZURE_REDIRECT_URI}?code=dev_mock_code&state=login_state`,
        message: 'Development mode: Mock authentication URL generated',
        developmentMode: true
      });
      return;
    }

    if (!pca) {
      throw new Error('Azure authentication not configured');
    }

    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.AZURE_REDIRECT_URI,
      responseMode: 'query',
      state: 'login_state',
    };

    pca.getAuthCodeUrl(authCodeUrlParameters)
      .then((response) => {
        res.json({ 
          success: true,
          authUrl: response,
          message: 'Redirect to Azure Entra ID for authentication'
        });
      })
      .catch((error) => {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ 
          success: false,
          error: 'Failed to generate authentication URL',
          message: error.message
        });
      });
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication service error',
      message: error.message
    });
  }
});

// Callback endpoint - handle OAuth callback from Azure Entra ID or development mode
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.status(400).json({
        success: false,
        error: 'OAuth authentication failed',
        message: error_description || error
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code missing',
        message: 'No authorization code received from Azure Entra ID'
      });
    }

    if (isDevelopment && code === 'dev_mock_code') {
      // Development mode - create a mock user
      const mockUser = {
        id: 'dev-user-123',
        mail: 'dev.user@example.com',
        displayName: 'Development User',
        userPrincipalName: 'dev.user@example.com'
      };

      // Create JWT token for our application
      const jwtPayload = {
        sub: mockUser.id,
        email: mockUser.mail,
        name: mockUser.displayName,
        preferred_username: mockUser.userPrincipalName,
        roles: ['user'], // Default role
        iss: 'oauth-entra-sql-app',
        aud: 'oauth-entra-sql-api',
        iat: Math.floor(Date.now() / 1000),
      };

      const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '1h'
      });

      res.json({
        success: true,
        message: 'Development mode authentication successful',
        token: jwtToken,
        user: {
          id: mockUser.id,
          email: mockUser.mail,
          name: mockUser.displayName,
          username: mockUser.userPrincipalName
        },
        expiresIn: process.env.JWT_EXPIRATION || '1h',
        developmentMode: true
      });
      return;
    }

    if (!pca) {
      throw new Error('Azure authentication not configured');
    }

    // Exchange authorization code for tokens
    const tokenRequest = {
      code: code,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.AZURE_REDIRECT_URI,
    };

    const response = await pca.acquireTokenByCode(tokenRequest);
    
    if (!response || !response.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    // Get user profile from Microsoft Graph
    const userProfile = await getUserProfile(response.accessToken);

    // Create JWT token for our application
    const jwtPayload = {
      sub: userProfile.id,
      email: userProfile.mail || userProfile.userPrincipalName,
      name: userProfile.displayName,
      preferred_username: userProfile.userPrincipalName,
      roles: ['user'], // Default role, can be enhanced based on Entra ID roles
      iss: 'oauth-entra-sql-app',
      aud: 'oauth-entra-sql-api',
      iat: Math.floor(Date.now() / 1000),
    };

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1h'
    });

    // In production, consider using secure HTTP-only cookies
    res.json({
      success: true,
      message: 'Authentication successful',
      token: jwtToken,
      user: {
        id: userProfile.id,
        email: userProfile.mail || userProfile.userPrincipalName,
        name: userProfile.displayName,
        username: userProfile.userPrincipalName
      },
      expiresIn: process.env.JWT_EXPIRATION || '1h'
    });

  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication callback failed',
      message: error.message
    });
  }
});

// Get user profile from Microsoft Graph
async function getUserProfile(accessToken) {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    throw new Error('Failed to fetch user profile from Microsoft Graph');
  }
}

// Verify token endpoint
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        message: 'Please provide a token to verify'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: err.message
        });
      }

      res.json({
        success: true,
        message: 'Token is valid',
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          username: decoded.preferred_username,
          roles: decoded.roles
        },
        exp: decoded.exp
      });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      message: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a production app, you might want to invalidate the token
  // For now, we'll just return a success message
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;