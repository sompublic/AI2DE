import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AISettings {
  apiKeys: {
    anthropic?: string;
    openai?: string;
    mistral?: string;
  };
  preferences: {
    primaryModel: string;
    preferLocal: boolean;
    maxTokens: number;
    temperature: number;
  };
  modelConfigs: Record<string, any>;
}

export class SettingsService {
  private settingsPath: string;
  private settings: AISettings;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'ai-ide-settings.json');
    this.settings = this.getDefaultSettings();
  }

  private getDefaultSettings(): AISettings {
    return {
      apiKeys: {},
      preferences: {
        primaryModel: 'codellama-7b-instruct',
        preferLocal: true,
        maxTokens: 1024,
        temperature: 0.3
      },
      modelConfigs: {}
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      console.log('✅ Settings service initialized');
    } catch (error) {
      console.warn('⚠️ Failed to load settings, using defaults:', error);
      await this.saveSettings();
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = { ...this.getDefaultSettings(), ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or is corrupted, use defaults
      this.settings = this.getDefaultSettings();
    }
  }

  async saveSettings(): Promise<void> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(this.settingsPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  async updateApiKey(provider: 'anthropic' | 'openai' | 'mistral', apiKey: string): Promise<void> {
    this.settings.apiKeys[provider] = apiKey;
    await this.saveSettings();
  }

  async removeApiKey(provider: 'anthropic' | 'openai' | 'mistral'): Promise<void> {
    delete this.settings.apiKeys[provider];
    await this.saveSettings();
  }

  getApiKey(provider: 'anthropic' | 'openai' | 'mistral'): string | undefined {
    return this.settings.apiKeys[provider] || process.env[`${provider.toUpperCase()}_API_KEY`];
  }

  async updatePreferences(preferences: Partial<AISettings['preferences']>): Promise<void> {
    this.settings.preferences = { ...this.settings.preferences, ...preferences };
    await this.saveSettings();
  }

  async setPrimaryModel(modelId: string): Promise<void> {
    this.settings.preferences.primaryModel = modelId;
    await this.saveSettings();
  }

  getPrimaryModel(): string {
    return this.settings.preferences.primaryModel;
  }

  async testApiKey(provider: 'anthropic' | 'openai' | 'mistral', apiKey: string): Promise<boolean> {
    try {
      const axios = require('axios');
      
      switch (provider) {
        case 'anthropic':
          const anthropicResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
              },
              timeout: 10000
            }
          );
          return anthropicResponse.status === 200;
          
        case 'openai':
          const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          return openaiResponse.status === 200;
          
        case 'mistral':
          const mistralResponse = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
              model: 'mistral-tiny',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          return mistralResponse.status === 200;
          
        default:
          return false;
      }
    } catch (error) {
      console.warn(`API key test failed for ${provider}:`, error.message);
      return false;
    }
  }

  async exportSettings(): Promise<string> {
    return JSON.stringify(this.settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.settings = { ...this.getDefaultSettings(), ...importedSettings };
      await this.saveSettings();
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }
}
