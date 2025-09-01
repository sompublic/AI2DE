import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #3e3e42;
  background-color: #252526;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #cccccc;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  font-size: 16px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const DialogContent = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModelCard = styled.div<{ isActive: boolean; isAvailable: boolean }>`
  background-color: ${props => props.isActive ? '#0e639c' : '#252526'};
  border: 1px solid ${props => props.isActive ? '#1177bb' : '#3e3e42'};
  border-radius: 6px;
  padding: 12px;
  cursor: ${props => props.isAvailable ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.isAvailable ? 1 : 0.6};
  
  &:hover {
    background-color: ${props => props.isAvailable ? (props.isActive ? '#1177bb' : '#37373d') : '#252526'};
  }
`;

const ModelName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const ModelInfo = styled.div`
  font-size: 12px;
  color: #cccccc;
  opacity: 0.8;
`;

const ModelStatus = styled.div<{ isAvailable: boolean }>`
  font-size: 11px;
  color: ${props => props.isAvailable ? '#4fc3f7' : '#f14c4c'};
  margin-top: 4px;
  font-weight: 500;
`;

const ApiKeySection = styled.div`
  margin-bottom: 16px;
`;

const ApiKeyLabel = styled.label`
  display: block;
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 6px;
`;

const ApiKeyInput = styled.input`
  width: 100%;
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #d4d4d4;
  padding: 8px 12px;
  font-size: 14px;
  font-family: 'Consolas', monospace;
  
  &:focus {
    outline: none;
    border-color: #007acc;
  }
  
  &::placeholder {
    color: #6f6f6f;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${props => 
    props.variant === 'primary' ? '#0e639c' :
    props.variant === 'danger' ? '#f14c4c' : '#3e3e42'
  };
  border: none;
  border-radius: 4px;
  color: #ffffff;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => 
      props.variant === 'primary' ? '#1177bb' :
      props.variant === 'danger' ? '#ff6b6b' : '#4a4a4a'
    };
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 8px;
  background-color: ${props => 
    props.type === 'success' ? '#2d5a2d' :
    props.type === 'error' ? '#5a2d2d' : '#2d3e5a'
  };
  color: ${props => 
    props.type === 'success' ? '#90ee90' :
    props.type === 'error' ? '#ffb3b3' : '#b3d9ff'
  };
  border: 1px solid ${props => 
    props.type === 'success' ? '#4a7c4a' :
    props.type === 'error' ? '#7c4a4a' : '#4a5c7c'
  };
