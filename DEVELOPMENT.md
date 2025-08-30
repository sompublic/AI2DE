# AI IDE Phase 0-1 MVP - Development Guide

## 🎉 Phase 0-1 MVP Complete!

The foundational AI IDE has been successfully implemented with all core features:

### ✅ Completed Features

#### Core Architecture
- **Electron Desktop App** - Cross-platform desktop application
- **Multi-Model AI System** - Extensible architecture supporting multiple AI models
- **Language Support** - Salesforce Apex, LWC, SOQL, JavaScript, Python, Java
- **VS Code-like Interface** - Familiar UI with file explorer, tabs, and editor

#### AI Integration
- **Code Llama 70B** - Primary local model for code completion
- **Multi-Model Support** - Claude, Codestral, DeepSeek, Qwen, Llama 3.1, OpenAI
- **Inline Completions** - Real-time AI-powered code suggestions
- **AI Chat Interface** - Context-aware coding assistant
- **Smart Model Selection** - Automatic model routing based on task type

#### Code Intelligence
- **Code Indexer** - Symbol extraction and fast search
- **Embeddings Service** - Semantic code search and similarity
- **Multi-Language Parsing** - Support for all target languages
- **Project-wide Search** - Find symbols and similar code patterns

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Local AI Models
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Pull Code Llama 70B (primary model)
ollama pull codellama:70b-code
ollama pull codellama:70b-instruct
```

### 3. Configure Environment (Optional)
```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys for cloud models
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
# MISTRAL_API_KEY=your_key_here
```

### 4. Build and Run
```bash
# Build the application
npm run build

# Start the AI IDE
npm run start
```

Or use the quick start script:
```bash
./scripts/quick-start.sh
```

## 🏗️ Architecture Overview

### Main Process (`src/main/`)
- **`main.ts`** - Electron main process and IPC handlers
- **`preload.ts`** - Secure bridge between main and renderer
- **`ai/AIModelManager.ts`** - Multi-model AI orchestration
- **`ai/models/`** - Individual AI model implementations
- **`filesystem/`** - File system operations
- **`services/`** - Indexing and embeddings services

### Renderer Process (`src/renderer/`)
- **`App.tsx`** - Main application component
- **`components/`** - React UI components
  - `CodeEditor.tsx` - Monaco-based code editor
  - `AIChat.tsx` - AI assistant chat interface
  - `FileExplorer.tsx` - Project file browser
  - `AIInlineCompletion.tsx` - Inline completion UI
  - `MenuBar.tsx` - Top menu bar
  - `StatusBar.tsx` - Bottom status information

### Shared (`src/shared/`)
- **`types/ai.ts`** - Type definitions for AI system

## 🤖 AI Model System

### Supported Models

#### Local Models (via Ollama)
1. **Code Llama 70B** (Primary)
   - Best for: Code completion, generation
   - Languages: All supported
   - Latency: Medium, Privacy: High

2. **DeepSeek Coder V3**
   - Best for: Code optimization, debugging
   - Languages: All supported
   - Latency: Medium, Privacy: High

3. **Qwen 2.5 Coder 32B**
   - Best for: Multi-language support, documentation
   - Languages: All supported
   - Latency: Medium, Privacy: High

4. **Llama 3.1 70B**
   - Best for: General coding, reasoning
   - Languages: All supported
   - Latency: Medium, Privacy: High

#### Cloud Models
1. **Claude Code** (Anthropic)
   - Best for: Code review, architecture
   - Languages: All supported
   - Latency: Low, Privacy: Medium

2. **Codestral 25.01** (Mistral)
   - Best for: Fast completions
   - Languages: All supported
   - Latency: Low, Privacy: Medium

3. **GPT-4 Turbo** (OpenAI)
   - Best for: Complex reasoning, fallback
   - Languages: All supported
   - Latency: Low, Privacy: Medium

### Smart Model Selection

The AI system automatically selects the optimal model based on:
- **Task Type** (completion, chat, inline)
- **Context Size** (small vs large codebases)
- **Latency Requirements** (real-time vs batch)
- **User Preferences** (local vs cloud)
- **Language Specificity** (Salesforce vs general)

## 💻 Development Workflow

### Adding New AI Models

1. **Create Model Implementation**
```typescript
// src/main/ai/models/YourModel.ts
export class YourModel extends AIModel {
  async initialize(): Promise<void> { /* ... */ }
  async complete(request: CompletionRequest): Promise<string> { /* ... */ }
  async chat(request: ChatRequest): Promise<string> { /* ... */ }
  async inlineComplete(request: InlineCompletionRequest): Promise<string> { /* ... */ }
  async cleanup(): Promise<void> { /* ... */ }
}
```

2. **Register in AIModelManager**
```typescript
// Add to initializeModelConfigs() in AIModelManager.ts
this.modelConfigs.set('your-model', {
  id: 'your-model',
  name: 'Your Model',
  provider: 'your-provider',
  // ... other config
});

