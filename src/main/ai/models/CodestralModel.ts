import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class CodestralModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!process.env.MISTRAL_API_KEY && !this.config.apiKey) {
      console.warn('Mistral API key not found. Codestral model will be unavailable.');
      return;
    }

    this.isInitialized = true;
    console.log('Codestral model initialized');
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Codestral model not initialized');
    }

    try {
      const response = await axios.post(
        this.config.endpoint,
        {
          model: 'codestral-latest',
          messages: [
            {
              role: 'user',
              content: `Complete this code:\n${request.prompt}`
            }
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content || '';
    } catch (error) {
      console.error('Codestral completion failed:', error);
      throw new Error('Failed to get completion from Codestral');
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
    console.log('Codestral model cleaned up');
  }
}
