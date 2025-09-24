#!/bin/bash

# Azure Deployment Script
# This script helps deploy the OAuth + Entra + SQL application to Azure

set -e

echo "🚀 Azure Deployment Script"
echo "=========================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

print_status "Azure CLI found"

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Please log in:"
    az login
fi

print_status "Azure login verified"

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
print_info "Current subscription: $SUBSCRIPTION"

# Configuration variables
RESOURCE_GROUP_NAME="oauth-entra-sql-rg"
LOCATION="westeurope"
APP_SERVICE_PLAN="oauth-entra-plan"
BACKEND_APP_NAME="oauth-entra-api-$(date +%s)"
FRONTEND_APP_NAME="oauth-entra-frontend-$(date +%s)"
SQL_SERVER_NAME="oauth-entra-sql-$(date +%s)"
SQL_DATABASE_NAME="oauth-entra-database"

echo ""
print_info "Deployment Configuration:"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo "Backend App: $BACKEND_APP_NAME"
echo "Frontend App: $FRONTEND_APP_NAME"
echo "SQL Server: $SQL_SERVER_NAME"
echo ""

read -p "Do you want to continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Create Resource Group
print_info "Creating Resource Group..."
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

print_status "Resource Group created: $RESOURCE_GROUP_NAME"

# Create App Service Plan
print_info "Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku F1 \
    --is-linux

print_status "App Service Plan created: $APP_SERVICE_PLAN"

# Create Backend Web App
print_info "Creating Backend Web App..."
az webapp create \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --plan $APP_SERVICE_PLAN \
    --runtime "NODE:18-lts"

print_status "Backend Web App created: $BACKEND_APP_NAME"

# Configure Backend App Settings
print_info "Configuring Backend App Settings..."
az webapp config appsettings set \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --settings \
        NODE_ENV=production \
        PORT=8000 \
        CORS_ORIGIN="https://$FRONTEND_APP_NAME.azurestaticapps.net" \
        JWT_SECRET="$(openssl rand -base64 32)" \
        JWT_EXPIRATION="1h" \
        RATE_LIMIT_WINDOW_MS=900000 \
        RATE_LIMIT_MAX_REQUESTS=100

print_status "Backend App Settings configured"

# Create SQL Server
print_info "Creating SQL Server..."
print_warning "You will need to set up a SQL admin user. Please follow the prompts."

# Get current user for SQL admin
CURRENT_USER=$(az ad signed-in-user show --query userPrincipalName -o tsv)

az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --enable-ad-only-auth \
    --external-admin-principal-type User \
    --external-admin-name "$CURRENT_USER" \
    --external-admin-sid $(az ad signed-in-user show --query id -o tsv)

print_status "SQL Server created: $SQL_SERVER_NAME"

# Create SQL Database
print_info "Creating SQL Database..."
az sql db create \
    --name $SQL_DATABASE_NAME \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --service-objective Basic

print_status "SQL Database created: $SQL_DATABASE_NAME"

# Configure SQL Server Firewall
print_info "Configuring SQL Server Firewall..."
# Allow Azure services
az sql server firewall-rule create \
    --name "AllowAzureServices" \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Allow current IP
CURRENT_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
    --name "AllowCurrentIP" \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --start-ip-address $CURRENT_IP \
    --end-ip-address $CURRENT_IP

print_status "SQL Server Firewall configured"

# Update Backend App Settings with SQL connection
print_info "Updating Backend with SQL connection..."
az webapp config appsettings set \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --settings \
        SQL_SERVER="$SQL_SERVER_NAME.database.windows.net" \
        SQL_DATABASE="$SQL_DATABASE_NAME"

print_status "SQL connection configured"

# Create Static Web App for Frontend
print_info "Creating Static Web App for Frontend..."
print_warning "Static Web App creation requires GitHub integration."
print_info "Please follow these steps manually:"
echo "1. Go to Azure Portal"
echo "2. Create a Static Web App"
echo "3. Connect to your GitHub repository"
echo "4. Set build configuration:"
echo "   - App location: /frontend"
echo "   - Output location: build"
echo ""

# Display deployment information
echo ""
print_status "Deployment Information"
echo "======================"
echo ""
print_info "Backend API URL: https://$BACKEND_APP_NAME.azurewebsites.net"
print_info "SQL Server: $SQL_SERVER_NAME.database.windows.net"
print_info "SQL Database: $SQL_DATABASE_NAME"
echo ""

print_warning "Next Steps:"
echo "1. Create Microsoft Entra ID Application Registration"
echo "2. Update Backend App Settings with Entra ID credentials"
echo "3. Create Static Web App for Frontend (manual step)"
echo "4. Run database setup script (database/setup.sql)"
echo "5. Test the complete application"
echo ""

print_info "Backend App Settings to Update:"
echo "AZURE_CLIENT_ID=<your-client-id>"
echo "AZURE_CLIENT_SECRET=<your-client-secret>"
echo "AZURE_TENANT_ID=<your-tenant-id>"
echo "AZURE_REDIRECT_URI=https://$BACKEND_APP_NAME.azurewebsites.net/auth/callback"
echo ""

print_status "Azure deployment script completed!"
echo "Check the Azure Portal for your deployed resources."