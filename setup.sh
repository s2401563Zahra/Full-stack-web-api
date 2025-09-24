#!/bin/bash

# OAuth + Azure Entra + SQL Demo - Quick Start Script

echo "🚀 OAuth + Azure Entra + SQL Demo - Quick Start"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-flight checks..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo "✅ Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

cd ..

echo ""
echo "🔧 Configuration check..."

# Check backend environment file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env with your Azure configuration before starting the servers."
fi

# Check frontend environment file
if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found. Creating default..."
    echo "REACT_APP_API_URL=http://localhost:3001" > frontend/.env
fi

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Azure services (see AZURE_SETUP.md for detailed instructions)"
echo "2. Update backend/.env with your Azure configuration"
echo "3. Run database setup script (database/setup.sql) in your Azure SQL Database"
echo ""
echo "🚀 To start the development servers:"
echo "   - Option 1: Use VS Code task 'Start Full Stack' (Ctrl+Shift+P → Tasks: Run Task)"
echo "   - Option 2: Run manually:"
echo "     Terminal 1: cd backend && npm run dev"
echo "     Terminal 2: cd frontend && npm start"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete setup guide"
echo "   - AZURE_SETUP.md - Azure configuration guide"
echo ""
echo "Happy coding! 🎉"