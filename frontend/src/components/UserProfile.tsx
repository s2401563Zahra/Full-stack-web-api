import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, token } = useAuth();

  const formatTokenInfo = (token: string) => {
    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        issuer: payload.iss,
        audience: payload.aud,
        subject: payload.sub,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        roles: payload.roles || []
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const tokenInfo = token ? formatTokenInfo(token) : null;
  const isTokenExpired = tokenInfo ? new Date() > tokenInfo.expiresAt : false;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="profile-info">
          <h1>{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-status">
            <span className="status-indicator active">✅</span>
            <span>Authenticated via Microsoft Entra ID</span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>
            <span className="section-icon">🔐</span>
            Authentication Details
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <label>User ID</label>
              <div className="info-value">{user?.id}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{user?.email}</div>
            </div>
            <div className="info-item">
              <label>Display Name</label>
              <div className="info-value">{user?.name}</div>
            </div>
            <div className="info-item">
              <label>Username</label>
              <div className="info-value">{user?.username}</div>
            </div>
          </div>
        </div>

        {tokenInfo && (
          <div className="profile-section">
            <h2>
              <span className="section-icon">🎫</span>
              JWT Token Information
            </h2>
            <div className="token-info">
              <div className="token-status">
                <span className={`token-indicator ${isTokenExpired ? 'expired' : 'valid'}`}>
                  {isTokenExpired ? '❌' : '✅'}
                </span>
                <span className="token-status-text">
                  Token is {isTokenExpired ? 'expired' : 'valid'}
                </span>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Issuer</label>
                  <div className="info-value">{tokenInfo.issuer}</div>
                </div>
                <div className="info-item">
                  <label>Audience</label>
                  <div className="info-value">{tokenInfo.audience}</div>
                </div>
                <div className="info-item">
                  <label>Subject</label>
                  <div className="info-value">{tokenInfo.subject}</div>
                </div>
                <div className="info-item">
                  <label>Issued At</label>
                  <div className="info-value">
                    {tokenInfo.issuedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
                <div className="info-item">
                  <label>Expires At</label>
                  <div className={`info-value ${isTokenExpired ? 'expired' : ''}`}>
                    {tokenInfo.expiresAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
                <div className="info-item">
                  <label>Roles</label>
                  <div className="info-value">
                    {tokenInfo.roles.length > 0 ? (
                      <div className="roles-list">
                        {tokenInfo.roles.map((role: string, index: number) => (
                          <span key={index} className="role-badge">{role}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-roles">No specific roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h2>
            <span className="section-icon">🛡️</span>
            Security Features
          </h2>
          <div className="security-features">
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <div className="feature-content">
                <h3>OAuth 2.0 / OpenID Connect</h3>
                <p>Authenticated using industry-standard OAuth 2.0 protocol with Microsoft Entra ID</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎫</div>
              <div className="feature-content">
                <h3>JWT Token Authentication</h3>
                <p>API access secured with JSON Web Tokens containing user claims and permissions</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">☁️</div>
              <div className="feature-content">
                <h3>Azure Entra ID Integration</h3>
                <p>Identity and access management powered by Microsoft's cloud identity service</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🗃️</div>
              <div className="feature-content">
                <h3>Azure SQL Database</h3>
                <p>Secure database access using Entra ID authentication with encrypted connections</p>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>
            <span className="section-icon">📋</span>
            Technical Implementation
          </h2>
          <div className="tech-details">
            <div className="tech-item">
              <strong>Frontend:</strong> React with TypeScript, Context API for state management
            </div>
            <div className="tech-item">
              <strong>Backend:</strong> Node.js with Express, JWT middleware for authentication
            </div>
            <div className="tech-item">
              <strong>Database:</strong> Azure SQL Database with Entra ID authentication
            </div>
            <div className="tech-item">
              <strong>Authentication:</strong> Microsoft Entra ID OAuth 2.0 / OpenID Connect
            </div>
            <div className="tech-item">
              <strong>Security:</strong> HTTPS, CORS, Rate limiting, Helmet.js security headers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;