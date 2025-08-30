#!/bin/bash

echo "🚀 AI IDE Phase 0-1 MVP - Quick Start"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the AI IDE root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Ollama is running
if ! pgrep -f "ollama" > /dev/null; then
    echo "🔄 Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Check if Code Llama is available
if ! ollama list | grep -q "codellama"; then
    echo "📥 Code Llama not found. Pulling Code Llama 70B (this will take a while)..."
    ollama pull codellama:70b-code
    ollama pull codellama:70b-instruct
fi

# Build the application
echo "🔨 Building AI IDE..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting AI IDE..."
    echo ""
    npm run start
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
