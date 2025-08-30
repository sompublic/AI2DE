#!/bin/bash

echo "🚀 Setting up AI IDE Phase 0-1 MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Installing Ollama for local AI models..."
    
    # Install Ollama based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://ollama.ai/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "❌ Please install Ollama manually from https://ollama.ai"
        exit 1
    fi
fi

echo "✅ Ollama detected"

# Start Ollama service
echo "🔄 Starting Ollama service..."
ollama serve &
sleep 3

# Pull Code Llama 70B (primary model)
echo "📥 Pulling Code Llama 70B (this may take a while)..."
ollama pull codellama:70b-code
ollama pull codellama:70b-instruct

echo "✅ Code Llama 70B ready"

# Optionally pull other models
read -p "🤔 Do you want to pull additional AI models? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Pulling additional models..."
    
    echo "  - DeepSeek Coder V3..."
    ollama pull deepseek-coder:latest
    
    echo "  - Qwen 2.5 Coder 32B..."
    ollama pull qwen2.5-coder:32b
    
    echo "  - Llama 3.1 70B..."
    ollama pull llama3.1:70b
    
    echo "✅ Additional models ready"
fi

# Set up environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp env.example .env
    echo "✅ Created .env file (edit with your API keys if using cloud models)"
fi

# Build the application
echo "🔨 Building AI IDE..."
npm run build

echo ""
echo "🎉 AI IDE Phase 0-1 MVP setup complete!"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "📦 To build for production:"
echo "   npm run build"
echo "   npm run package"
echo ""
echo "🤖 AI Models Available:"
echo "   • Code Llama 70B (Primary, Local)"
echo "   • Claude Code (Cloud, requires API key)"
echo "   • Codestral 25.01 (Cloud, requires API key)"
echo "   • OpenAI GPT-4 (Cloud, requires API key)"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   • DeepSeek Coder V3 (Local)"
    echo "   • Qwen 2.5 Coder 32B (Local)"
    echo "   • Llama 3.1 70B (Local)"
fi
echo ""
echo "📚 Edit .env file to configure cloud model API keys"
echo "🎯 Ready for Salesforce development with AI assistance!"