`;

interface Model {
  id: string;
  name: string;
  provider: string;
  isLocal: boolean;
  isAvailable: boolean;
  latency: string;
  type: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  currentModel: string;
  onModelSwitch: (modelId: string) => void;
  onApiKeyUpdate: (provider: string, apiKey: string) => void;
  onApiKeyTest: (provider: string, apiKey: string) => Promise<boolean>;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  models,
  currentModel,
  onModelSwitch,
  onApiKeyUpdate,
  onApiKeyTest
}) => {
  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    openai: '',
    mistral: ''
  });
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'testing'; message: string }>>({});

  if (!isOpen) return null;

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleApiKeyTest = async (provider: string) => {
    const apiKey = apiKeys[provider as keyof typeof apiKeys];
    if (!apiKey.trim()) {
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: { status: 'error', message: 'Please enter an API key' }
      }));
      return;
    }

    setTestResults(prev => ({ 
      ...prev, 
      [provider]: { status: 'testing', message: 'Testing API key...' }
    }));

    try {
      const isValid = await onApiKeyTest(provider, apiKey);
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: { 
          status: isValid ? 'success' : 'error', 
          message: isValid ? 'API key is valid!' : 'Invalid API key'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: { status: 'error', message: 'Test failed: ' + error.message }
      }));
    }
  };

  const handleApiKeySave = async (provider: string) => {
    const apiKey = apiKeys[provider as keyof typeof apiKeys];
    if (apiKey.trim()) {
      await onApiKeyUpdate(provider, apiKey);
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: { status: 'success', message: 'API key saved!' }
      }));
    }
  };

  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model && model.isAvailable) {
      onModelSwitch(modelId);
    }
  };

  const localModels = models.filter(m => m.isLocal);
  const cloudModels = models.filter(m => !m.isLocal);

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>AI Model Settings</DialogTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </DialogHeader>
        
        <DialogContent>
          <Section>
            <SectionTitle>Local Models (Privacy-First)</SectionTitle>
            <ModelGrid>
              {localModels.map(model => (
                <ModelCard
                  key={model.id}
                  isActive={model.id === currentModel}
                  isAvailable={model.isAvailable}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <ModelName>{model.name}</ModelName>
                  <ModelInfo>{model.type} • {model.latency} latency</ModelInfo>
                  <ModelStatus isAvailable={model.isAvailable}>
                    {model.isAvailable ? '✅ Ready' : '❌ Not Available'}
                  </ModelStatus>
                </ModelCard>
              ))}
            </ModelGrid>
          </Section>

          <Section>
            <SectionTitle>Cloud Models (Require API Keys)</SectionTitle>
            <ModelGrid>
              {cloudModels.map(model => (
                <ModelCard
                  key={model.id}
                  isActive={model.id === currentModel}
                  isAvailable={model.isAvailable}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <ModelName>{model.name}</ModelName>
                  <ModelInfo>{model.type} • {model.latency} latency</ModelInfo>
                  <ModelStatus isAvailable={model.isAvailable}>
                    {model.isAvailable ? '✅ Ready' : '🔑 API Key Required'}
                  </ModelStatus>
                </ModelCard>
              ))}
            </ModelGrid>
          </Section>

          <Section>
            <SectionTitle>API Key Configuration</SectionTitle>
            
            <ApiKeySection>
              <ApiKeyLabel>Anthropic (Claude) API Key:</ApiKeyLabel>
              <ApiKeyInput
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                placeholder="sk-ant-api03-..."
              />
              <ButtonGroup>
                <Button 
                  variant="primary" 
                  onClick={() => handleApiKeyTest('anthropic')}
                  disabled={!apiKeys.anthropic.trim()}
                >
                  Test
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleApiKeySave('anthropic')}
                  disabled={!apiKeys.anthropic.trim()}
                >
                  Save
                </Button>
              </ButtonGroup>
              {testResults.anthropic && (
                <StatusMessage type={testResults.anthropic.status}>
                  {testResults.anthropic.message}
                </StatusMessage>
              )}
            </ApiKeySection>

            <ApiKeySection>
              <ApiKeyLabel>OpenAI (GPT-4) API Key:</ApiKeyLabel>
              <ApiKeyInput
                type="password"
                value={apiKeys.openai}
                onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                placeholder="sk-..."
              />
              <ButtonGroup>
                <Button 
                  variant="primary" 
                  onClick={() => handleApiKeyTest('openai')}
                  disabled={!apiKeys.openai.trim()}
                >
                  Test
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleApiKeySave('openai')}
                  disabled={!apiKeys.openai.trim()}
                >
                  Save
                </Button>
              </ButtonGroup>
              {testResults.openai && (
                <StatusMessage type={testResults.openai.status}>
                  {testResults.openai.message}
                </StatusMessage>
              )}
            </ApiKeySection>

            <ApiKeySection>
              <ApiKeyLabel>Mistral (Codestral) API Key:</ApiKeyLabel>
              <ApiKeyInput
                type="password"
                value={apiKeys.mistral}
                onChange={(e) => handleApiKeyChange('mistral', e.target.value)}
                placeholder="..."
              />
              <ButtonGroup>
                <Button 
                  variant="primary" 
                  onClick={() => handleApiKeyTest('mistral')}
                  disabled={!apiKeys.mistral.trim()}
                >
                  Test
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleApiKeySave('mistral')}
                  disabled={!apiKeys.mistral.trim()}
                >
                  Save
                </Button>
              </ButtonGroup>
              {testResults.mistral && (
                <StatusMessage type={testResults.mistral.status}>
                  {testResults.mistral.message}
                </StatusMessage>
              )}
            </ApiKeySection>
          </Section>

          <Section>
            <ButtonGroup style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </ButtonGroup>
          </Section>
        </DialogContent>
      </Dialog>
    </Overlay>
  );
};
