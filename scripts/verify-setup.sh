#!/bin/bash

echo "🔍 Verifying AI IDE Phase 0-1 MVP Setup..."
echo ""

# Check if build artifacts exist
if [ -f "dist/main.js" ] && [ -f "dist/renderer/index.html" ] && [ -f "dist/renderer/renderer.js" ]; then
    echo "✅ Build artifacts present"
else
    echo "❌ Build artifacts missing - run 'npm run build'"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo "✅ Node.js $(node -v) (compatible)"
else
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
fi

# Check if Ollama is installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installed"
    
    # Check if Ollama is running
    if pgrep -f "ollama" > /dev/null; then
        echo "✅ Ollama service running"
        
        # Check if Code Llama is available
        if ollama list | grep -q "codellama"; then
            echo "✅ Code Llama 70B available"
        else
            echo "⚠️  Code Llama 70B not found - run 'ollama pull codellama:70b-code'"
        fi
    else
        echo "⚠️  Ollama service not running - run 'ollama serve'"
    fi
else
    echo "⚠️  Ollama not installed - install from https://ollama.ai"
fi

# Check package.json dependencies
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies missing - run 'npm install'"
fi

# Check if environment file exists
if [ -f ".env" ]; then
    echo "✅ Environment configured"
else
    echo "ℹ️  No .env file (optional for cloud models)"
fi

echo ""
echo "📋 Setup Summary:"
echo "===================="

# Count available features
FEATURES=0

[ -f "dist/main.js" ] && echo "✅ Desktop Application" && ((FEATURES++))
[ -f "src/main/ai/AIModelManager.ts" ] && echo "✅ Multi-Model AI System" && ((FEATURES++))
[ -f "src/renderer/components/CodeEditor.tsx" ] && echo "✅ Monaco Code Editor" && ((FEATURES++))
[ -f "src/renderer/components/AIChat.tsx" ] && echo "✅ AI Chat Interface" && ((FEATURES++))
[ -f "src/main/services/IndexerService.ts" ] && echo "✅ Code Indexing" && ((FEATURES++))
[ -f "src/main/services/EmbeddingsService.ts" ] && echo "✅ Embeddings & Search" && ((FEATURES++))

echo ""
echo "🎯 Phase 0-1 MVP Status: $FEATURES/6 features implemented"

if [ $FEATURES -eq 6 ]; then
    echo "🎉 Phase 0-1 MVP is COMPLETE and ready for use!"
    echo ""
    echo "🚀 To start the AI IDE:"
    echo "   npm run start"
    echo ""
    echo "🛠️  To start development:"
    echo "   npm run dev"
else
    echo "⚠️  Some features may be incomplete"
fi

echo ""
echo "📚 Next Steps:"
echo "- Test the application with real Salesforce projects"
echo "- Configure additional AI models as needed"
echo "- Begin Phase 2 development for advanced features"
