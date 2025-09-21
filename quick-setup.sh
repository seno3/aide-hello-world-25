#!/bin/bash

echo "🚀 Quick TBA Extension Setup"
echo "=============================="
echo ""

# Try different methods to get Node.js working
echo "🔍 Looking for Node.js..."

# Method 1: Check if node is in PATH
if command -v node &> /dev/null; then
    echo "✅ Found Node.js: $(node --version)"
    echo "✅ Found npm: $(npm --version)"
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo ""
    echo "🔨 Compiling TypeScript..."
    npm run compile
    echo ""
    echo "🎉 Setup complete! Press F5 in VS Code to test the extension."
    exit 0
fi

# Method 2: Try with nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "🔄 Trying with nvm..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if command -v node &> /dev/null; then
        echo "✅ Found Node.js via nvm: $(node --version)"
        echo "✅ Found npm: $(npm --version)"
        echo ""
        echo "📦 Installing dependencies..."
        npm install
        echo ""
        echo "🔨 Compiling TypeScript..."
        npm run compile
        echo ""
        echo "🎉 Setup complete! Press F5 in VS Code to test the extension."
        exit 0
    fi
fi

# Method 3: Try Docker
echo "🐳 Trying Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker found: $(docker --version)"
    echo "🔨 Building and running setup in Docker..."
    
    # Build image
    docker build -t tba-extension . 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "📦 Installing dependencies in Docker..."
        docker run --rm -v "$(pwd)":/app -w /app tba-extension npm install
        
        echo "🔨 Compiling TypeScript in Docker..."
        docker run --rm -v "$(pwd)":/app -w /app tba-extension npm run compile
        
        echo "🎉 Setup complete with Docker! Press F5 in VS Code to test the extension."
        exit 0
    fi
fi

# If all methods fail
echo "❌ Could not find Node.js or Docker"
echo ""
echo "📥 Please install one of the following:"
echo ""
echo "1. Node.js:"
echo "   - Visit https://nodejs.org/"
echo "   - Download and install LTS version"
echo "   - Restart terminal and run this script again"
echo ""
echo "2. Docker Desktop:"
echo "   - Visit https://www.docker.com/products/docker-desktop/"
echo "   - Download and install Docker Desktop"
echo "   - Start Docker Desktop and run this script again"
echo ""
echo "3. Manual setup:"
echo "   - Install Node.js manually"
echo "   - Run: npm install"
echo "   - Run: npm run compile"
