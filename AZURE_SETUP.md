# Azure Configuration Guide

Follow these steps to configure Azure services for the OAuth + Entra + SQL demo.

## 1. Create Azure SQL Database

### Step 1: Create SQL Server

1. Go to Azure Portal → Create a resource → SQL Database
2. Create a new SQL server or use existing
3. **Important**: Enable "Use Azure Active Directory authentication only" or "Both Azure AD and SQL authentication"
4. Set yourself as the Azure AD admin
5. Configure networking to allow Azure services and your IP

### Step 2: Create Database

1. Create a new database on the server
2. Choose appropriate pricing tier (Basic is sufficient for demo)
3. Note the server name: `yourserver.database.windows.net`
4. Note the database name

### Step 3: Run Database Setup

1. Connect to the database using Azure Data Studio or SSMS
2. Run the SQL script from `database/setup.sql`
3. This creates tables and inserts sample data

## 2. Configure Microsoft Entra ID Application

### Step 1: Register Application

1. Go to Azure Portal → Entra ID → App registrations
2. Click "New registration"
3. Set name: "OAuth Entra SQL Demo"
4. Choose "Accounts in this organizational directory only"
5. Set Redirect URI:
   - Type: Web
   - URI: `http://localhost:3001/auth/callback`

### Step 2: Configure Application

1. After registration, note the **Application (client) ID**
2. Note the **Directory (tenant) ID**
3. Go to "Certificates & secrets"
4. Create a new client secret
5. **Important**: Copy the secret value immediately (it won't be shown again)

### Step 3: Set API Permissions (Optional)

1. Go to "API permissions"
2. Add Microsoft Graph permissions:
   - `User.Read` (for basic profile info)
   - `openid`, `profile`, `email` (automatically added)

### Step 4: Configure Authentication

1. Go to "Authentication"
2. Ensure redirect URI is set to `http://localhost:3001/auth/callback`
3. Check "Access tokens" and "ID tokens" under Implicit grant

## 3. Configure Database Access

### Option A: Use Your Azure AD Account

```sql
-- Connect to your Azure SQL database and run:
CREATE USER [your-email@yourdomain.com] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [your-email@yourdomain.com];
ALTER ROLE db_datawriter ADD MEMBER [your-email@yourdomain.com];
```

### Option B: Use Service Principal (For Production)

1. Create a service principal for your application
2. Grant SQL permissions to the service principal
3. Use client credentials flow for database access

## 4. Update Configuration Files

### Backend Configuration (`backend/.env`)

```env
NODE_ENV=development
PORT=3001

# From Entra ID App Registration
AZURE_CLIENT_ID=your_application_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_directory_tenant_id
AZURE_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Configuration
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRATION=1h

# Azure SQL Database Configuration
SQL_SERVER=yourserver.database.windows.net
SQL_DATABASE=your_database_name
# Leave username/password empty for Entra ID auth

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:3001
```

## 5. Test the Configuration

### Test Database Connection

1. Start the backend server: `npm run dev` in backend folder
2. Check logs for "Connected to Azure SQL Database"
3. Test health endpoint: `GET http://localhost:3001/health`

### Test Authentication

1. Start both servers using VS Code task "Start Full Stack"
2. Open `http://localhost:3000`
3. Click "Sign in with Microsoft"
4. Complete OAuth flow
5. Check if you can see data in the dashboard

## 6. Troubleshooting

### Common Issues

#### Database Connection Issues

- Ensure Azure SQL firewall allows your IP
- Verify Entra ID authentication is enabled
- Check if your account has database permissions

#### Authentication Issues

- Verify redirect URI matches exactly
- Check client secret hasn't expired
- Ensure application permissions are granted

#### CORS Issues

- Verify CORS_ORIGIN matches frontend URL
- Check browser console for CORS errors

### Debug Steps

1. Check browser network tab for API calls
2. Review backend logs for detailed error messages
3. Verify JWT token in browser developer tools
4. Test API endpoints directly with tools like Postman

## 7. Production Deployment

For production deployment:

1. **Use Managed Identity**: Replace client secret with managed identity
2. **Use Azure Key Vault**: Store secrets securely
3. **Configure Custom Domain**: Update redirect URIs
4. **Enable SSL**: Use HTTPS for all endpoints
5. **Review Security**: Implement additional security measures

## 8. Next Steps

- Implement role-based access control
- Add more sophisticated error handling
- Implement token refresh mechanism
- Add logging and monitoring
- Consider implementing refresh tokens
- Add unit and integration tests

---

For detailed documentation, refer to:

- [Microsoft Entra ID Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [OAuth 2.0 Documentation](https://oauth.net/2/)
