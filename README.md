# AI IDE - Phase 0-1 MVP

An AI-powered Integrated Development Environment focused on Salesforce development with multi-language support.

## Features (Phase 0-1)

### Core IDE Features
- ✅ Desktop application built with Electron
- ✅ Monaco Editor with syntax highlighting
- ✅ File explorer and project management
- ✅ Multi-tab editor interface
- ✅ Support for Salesforce Apex, LWC, SOQL, JavaScript, Python, Java

### AI Features
- ✅ Multi-model AI system (extensible architecture)
- ✅ Code Llama 70B integration (primary local model)
- ✅ Claude, Codestral, DeepSeek Coder, Qwen Coder, Llama 3.1 support
- ✅ Inline code completions
- ✅ AI chat interface
- ✅ Code indexing and embeddings
- ✅ Semantic code search

### Supported AI Models

#### Local Models (via Ollama)
- **Code Llama 70B** (Primary) - Code completion and generation
- **DeepSeek Coder V3** - Code optimization and debugging
- **Qwen 2.5 Coder 32B** - Multi-language support
- **Llama 3.1 70B** - General coding assistance

#### Cloud Models
- **Claude Code** (Anthropic) - Code review and architecture
- **Codestral 25.01** (Mistral) - Fast code completion
- **GPT-4 Turbo** (OpenAI) - Fallback and comparison

## Quick Start

### Prerequisites
- Node.js 18+ 
- Ollama (for local models)
- Code Llama 70B model pulled in Ollama

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd ai-ide
npm install
```

2. **Set up local AI models:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Code Llama 70B (primary model)
ollama pull codellama:70b-code
ollama pull codellama:70b-instruct

# Optional: Pull other models
ollama pull deepseek-coder:latest
ollama pull qwen2.5-coder:32b
ollama pull llama3.1:70b
```

3. **Set up environment variables (optional for cloud models):**
```bash
# Create .env file
echo "ANTHROPIC_API_KEY=your_key_here" >> .env
echo "OPENAI_API_KEY=your_key_here" >> .env
echo "MISTRAL_API_KEY=your_key_here" >> .env
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

## Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron UI   │────│  Main Process   │────│   AI Models     │
│  (React/Monaco) │    │  (Node.js/TS)   │    │ (Local/Cloud)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  File System    │    │   Indexer &     │    │   Embeddings    │
│   Manager       │    │   Symbols       │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

#### AI Model Manager
- **Multi-model support** with intelligent selection
- **Task-specific routing** (completion vs chat vs inline)
- **Latency-aware** model selection
- **Extensible** for future model additions

#### Code Indexer
- **Symbol extraction** using Tree-sitter
- **Language-specific** parsing (Apex, JS, Python, Java)
- **Fast search** with SQLite backend
- **Incremental indexing** for performance

#### Embeddings Service
- **Semantic code search** using vector embeddings
- **Similar code detection** for learning patterns
- **Local embedding models** for privacy
- **Code similarity analysis**

## Salesforce Development Support

### Apex Language Features
- Syntax highlighting for Apex classes and triggers
- Salesforce-specific keywords and types
- SObject and API recognition
- Governor limits awareness

### LWC (Lightning Web Components)
- JavaScript framework support
- HTML template recognition
- CSS styling support
- Salesforce Lightning Design System integration

### SOQL Support
- Query syntax highlighting
- SObject field completion
- Relationship traversal
- Query optimization suggestions

## Usage

### Getting AI Assistance

1. **Inline Completions**: Start typing and get AI suggestions automatically
2. **Chat Interface**: Ask questions about your code using Ctrl+Shift+C
3. **Code Analysis**: Get explanations and suggestions for selected code
4. **Smart Search**: Find similar code patterns across your project

### Keyboard Shortcuts

- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+Shift+O` - Open folder
- `Ctrl+S` - Save file
- `Ctrl+Shift+C` - Toggle AI chat
- `Tab` - Accept inline completion
- `Esc` - Dismiss inline completion

## Next Phases

### Phase 2 (Planned)
- Advanced code refactoring
- Test generation
- Documentation generation
- Code review automation

### Phase 3 (Planned)
- Multi-file context awareness
- Project-wide analysis
- Custom model fine-tuning
- Team collaboration features

## Contributing

This is the foundational MVP implementation. The architecture is designed to be extensible for future enhancements.

## License

MIT License
