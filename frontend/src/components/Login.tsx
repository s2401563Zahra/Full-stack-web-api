import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login, handleAuthCallback } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Get the return URL from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setError(`Authentication failed: ${errorDescription || error}`);
      return;
    }

    if (code && state) {
      setProcessing(true);
      handleAuthCallback(code, state)
        .then(() => {
          // Success will be handled by the redirect below
        })
        .catch((err) => {
          console.error('Callback error:', err);
          setError(err.message || 'Authentication callback failed');
          setProcessing(false);
        });
    }
  }, [searchParams, handleAuthCallback]);

  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async () => {
    try {
      setError(null);
      setProcessing(true);
      await login();
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setProcessing(false);
    }
  };

  if (isLoading || processing) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-content">
            <div className="spinner"></div>
            <h2>
              {processing ? 'Processing authentication...' : 'Loading...'}
            </h2>
            <p>
              {processing 
                ? 'Please wait while we complete your authentication.' 
                : 'Please wait while we check your authentication status.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>OAuth + Azure Entra + SQL</h1>
          <p>Secure Authentication Demo</p>
        </div>

        <div className="login-content">
          <h2>Welcome</h2>
          <p>
            This application demonstrates OAuth authentication with Microsoft Entra ID 
            and secure access to Azure SQL Database.
          </p>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="login-features">
            <div className="feature">
              <span className="feature-icon">🔐</span>
              <span>OAuth 2.0 / OpenID Connect</span>
            </div>
            <div className="feature">
              <span className="feature-icon">☁️</span>
              <span>Microsoft Entra ID Integration</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🗃️</span>
              <span>Azure SQL Database</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <span>JWT Token Authentication</span>
            </div>
          </div>

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={processing}
          >
            {processing ? (
              <>
                <span className="button-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="microsoft-icon">🔑</span>
                Sign in with Microsoft
              </>
            )}
          </button>

          <div className="login-info">
            <p>
              Click the button above to authenticate with your Microsoft account 
              and access the secured database content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;