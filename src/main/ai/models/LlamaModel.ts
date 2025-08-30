import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class LlamaModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.endpoint.replace('/api/generate', '/api/tags')}`);
      const availableModels = response.data.models || [];
      
      const llamaModel = availableModels.find((model: any) => 
        model.name.includes('llama3.1') || model.name.includes('llama-3.1')
      );

      if (!llamaModel) {
        console.log('Llama 3.1 not found, will be unavailable');
        return;
      }

      this.isInitialized = true;
      console.log('Llama 3.1 initialized');
    } catch (error) {
      console.warn('Llama 3.1 initialization failed:', error);
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Llama model not initialized');
    }

    try {
      const response = await axios.post(this.config.endpoint, {
        model: 'llama3.1:70b',
        prompt: request.prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      });

      return response.data.response || '';
    } catch (error) {
      console.error('Llama completion failed:', error);
      throw new Error('Failed to get completion from Llama');
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
    console.log('Llama model cleaned up');
  }
}
