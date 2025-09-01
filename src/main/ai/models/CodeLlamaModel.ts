import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest } from '../../../shared/types/ai';
import axios from 'axios';

export class CodeLlamaModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running and Code Llama is available
      const response = await axios.get(`${this.config.endpoint.replace('/api/generate', '/api/tags')}`, {
        timeout: 5000 // 5 second timeout
      });
      const availableModels = response.data.models || [];
      
      // Look for any codellama model
      const codeLlamaModel = availableModels.find((model: any) => 
        model.name.includes('codellama')
      );

      if (!codeLlamaModel) {
        console.log('No Code Llama models found');
        throw new Error('No Code Llama models available');
      }

      this.isInitialized = true;
      console.log(`✅ Code Llama initialized: ${codeLlamaModel.name}`);
    } catch (error) {
      console.error('Failed to initialize Code Llama:', error.message);
      throw new Error('Code Llama initialization failed. Please ensure Ollama is running.');
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Code Llama model not initialized');
    }

    try {
      const prompt = this.buildCompletionPrompt(request);
      
      const response = await axios.post(this.config.endpoint, {
        model: this.getModelName('code'),
        prompt,
        options: {
          num_predict: request.maxTokens,
          temperature: request.temperature,
          stop: request.stopSequences || []
        },
        stream: false
      }, {
        timeout: 30000 // 30 second timeout
      });

      return response.data.response || '';
    } catch (error) {
      console.error('Code Llama completion failed:', error.message);
      throw new Error('Failed to get completion from Code Llama');
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Code Llama model not initialized');
    }

    try {
      const prompt = this.buildChatPrompt(request);
      
      const response = await axios.post(this.config.endpoint, {
        model: this.getModelName('instruct'),
        prompt,
        options: {
          num_predict: request.maxTokens,
          temperature: request.temperature
        },
        stream: false
      }, {
        timeout: 60000 // 60 second timeout for chat
      });

      return response.data.response || '';
    } catch (error) {
      console.error('Code Llama chat failed:', error.message);
      throw new Error('Failed to get chat response from Code Llama');
    }
  }

  async inlineComplete(request: InlineCompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Code Llama model not initialized');
    }

    try {
      const prompt = this.buildInlineCompletionPrompt(request);
      
      const response = await axios.post(this.config.endpoint, {
        model: this.getModelName('code'),
        prompt,
        options: {
          num_predict: request.maxTokens,
          temperature: request.temperature,
          stop: ['\n\n', '```', '</code>']
        },
        stream: false
      }, {
        timeout: 15000 // 15 second timeout for inline completions
      });

      return this.cleanInlineCompletion(response.data.response || '');
    } catch (error) {
      console.error('Code Llama inline completion failed:', error.message);
      return ''; // Return empty string instead of throwing for inline completions
    }
  }

  private getModelName(type: 'code' | 'instruct'): string {
    // Use 7B model for faster responses, fallback to 70B if needed
    if (this.config.id.includes('7b')) {
      return type === 'code' ? 'codellama:7b-code' : 'codellama:7b-instruct';
    } else {
      return type === 'code' ? 'codellama:70b-code' : 'codellama:70b-instruct';
    }
  }

  private buildCompletionPrompt(request: CompletionRequest): string {
    const { prompt, context } = request;
    let fullPrompt = '';

    // Add language-specific context
    if (context.language) {
      fullPrompt += `Language: ${context.language}\n`;
    }

    // Add file context if available
    if (context.filePath) {
      fullPrompt += `File: ${context.filePath}\n`;
    }

    // Add Salesforce-specific context for Apex/LWC
    if (context.language === 'apex' || context.language === 'lwc') {
      fullPrompt += `Context: Salesforce development\n`;
    }

    fullPrompt += `\nCode completion request:\n${prompt}`;
    
    return fullPrompt;
  }

  private buildChatPrompt(request: ChatRequest): string {
    let prompt = 'You are an expert software developer specializing in Salesforce development (Apex, LWC, SOQL), JavaScript, Python, and Java. Provide helpful, accurate, and concise responses.\n\n';

    // Add conversation history (limit to last 3 exchanges for performance)
    const recentHistory = request.history.slice(-6); // Last 3 exchanges (6 messages)
    for (const msg of recentHistory) {
      prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
    }

    // Add current message
    prompt += `Human: ${request.message}\nAssistant: `;

    return prompt;
  }

  private buildInlineCompletionPrompt(request: InlineCompletionRequest): string {
    const { code, position, language } = request;
    const lines = code.split('\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.column);

    // Keep context small for fast inline completions
    let prompt = `Complete the following ${language} code:\n\n`;
    
    // Add minimal context (only 3 lines before)
    const contextBefore = lines.slice(Math.max(0, position.line - 3), position.line);
    if (contextBefore.length > 0) {
      prompt += contextBefore.join('\n') + '\n';
    }

    // Add the line with cursor position
    prompt += beforeCursor + '<CURSOR>';

    prompt += '\n\nComplete the code at <CURSOR> position (one line only):';
    
    return prompt;
  }

  private cleanInlineCompletion(completion: string): string {
    // Clean and limit the completion
    let cleaned = completion.trim();
    
    // Take only the first line for inline completions
    const firstLine = cleaned.split('\n')[0];
    
    // Remove common artifacts
    cleaned = firstLine
      .replace(/```[\w]*\n?/g, '')
      .replace(/^(Here's|This is|The code).*:/i, '')
      .trim();
    
    return cleaned;
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('Code Llama model cleaned up');
  }
}