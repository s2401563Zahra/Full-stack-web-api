# OAuth + Azure Entra + SQL Integration

A full-stack web application demonstrating OAuth authentication with Microsoft Entra ID (formerly Azure AD) and secure access to Azure SQL Database.

## 🏗️ Architecture

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: Azure SQL Database
- **Authentication**: Microsoft Entra ID (OAuth 2.0 / OpenID Connect)
- **Authorization**: JWT tokens
- **Security**: Entra ID authentication for SQL Database

## ✨ Features

- 🔐 OAuth 2.0 / OpenID Connect authentication with Microsoft Entra ID
- 🎫 JWT token-based API authorization
- ☁️ Azure SQL Database with Entra ID authentication
- 📊 Real-time dashboard with database statistics
- 👤 User profile with token information
- 🛡️ Security best practices implementation
- 📱 Responsive design for mobile and desktop

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure SQL Database
- Microsoft Entra ID (Azure AD) tenant

### 1. Azure Setup (Quick Start)

📋 **Nopea aloitus**: Seuraa [QUICK_START_AZURE.md](./QUICK_START_AZURE.md) ohjeita (~30-45 min)

📖 **Yksityiskohtaiset ohjeet**:

- 🗄️ [Azure SQL Database Setup](./AZURE_SQL_SETUP.md) - Tietokannan konfigurointi
- 🔐 [Microsoft Entra ID Setup](./ENTRA_ID_SETUP.md) - OAuth-sovelluksen rekisteröinti
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Tuotantoon deployment

#### Configure Database Permissions

Run the following SQL commands in your Azure SQL Database:

```sql
-- Create user for your Entra ID account
CREATE USER [your-email@yourdomain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your-email@yourdomain.com];
ALTER ROLE db_datawriter ADD MEMBER [your-email@yourdomain.com];
```

### 2. Database Setup

1. Connect to your Azure SQL Database using Azure Data Studio or SQL Server Management Studio
2. Run the setup script:

```bash
# Navigate to the database directory
cd database

# Execute setup.sql in your Azure SQL Database
# This creates tables and inserts sample data
```

### 3. Backend Configuration

1. Navigate to the backend directory:

```bash
cd backend
```

2. Copy environment configuration:

```bash
cp .env.example .env
```

3. Update the `.env` file with your Azure configuration:

```env
NODE_ENV=development
PORT=3001

# Azure Entra ID Configuration
AZURE_CLIENT_ID=your_client_id_here
AZURE_CLIENT_SECRET=your_client_secret_here
AZURE_TENANT_ID=your_tenant_id_here
AZURE_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRATION=1h

# Azure SQL Database Configuration
SQL_SERVER=your_server.database.windows.net
SQL_DATABASE=your_database_name
# Leave SQL_USERNAME and SQL_PASSWORD empty to use Entra ID auth

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

4. Install dependencies:

```bash
npm install
```

5. Start the development server:

```bash
npm run dev
```

### 4. Frontend Configuration

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Update the `.env` file if needed:

```env
REACT_APP_API_URL=http://localhost:3001
```

3. Install dependencies (if not already done):

```bash
npm install
```

4. Start the development server:

```bash
npm start
```

### 5. Testing the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. Authenticate with your Microsoft account
4. Explore the dashboard to see data from Azure SQL Database
5. Check your user profile for token information

## 📁 Project Structure

```
├── backend/
│   ├── config/
│   │   └── database.js          # Azure SQL connection with Entra ID
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── routes/
│   │   ├── auth.js              # OAuth/Entra ID authentication routes
│   │   └── data.js              # Protected API endpoints
│   ├── .env.example             # Environment configuration template
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx    # Route protection component
│   │   │   ├── Dashboard.tsx    # Main dashboard with data
│   │   │   ├── Login.tsx        # Authentication page
│   │   │   ├── Navigation.tsx   # App navigation
│   │   │   └── UserProfile.tsx  # User profile and token info
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Authentication state management
│   │   ├── services/
│   │   │   └── api.ts           # API client with interceptors
│   │   └── App.tsx              # Main application component
│   ├── .env                     # Frontend environment configuration
│   └── package.json             # Frontend dependencies
├── database/
│   └── setup.sql                # Database schema and sample data
└── README.md                    # This file
```

## 🔧 API Endpoints

### Authentication Endpoints

- `GET /auth/login` - Get authentication URL
- `GET /auth/callback` - Handle OAuth callback
- `POST /auth/verify` - Verify JWT token
- `POST /auth/logout` - Logout user

### Protected Data Endpoints

- `GET /api/users` - Get all users from database
- `GET /api/products` - Get all products from database
- `GET /api/orders` - Get orders for authenticated user
- `GET /api/stats` - Get database statistics
- `POST /api/products` - Create new product (admin only)
- `GET /api/health` - Database health check

## 🛡️ Security Features

- **OAuth 2.0 / OpenID Connect**: Industry-standard authentication
- **JWT Tokens**: Secure API authorization with expiration
- **Azure Entra ID**: Enterprise-grade identity management
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin request security
- **Rate Limiting**: API abuse protection
- **Helmet.js**: Security headers
- **Environment Variables**: Secure configuration management

## 🚀 Deployment

### Azure App Service Deployment

1. Create Azure App Service for both frontend and backend
2. Configure environment variables in App Service
3. Enable system-assigned managed identity
4. Update SQL Database permissions for managed identity
5. Deploy using Azure DevOps or GitHub Actions

### Environment Variables for Production

Update the following for production deployment:

```env
NODE_ENV=production
AZURE_REDIRECT_URI=https://your-backend-domain.azurewebsites.net/auth/callback
CORS_ORIGIN=https://your-frontend-domain.azurewebsites.net
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, please create an issue in this repository or contact the development team.

## 🔗 Useful Links

- [Microsoft Entra ID Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [JWT.io](https://jwt.io/) - JWT token decoder
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

**Note**: This is a demonstration application. For production use, please review and implement additional security measures as needed for your specific requirements.
