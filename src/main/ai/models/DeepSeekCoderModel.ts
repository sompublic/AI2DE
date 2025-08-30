import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class DeepSeekCoderModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Check if DeepSeek Coder is available locally via Ollama
      const response = await axios.get(`${this.config.endpoint.replace('/api/generate', '/api/tags')}`);
      const availableModels = response.data.models || [];
      
      const deepseekModel = availableModels.find((model: any) => 
        model.name.includes('deepseek-coder')
      );

      if (!deepseekModel) {
        console.log('DeepSeek Coder not found, will be unavailable');
        return;
      }

      this.isInitialized = true;
      console.log('DeepSeek Coder initialized');
    } catch (error) {
      console.warn('DeepSeek Coder initialization failed:', error);
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('DeepSeek Coder model not initialized');
    }

    try {
      const response = await axios.post(this.config.endpoint, {
        model: 'deepseek-coder:latest',
        prompt: request.prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      });

      return response.data.response || '';
    } catch (error) {
      console.error('DeepSeek Coder completion failed:', error);
      throw new Error('Failed to get completion from DeepSeek Coder');
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    return await this.complete({
      prompt: request.message,
      context: request.context,
      maxTokens: request.maxTokens,
      temperature: request.temperature
    });
  }

  async inlineComplete(request: InlineCompletionRequest): Promise<string> {
    const completionRequest: CompletionRequest = {
      prompt: `Complete this ${request.language} code:\n${request.code}`,
      context: { language: request.language, position: request.position },
      maxTokens: request.maxTokens,
      temperature: request.temperature
    };

    return await this.complete(completionRequest);
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('DeepSeek Coder model cleaned up');
  }
}
