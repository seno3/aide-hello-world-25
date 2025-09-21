#!/bin/bash

echo "🐳 Setting up TBA Extension with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop:"
    echo ""
    echo "📥 Installation options:"
    echo "   1. Visit https://www.docker.com/products/docker-desktop/"
    echo "   2. Download Docker Desktop for Mac"
    echo "   3. Install and start Docker Desktop"
    echo "   4. Run this script again"
    echo ""
    echo "🔄 Alternative: Try starting Docker Desktop manually:"
    echo "   open -a Docker"
    echo ""
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "⚠️  Docker is not running. Starting Docker Desktop..."
    open -a Docker
    echo "⏳ Please wait for Docker to start (this may take a minute)..."
    echo "   You'll see a Docker whale icon in your menu bar when ready."
    echo ""
    echo "🔄 Once Docker is running, run this script again."
    exit 1
fi

echo "✅ Docker is running!"
echo ""

# Build the Docker image
echo "🔨 Building TBA Extension Docker image..."
docker build -t tba-extension .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo ""

# Run the container to install dependencies and compile
echo "📦 Installing dependencies and compiling TypeScript..."
docker run --rm -v "$(pwd)":/app -w /app tba-extension npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
docker run --rm -v "$(pwd)":/app -w /app tba-extension npm run compile

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compiled successfully!"
else
    echo "❌ Failed to compile TypeScript"
    exit 1
fi

echo ""
echo "🎉 TBA Extension setup complete with Docker!"
echo ""
echo "📋 Next steps:"
echo "   1. Open this folder in VS Code"
echo "   2. Press F5 to launch Extension Development Host"
echo "   3. Open a JavaScript/TypeScript file"
echo "   4. Start coding to see learning cards!"
echo ""
echo "🎯 Commands to try:"
echo "   - Ctrl+Shift+P → 'TBA: Open Learning Panel'"
echo "   - Ctrl+Shift+P → 'TBA: Export Today's Learnings'"
echo "   - Ctrl+Shift+P → 'TBA: Toggle Boss Fight Mode'"
echo ""
echo "🐳 Docker commands for development:"
echo "   - docker run --rm -v \$(pwd):/app -w /app tba-extension npm run watch"
echo "   - docker run --rm -v \$(pwd):/app -w /app tba-extension npm test"
