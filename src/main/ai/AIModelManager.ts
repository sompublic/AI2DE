import { AIModel, ModelConfig, CompletionRequest, ChatRequest, InlineCompletionRequest, AITransaction } from '../../shared/types/ai';
import { CodeLlamaModel } from './models/CodeLlamaModel';
import { ClaudeModel } from './models/ClaudeModel';
import { CodestralModel } from './models/CodestralModel';
import { DeepSeekCoderModel } from './models/DeepSeekCoderModel';
import { QwenCoderModel } from './models/QwenCoderModel';
import { LlamaModel } from './models/LlamaModel';
import { OpenAIModel } from './models/OpenAIModel';

export class AIModelManager {
  private models: Map<string, AIModel> = new Map();
  private currentModel: string = 'codellama-7b-instruct';
  private modelConfigs: Map<string, ModelConfig> = new Map();
  private transactions: AITransaction[] = [];

  constructor() {
    this.initializeModelConfigs();
  }

  private initializeModelConfigs(): void {
    // Primary fast model for testing and development
    this.modelConfigs.set('codellama-7b-instruct', {
      id: 'codellama-7b-instruct',
      name: 'Code Llama 7B Instruct (Fast)',
      provider: 'local',
      type: 'chat',
      maxTokens: 2048,
      contextWindow: 4096,
      specialties: ['code-completion', 'code-generation', 'debugging', 'chat', 'general-coding'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'low',
      isLocal: true,
      endpoint: 'http://127.0.0.1:11434/api/generate'
    });

    // Larger model for complex tasks (optional)
    this.modelConfigs.set('codellama-70b-instruct', {
      id: 'codellama-70b-instruct',
      name: 'Code Llama 70B Instruct (Powerful)',
      provider: 'local',
      type: 'chat',
      maxTokens: 4096,
      contextWindow: 16384,
      specialties: ['complex-reasoning', 'architecture', 'code-review'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'high',
      isLocal: true,
      endpoint: 'http://127.0.0.1:11434/api/generate'
    });

    // Cloud models (optional, require API keys)
    this.modelConfigs.set('claude-code', {
      id: 'claude-code',
      name: 'Claude Code',
      provider: 'anthropic',
      type: 'chat',
      maxTokens: 4096,
      contextWindow: 200000,
      specialties: ['code-review', 'architecture', 'complex-reasoning'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'low',
      isLocal: false,
      endpoint: 'https://api.anthropic.com/v1/messages'
    });

    this.modelConfigs.set('gpt-4-turbo', {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      type: 'chat',
      maxTokens: 4096,
      contextWindow: 128000,
      specialties: ['general-coding', 'reasoning', 'complex-tasks'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'low',
      isLocal: false,
      endpoint: 'https://api.openai.com/v1/chat/completions'
    });
  }

  private logTransaction(transaction: Omit<AITransaction, 'id' | 'timestamp'>): void {
    const fullTransaction: AITransaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    this.transactions.push(fullTransaction);
    
    // Keep only last 100 transactions
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(-100);
    }
    
    console.log('AI Transaction:', fullTransaction);
  }

  async initialize(): Promise<void> {
    try {
      this.logTransaction({
        type: 'info',
        model: 'System',
        operation: 'initialization',
        response: 'Initializing AI Model Manager...',
        metadata: { contextLength: 0 }
      });

      // Initialize only available models gracefully
      for (const [id, config] of this.modelConfigs) {
        try {
          const model = this.createModelInstance(config);
          if (model) {
            await model.initialize();
            this.models.set(id, model);
            console.log(`✅ Initialized model: ${config.name}`);
            
            // Log successful model initialization
            this.logTransaction({
              type: 'info',
              model: config.name,
              operation: 'initialization',
              response: 'Model initialized successfully',
              metadata: { contextLength: 0 }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to initialize ${config.name}:`, error.message);
          // Continue with other models instead of failing completely
        }
      }

      // Set the fastest available model as primary
      if (this.models.has('codellama-7b-instruct')) {
        this.currentModel = 'codellama-7b-instruct';
      } else if (this.models.has('codellama-70b-instruct')) {
        this.currentModel = 'codellama-70b-instruct';
      } else if (this.models.size > 0) {
        this.currentModel = Array.from(this.models.keys())[0];
      }

      console.log(`✅ AI Model Manager initialized with ${this.models.size} models`);
      console.log(`✅ Primary model: ${this.modelConfigs.get(this.currentModel)?.name || 'None'}`);
    } catch (error) {
      console.error('❌ Failed to initialize AI Model Manager:', error);
      // Don't throw error - allow IDE to work without AI features
      console.log('⚠️ AI IDE will run without AI features');
    }
  }

  private createModelInstance(config: ModelConfig): AIModel | null {
    switch (config.provider) {
      case 'local':
        if (config.id.includes('codellama')) {
          return new CodeLlamaModel(config);
        } else if (config.id.includes('deepseek')) {
          return new DeepSeekCoderModel(config);
        } else if (config.id.includes('qwen')) {
          return new QwenCoderModel(config);
        } else if (config.id.includes('llama')) {
          return new LlamaModel(config);
        }
        break;
      case 'anthropic':
        return new ClaudeModel(config);
      case 'mistral':
        return new CodestralModel(config);
      case 'openai':
        return new OpenAIModel(config);
      default:
        console.warn(`Unknown model provider: ${config.provider}`);
        return null;
    }
    return null;
  }

  async setCurrentModel(modelId: string): Promise<void> {
    if (!this.models.has(modelId)) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    const previousModel = this.currentModel;
    this.currentModel = modelId;
    const newModelName = this.modelConfigs.get(modelId)?.name || modelId;
    
    console.log(`Switched to model: ${newModelName}`);
    
    // Log model switching
    this.logTransaction({
      type: 'info',
      model: newModelName,
      operation: 'initialization',
      response: `Model switched from ${this.modelConfigs.get(previousModel)?.name || previousModel} to ${newModelName}`,
      metadata: { contextLength: 0 }
    });
  }

  getCurrentModel(): AIModel | null {
    return this.models.get(this.currentModel) || null;
  }

  getAvailableModels(): ModelConfig[] {
    return Array.from(this.modelConfigs.values()).filter(config => 
      this.models.has(config.id)
    );
  }

  // Smart model selection with performance optimization
  selectOptimalModel(taskType: string, context: any, userPreferences?: any): string {
    const availableModels = this.getAvailableModels();
    
    if (availableModels.length === 0) {
      throw new Error('No AI models available');
    }

    // Filter models by task specialty
    let suitableModels = availableModels.filter(model => 
      model.specialties.includes(taskType) || 
      model.specialties.includes('general-coding') ||
      model.specialties.includes('chat')
    );

    // For real-time features, prefer fast models
    if (taskType === 'inline-completion' || taskType === 'chat') {
      const fastModels = suitableModels.filter(model => 
        model.latency === 'low' || model.id.includes('7b')
      );
      if (fastModels.length > 0) {
        suitableModels = fastModels;
      }
    }

    // Prefer local models for privacy
    if (userPreferences?.preferLocal !== false) {
      const localModels = suitableModels.filter(model => model.isLocal);
      if (localModels.length > 0) {
        suitableModels = localModels;
      }
    }

    // Return the best available model
    return this.models.has("codellama-7b-instruct") ? "codellama-7b-instruct" : (suitableModels.length > 0 ? suitableModels[0].id : this.currentModel);
  }

  async getCompletion(prompt: string, context: any): Promise<string> {
    if (this.models.size === 0) {
      return 'AI models not available. Please check Ollama connection.';
    }

    try {
      const optimalModel = this.selectOptimalModel('code-completion', context);
      const model = this.models.get(optimalModel);
      
      if (!model) {
        return 'Selected AI model not available.';
      }

      const request: CompletionRequest = {
        prompt,
        context,
        maxTokens: 512, // Reduced for faster response
        temperature: 0.2,
        stopSequences: ['\n\n', '```']
      };

      return await model.complete(request);
    } catch (error) {
      console.error('AI completion failed:', error);
      return 'Sorry, I encountered an error generating the completion.';
    }
  }

  async chat(message: string, context: any): Promise<string> {
    if (this.models.size === 0) {
      return 'AI chat not available. Please check Ollama connection and ensure models are installed.';
    }

    try {
      const optimalModel = this.selectOptimalModel('chat', context);
      const model = this.models.get(optimalModel);
      
      if (!model) {
        return 'Selected AI model not available for chat.';
      }

      const request: ChatRequest = {
        message,
        context,
        history: context.history || [],
        maxTokens: 1024, // Reduced for faster response
        temperature: 0.3
      };

      // Log the chat request with enhanced API call details
      this.logTransaction({
        type: 'request',
        model: this.modelConfigs.get(optimalModel)?.name || optimalModel,
        operation: 'chat',
        prompt: message,
        metadata: { 
          maxTokens: request.maxTokens, 
          temperature: request.temperature, 
          contextLength: context.history?.length || 0,
          // Enhanced API call details
          endpoint: this.modelConfigs.get(optimalModel)?.endpoint || 'unknown',
          modelId: optimalModel,
          provider: this.modelConfigs.get(optimalModel)?.provider || 'unknown',
          isLocal: this.modelConfigs.get(optimalModel)?.isLocal || false,
          requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          timestamp: Date.now(),
          // Request structure details
          requestStructure: {
            message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            historyLength: request.history.length,
            maxTokens: request.maxTokens,
            temperature: request.temperature
          }
        }
      });

      // Get the response from the model
      const startTime = Date.now();
      const response = await model.chat(request);
      const latency = Date.now() - startTime;

      // Log the chat response with enhanced details
      this.logTransaction({
        type: 'response',
        model: this.modelConfigs.get(optimalModel)?.name || optimalModel,
        operation: 'chat',
        response: response,
        metadata: { 
          latency: latency,
          contextLength: context.history?.length || 0,
          // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
          tokens: Math.ceil(response.length / 4),
          // Enhanced response details
          responseTime: new Date().toISOString(),
          responseSize: response.length,
          // Performance metrics
          tokensPerSecond: Math.round((Math.ceil(response.length / 4) / (latency / 1000)) * 100) / 100,
          // API call completion details
          endpoint: this.modelConfigs.get(optimalModel)?.endpoint || 'unknown',
          modelId: optimalModel,
          provider: this.modelConfigs.get(optimalModel)?.provider || 'unknown',
          isLocal: this.modelConfigs.get(optimalModel)?.isLocal || false
        }
      });

      return response;
    } catch (error) {
      console.error('AI chat failed:', error);
      
      // Log the chat error
      this.logTransaction({
        type: 'error',
        model: this.modelConfigs.get(this.currentModel)?.name || this.currentModel,
        operation: 'chat',
        response: `Chat failed: ${error.message}`,
        metadata: { 
          contextLength: context.history?.length || 0,
          error: error.message
        }
      });
      
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  async getInlineCompletion(code: string, position: any): Promise<string> {
    if (this.models.size === 0) {
      return '';
    }

    try {
      const optimalModel = this.selectOptimalModel('inline-completion', { code, position });
      const model = this.models.get(optimalModel);
      
      if (!model) {
        return '';
      }

      const request: InlineCompletionRequest = {
        code,
        position,
        language: position.language || 'javascript',
        maxTokens: 128, // Very small for fast inline completions
        temperature: 0.1
      };

      return await model.inlineComplete(request);
    } catch (error) {
      console.error('Inline completion failed:', error);
      return '';
    }
  }

  async addModel(config: ModelConfig): Promise<void> {
    this.modelConfigs.set(config.id, config);
    const model = this.createModelInstance(config);
    if (model) {
      try {
        await model.initialize();
        this.models.set(config.id, model);
        console.log(`Added new model: ${config.name}`);
      } catch (error) {
        console.warn(`Failed to add model ${config.name}:`, error.message);
      }
    }
  }

  async removeModel(modelId: string): Promise<void> {
    if (this.models.has(modelId)) {
      const model = this.models.get(modelId);
      await model?.cleanup();
      this.models.delete(modelId);
      this.modelConfigs.delete(modelId);
      console.log(`Removed model: ${modelId}`);
    }
  }

  async cleanup(): Promise<void> {
    for (const model of this.models.values()) {
      await model.cleanup();
    }
    this.models.clear();
  }

  // Get status for UI display
  getStatus(): { available: number; current: string; ready: boolean } {
    return {
      available: this.models.size,
      current: this.modelConfigs.get(this.currentModel)?.name || 'None',
      ready: this.models.size > 0
    };
  }

  // Get models for availability checking
  getModelsMap(): Map<string, AIModel> {
    return this.models;
  }

  // Transaction management
  getTransactions(): AITransaction[] {
    return [...this.transactions];
  }

  clearTransactions(): void {
    this.transactions = [];
  }
}