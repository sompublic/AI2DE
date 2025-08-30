export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  type: 'completion' | 'chat' | 'embedding';
  maxTokens: number;
  contextWindow: number;
  specialties: string[];
  languages: string[];
  latency: 'low' | 'medium' | 'high';
  isLocal: boolean;
  endpoint: string;
  apiKey?: string;
  modelPath?: string;
  parameters?: Record<string, any>;
}

export interface CompletionRequest {
  prompt: string;
  context: any;
  maxTokens: number;
  temperature: number;
  stopSequences?: string[];
  language?: string;
}

export interface ChatRequest {
  message: string;
  context: any;
  history: ChatMessage[];
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

export interface InlineCompletionRequest {
  code: string;
  position: {
    line: number;
    column: number;
    language: string;
  };
  language: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  latency: number;
  confidence?: number;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

export abstract class AIModel {
  protected config: ModelConfig;
  
  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract complete(request: CompletionRequest): Promise<string>;
  abstract chat(request: ChatRequest): Promise<string>;
  abstract inlineComplete(request: InlineCompletionRequest): Promise<string>;
  abstract cleanup(): Promise<void>;
  
  // Optional embedding method
  async embed?(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error('Embedding not implemented for this model');
  }

  getConfig(): ModelConfig {
    return this.config;
  }

  isAvailable(): boolean {
    return true; // Override in implementations
  }
}

export interface ModelCapabilities {
  completion: boolean;
  chat: boolean;
  inlineCompletion: boolean;
  embedding: boolean;
  codeGeneration: boolean;
  codeExplanation: boolean;
  codeReview: boolean;
  debugging: boolean;
  refactoring: boolean;
}

export interface TaskContext {
  filePath?: string;
  language?: string;
  projectType?: string;
  codebase?: string;
  dependencies?: string[];
  userIntent?: string;
  selectionRange?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface ModelPerformanceMetrics {
  modelId: string;
  taskType: string;
  avgLatency: number;
  successRate: number;
  userSatisfaction: number;
  errorRate: number;
  lastUpdated: number;
}
