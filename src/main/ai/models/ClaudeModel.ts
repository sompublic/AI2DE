import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class ClaudeModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY && !this.config.apiKey) {
      console.warn('Claude API key not found. Claude model will be unavailable.');
      return;
    }

    this.isInitialized = true;
    console.log('Claude model initialized');
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Claude model not initialized');
    }

    try {
      const response = await axios.post(
        this.config.endpoint,
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          messages: [
            {
              role: 'user',
              content: `Complete this code:\n${request.prompt}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.ANTHROPIC_API_KEY}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text || '';
    } catch (error) {
      console.error('Claude completion failed:', error);
      throw new Error('Failed to get completion from Claude');
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Claude model not initialized');
    }

    try {
      const messages = [
        ...request.history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: request.message }
      ];

      const response = await axios.post(
        this.config.endpoint,
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          messages
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.ANTHROPIC_API_KEY}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text || '';
    } catch (error) {
      console.error('Claude chat failed:', error);
      throw new Error('Failed to get chat response from Claude');
    }
  }

  async inlineComplete(request: InlineCompletionRequest): Promise<string> {
    // Use completion method for inline completions
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
    console.log('Claude model cleaned up');
  }
}
