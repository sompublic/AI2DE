import { AIModel, CompletionRequest, ChatRequest, InlineCompletionRequest, EmbeddingRequest, EmbeddingResponse } from '../../../shared/types/ai';
import axios from 'axios';

export class CodeLlamaModel extends AIModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running and Code Llama is available
      const response = await axios.get(`${this.config.endpoint.replace('/api/generate', '/api/tags')}`);
      const availableModels = response.data.models || [];
      
      const codeLlamaModel = availableModels.find((model: any) => 
        model.name.includes('codellama') && model.name.includes('70b')
      );

      if (!codeLlamaModel) {
        console.log('Code Llama 70B not found, attempting to pull...');
        await this.pullModel();
      }

      this.isInitialized = true;
      console.log('Code Llama 70B initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Code Llama 70B:', error);
      throw new Error('Code Llama 70B initialization failed. Please ensure Ollama is running.');
    }
  }

  private async pullModel(): Promise<void> {
    try {
      const pullResponse = await axios.post(`${this.config.endpoint.replace('/api/generate', '/api/pull')}`, {
        name: 'codellama:70b-code'
      });
      
      if (pullResponse.status === 200) {
        console.log('Code Llama 70B model pulled successfully');
      }
    } catch (error) {
      console.error('Failed to pull Code Llama 70B:', error);
      throw error;
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Code Llama model not initialized');
    }

    try {
      const prompt = this.buildCompletionPrompt(request);
      
      const response = await axios.post(this.config.endpoint, {
        model: 'codellama:70b-code',
        prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stop: request.stopSequences || [],
        stream: false
      });

      return response.data.response || '';
    } catch (error) {
      console.error('Code Llama completion failed:', error);
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
        model: 'codellama:70b-instruct',
        prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      });

      return response.data.response || '';
    } catch (error) {
      console.error('Code Llama chat failed:', error);
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
        model: 'codellama:70b-code',
        prompt,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stop: ['\n\n', '```', '</code>'],
        stream: false
      });

      return this.cleanInlineCompletion(response.data.response || '');
    } catch (error) {
      console.error('Code Llama inline completion failed:', error);
      throw new Error('Failed to get inline completion from Code Llama');
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
      if (context.sobjects) {
        fullPrompt += `Available SObjects: ${context.sobjects.join(', ')}\n`;
      }
    }

    fullPrompt += `\nCode completion request:\n${prompt}`;
    
    return fullPrompt;
  }

  private buildChatPrompt(request: ChatRequest): string {
    let prompt = 'You are an expert software developer specializing in Salesforce development (Apex, LWC, SOQL), JavaScript, Python, and Java. Provide helpful, accurate, and concise responses.\n\n';

    // Add conversation history
    for (const msg of request.history) {
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
    const afterCursor = currentLine.substring(position.column);

    let prompt = `Complete the following ${language} code:\n\n`;
    
    // Add context lines before
    const contextBefore = lines.slice(Math.max(0, position.line - 10), position.line);
    if (contextBefore.length > 0) {
      prompt += contextBefore.join('\n') + '\n';
    }

    // Add the line with cursor position
    prompt += beforeCursor + '<CURSOR>';
    
    if (afterCursor.trim()) {
      prompt += afterCursor;
    }

    // Add context lines after
    const contextAfter = lines.slice(position.line + 1, Math.min(lines.length, position.line + 6));
    if (contextAfter.length > 0) {
      prompt += '\n' + contextAfter.join('\n');
    }

    prompt += '\n\nComplete the code at <CURSOR> position:';
    
    return prompt;
  }

  private cleanInlineCompletion(completion: string): string {
    // Remove common artifacts from the completion
    let cleaned = completion.trim();
    
    // Remove explanation text that might come after the code
    const codeEndMarkers = ['\n\n', 'Explanation:', 'This code', 'The above'];
    for (const marker of codeEndMarkers) {
      const index = cleaned.indexOf(marker);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index);
      }
    }

    // Remove any markdown formatting
    cleaned = cleaned.replace(/```[\w]*\n?/g, '');
    
    return cleaned.trim();
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('Code Llama model cleaned up');
  }
}
