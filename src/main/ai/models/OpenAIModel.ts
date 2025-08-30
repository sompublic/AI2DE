import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class OpenAIModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!process.env.OPENAI_API_KEY && !this.config.apiKey) {
      console.warn('OpenAI API key not found. OpenAI models will be unavailable.');
      return;
    }

    this.isInitialized = true;
    console.log('OpenAI model initialized');
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('OpenAI model not initialized');
    }

    try {
      const response = await axios.post(
        this.config.endpoint,
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software developer. Complete the following code accurately and concisely.'
            },
            {
              role: 'user',
              content: `Complete this code:\n${request.prompt}`
            }
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          stop: request.stopSequences
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI completion failed:', error);
      throw new Error('Failed to get completion from OpenAI');
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('OpenAI model not initialized');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: request.systemPrompt || 'You are an expert software developer specializing in Salesforce development, JavaScript, Python, and Java. Provide helpful and accurate responses.'
        },
        ...request.history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: request.message }
      ];

      const response = await axios.post(
        this.config.endpoint,
        {
          model: 'gpt-4-turbo-preview',
          messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI chat failed:', error);
      throw new Error('Failed to get chat response from OpenAI');
    }
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
    console.log('OpenAI model cleaned up');
  }
}
