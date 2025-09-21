#!/bin/bash

echo "🎓 Setting up Teach-Before-Apply Extension..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first:"
    echo "   1. Visit https://nodejs.org/"
    echo "   2. Download and install the LTS version"
    echo "   3. Restart your terminal"
    echo "   4. Run this script again"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please ensure npm is installed with Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compiled successfully!"
else
    echo "❌ Failed to compile TypeScript"
    exit 1
fi

echo ""
echo "🎉 Extension setup complete!"
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