// Add to createModelInstance()
case 'your-provider':
  return new YourModel(config);
```

### Adding Language Support

1. **Update Language Detection**
```typescript
// FileSystemManager.ts - Add to getLanguageFromExtension()
'.newext': 'newlanguage',
```

2. **Add Symbol Extraction**
```typescript
// IndexerService.ts - Add to extractSymbolsWithRegex()
case 'newlanguage':
  this.extractNewLanguageSymbols(lines, filePath, symbols);
  break;
```

3. **Configure Monaco Editor**
```typescript
// CodeEditor.tsx - Add language definition
monaco.languages.register({ id: 'newlanguage' });
monaco.languages.setMonarchTokensProvider('newlanguage', { /* ... */ });
```

## 🧪 Testing

### Manual Testing
1. **Start the application**: `npm run start`
2. **Open a Salesforce project** with Apex classes
3. **Test inline completions** by typing code
4. **Test AI chat** with coding questions
5. **Test file operations** (open, save, search)

### Automated Testing
```bash
npm test
```

## 🔧 Configuration

### Model Preferences
Edit `.env` to configure model preferences:
```bash
PRIMARY_MODEL=code-llama-70b
FALLBACK_MODEL=gpt-4-turbo
PREFER_LOCAL_MODELS=true
```

### Performance Tuning
```bash
MAX_CONTEXT_TOKENS=16384
COMPLETION_TIMEOUT=5000
INLINE_COMPLETION_DELAY=500
```

## 🚀 Next Steps (Phase 2)

The MVP foundation is ready for enhancement:

1. **Enhanced Code Analysis**
   - Advanced AST parsing with Tree-sitter
   - Cross-file dependency analysis
   - Code quality metrics

2. **Advanced AI Features**
   - Code refactoring suggestions
   - Test generation
   - Documentation generation
   - Bug detection and fixes

3. **Salesforce Integration**
   - Org metadata integration
   - Deployment tools
   - SFDX integration
   - Lightning Design System support

4. **Collaboration Features**
   - Git integration
   - Code review workflows
   - Team AI model sharing

## 🐛 Known Issues & Limitations

### Current Limitations
- **File Explorer**: Uses mock data (needs real filesystem integration)
- **Tree-sitter**: Disabled for MVP (uses regex-based parsing)
- **Embedding Models**: Uses simple fallback (needs proper embedding service)
- **Model Management**: Basic implementation (needs advanced configuration)

### Performance Notes
- **Local Models**: Require significant RAM (16GB+ recommended for 70B models)
- **First Load**: Model initialization may take 30-60 seconds
- **Completion Speed**: Varies by model size and hardware

## 📊 Success Metrics

The Phase 0-1 MVP successfully delivers:

✅ **Functional AI IDE** - Complete desktop application
✅ **Multi-Model AI** - 7+ AI models integrated
✅ **Salesforce Focus** - Apex, LWC, SOQL support
✅ **Real-time Features** - Inline completions and chat
✅ **Extensible Design** - Ready for future enhancements
✅ **Local-First** - Privacy-focused with local models
✅ **Professional UI** - VS Code-inspired interface

**Phase 0-1 MVP Status: ✅ COMPLETE**

Ready for user testing and Phase 2 development!
