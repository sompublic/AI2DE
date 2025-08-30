import { AIModel, ModelConfig, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../shared/types/ai';
import { CodeLlamaModel } from './models/CodeLlamaModel';
import { ClaudeModel } from './models/ClaudeModel';
import { CodestralModel } from './models/CodestralModel';
import { DeepSeekCoderModel } from './models/DeepSeekCoderModel';
import { QwenCoderModel } from './models/QwenCoderModel';
import { LlamaModel } from './models/LlamaModel';
import { OpenAIModel } from './models/OpenAIModel';

export class AIModelManager {
  private models: Map<string, AIModel> = new Map();
  private currentModel: string = 'code-llama-70b';
  private modelConfigs: Map<string, ModelConfig> = new Map();

  constructor() {
    this.initializeModelConfigs();
  }

  private initializeModelConfigs(): void {
    // Primary models as specified
    this.modelConfigs.set('code-llama-70b', {
      id: 'code-llama-70b',
      name: 'Code Llama 70B',
      provider: 'local',
      type: 'completion',
      maxTokens: 4096,
      contextWindow: 16384,
      specialties: ['code-completion', 'code-generation', 'debugging'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'medium',
      isLocal: true,
      endpoint: 'http://localhost:11434/api/generate'
    });

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

    this.modelConfigs.set('codestral-25.01', {
      id: 'codestral-25.01',
      name: 'Codestral 25.01',
      provider: 'mistral',
      type: 'completion',
      maxTokens: 4096,
      contextWindow: 32768,
      specialties: ['code-completion', 'multi-language'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'low',
      isLocal: false,
      endpoint: 'https://api.mistral.ai/v1/chat/completions'
    });

    this.modelConfigs.set('deepseek-coder-v3', {
      id: 'deepseek-coder-v3',
      name: 'DeepSeek Coder V3',
      provider: 'deepseek',
      type: 'completion',
      maxTokens: 4096,
      contextWindow: 16384,
      specialties: ['code-completion', 'debugging', 'optimization'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'medium',
      isLocal: true,
      endpoint: 'http://localhost:11434/api/generate'
    });

    this.modelConfigs.set('qwen-coder-32b', {
      id: 'qwen-coder-32b',
      name: 'Qwen 2.5 Coder 32B',
      provider: 'qwen',
      type: 'completion',
      maxTokens: 4096,
      contextWindow: 32768,
      specialties: ['code-completion', 'multi-language', 'documentation'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'medium',
      isLocal: true,
      endpoint: 'http://localhost:11434/api/generate'
    });

    this.modelConfigs.set('llama-3.1-70b', {
      id: 'llama-3.1-70b',
      name: 'Llama 3.1 70B',
      provider: 'meta',
      type: 'chat',
      maxTokens: 4096,
      contextWindow: 131072,
      specialties: ['general-coding', 'reasoning', 'explanation'],
      languages: ['apex', 'javascript', 'python', 'java', 'soql'],
      latency: 'medium',
      isLocal: true,
      endpoint: 'http://localhost:11434/api/generate'
    });

    // OpenAI models for comparison/fallback
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

  async initialize(): Promise<void> {
    try {
      // Initialize all models
      for (const [id, config] of this.modelConfigs) {
        const model = this.createModelInstance(config);
        if (model) {
          await model.initialize();
          this.models.set(id, model);
          console.log(`Initialized model: ${config.name}`);
        }
      }

      // Set Code Llama 70B as the primary model
      await this.setCurrentModel('code-llama-70b');
      console.log('AI Model Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Model Manager:', error);
      throw error;
    }
  }

  private createModelInstance(config: ModelConfig): AIModel | null {
    switch (config.provider) {
      case 'local':
        if (config.id.includes('code-llama')) {
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
    this.currentModel = modelId;
    console.log(`Switched to model: ${this.modelConfigs.get(modelId)?.name}`);
  }

  getCurrentModel(): AIModel | null {
    return this.models.get(this.currentModel) || null;
  }

  getAvailableModels(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  // Smart model selection based on task type, context, and preferences
  selectOptimalModel(taskType: string, context: any, userPreferences?: any): string {
    const availableModels = Array.from(this.modelConfigs.values());
    
    // Filter models by task specialty
    let suitableModels = availableModels.filter(model => 
      model.specialties.includes(taskType) || model.specialties.includes('general-coding')
    );

    // Consider latency requirements
    if (taskType === 'inline-completion') {
      suitableModels = suitableModels.filter(model => 
        model.latency === 'low' || (model.isLocal && model.latency === 'medium')
      );
    }

    // Consider context size
    if (context?.length > 50000) {
      suitableModels = suitableModels.filter(model => model.contextWindow >= 100000);
    }

    // Prefer local models for privacy/speed
    if (userPreferences?.preferLocal !== false) {
      const localModels = suitableModels.filter(model => model.isLocal);
      if (localModels.length > 0) {
        suitableModels = localModels;
      }
    }

    // Return the best match or fallback to current model
    return suitableModels.length > 0 ? suitableModels[0].id : this.currentModel;
  }

  async getCompletion(prompt: string, context: any): Promise<string> {
    const optimalModel = this.selectOptimalModel('code-completion', context);
    const model = this.models.get(optimalModel);
    
    if (!model) {
      throw new Error(`Model ${optimalModel} not available`);
    }

    const request: CompletionRequest = {
      prompt,
      context,
      maxTokens: 1024,
      temperature: 0.2,
      stopSequences: ['\n\n', '```']
    };

    return await model.complete(request);
  }

  async chat(message: string, context: any): Promise<string> {
    const optimalModel = this.selectOptimalModel('chat', context);
    const model = this.models.get(optimalModel);
    
    if (!model) {
      throw new Error(`Model ${optimalModel} not available`);
    }

    const request: ChatRequest = {
      message,
      context,
      history: context.history || [],
      maxTokens: 2048,
      temperature: 0.3
    };

    return await model.chat(request);
  }

  async getInlineCompletion(code: string, position: any): Promise<string> {
    const optimalModel = this.selectOptimalModel('inline-completion', { code, position });
    const model = this.models.get(optimalModel);
    
    if (!model) {
      throw new Error(`Model ${optimalModel} not available`);
    }

    const request: InlineCompletionRequest = {
      code,
      position,
      language: position.language || 'javascript',
      maxTokens: 256,
      temperature: 0.1
    };

    return await model.inlineComplete(request);
  }

  async addModel(config: ModelConfig): Promise<void> {
    this.modelConfigs.set(config.id, config);
    const model = this.createModelInstance(config);
    if (model) {
      await model.initialize();
      this.models.set(config.id, model);
      console.log(`Added new model: ${config.name}`);
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
}
