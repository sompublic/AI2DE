import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.isOpen ? '300px' : '32px'};
  background-color: #1e1e1e;
  border-top: 1px solid #3e3e42;
  transition: height 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

const DebugHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: 8px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  cursor: pointer;
  min-height: 32px;
`;

const DebugTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #cccccc;
`;

const DebugControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  
  button, select {
    background: #333;
    border: 1px solid #555;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    
    &:hover {
      background: #555;
    }
  }
  
  select {
    padding: 3px 6px;
  }
`;

const StatusIndicator = styled.div<{ status: 'idle' | 'processing' | 'error' | 'success' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'idle': return '#6f6f6f';
      case 'processing': return '#ffa500';
      case 'error': return '#f14c4c';
      case 'success': return '#4fc3f7';
      default: return '#6f6f6f';
    }
  }};
  animation: ${props => props.status === 'processing' ? 'pulse 1s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const DebugActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const DebugContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const TransactionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const TransactionItem = styled.div<{ type: 'request' | 'response' | 'error' | 'info', isSelected?: boolean }>`
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'request': return '#4fc3f7';
      case 'response': return '#90ee90';
      case 'error': return '#f14c4c';
      case 'info': return '#ffa500';
      default: return '#6f6f6f';
    }
  }};
  background-color: ${props => {
    switch (props.type) {
      case 'request': return '#1a2332';
      case 'response': return '#1a2e1a';
      case 'error': return '#2e1a1a';
      case 'info': return '#2e2a1a';
      default: return '#252526';
    }
  }};
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  border: ${props => props.isSelected ? '2px solid #007bff' : 'none'};
  
  &:hover {
    opacity: 0.8;
  }
`;

const TransactionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: 600;
`;

const TransactionMeta = styled.div`
  font-size: 11px;
  opacity: 0.7;
  display: flex;
  gap: 12px;
`;

const TransactionContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
`;

const DetailsPanel = styled.div`
  width: 300px;
  border-left: 1px solid #3e3e42;
  background-color: #252526;
  padding: 12px;
  overflow-y: auto;
`;

const DetailSection = styled.div`
  margin-bottom: 16px;
`;

const DetailTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  text-transform: uppercase;
`;

const DetailContent = styled.div`
  font-size: 11px;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
`;

const MetricItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
`;

const ModelName = styled.span`
  font-weight: 600;
  color: #4fc3f7;
`;

const TransactionType = styled.span<{ type: 'request' | 'response' | 'error' | 'info' }>`
  font-weight: 600;
  color: ${props => {
    switch (props.type) {
      case 'request': return '#4fc3f7';
      case 'response': return '#90ee90';
      case 'error': return '#f14c4c';
      case 'info': return '#ffa500';
      default: return '#6f6f6f';
    }
  }};
`;

const TransactionTimestamp = styled.div`
  font-size: 10px;
  opacity: 0.7;
  text-align: right;
  margin-top: 8px;
`;

export interface AITransaction {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error' | 'info';
  model: string;
  operation: 'chat' | 'completion' | 'inline-completion';
  prompt?: string;
  response?: string;
  error?: string;
  metadata: {
    tokens?: number;
    latency?: number;
    temperature?: number;
    maxTokens?: number;
    contextLength?: number;
    endpoint?: string;
    modelId?: string;
    provider?: string;
    isLocal?: boolean;
    errorType?: string;
    responseSize?: number;
    responseTime?: number;
    tokensPerSecond?: number;
  };
}

interface AIDebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AIDebugPanel: React.FC<AIDebugPanelProps> = ({
  isOpen,
  onToggle
}) => {
  const [transactions, setTransactions] = useState<AITransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<AITransaction | null>(null);
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'processing' | 'error' | 'success'>('idle');
  const [stats, setStats] = useState({
    totalRequests: 0,
    avgLatency: 0,
    successRate: 0,
    activeModel: 'Code Llama 7B'
  });
  const transactionListRef = useRef<HTMLDivElement>(null);

  // Format raw API call for Postman
  const formatRawAPICall = (transaction: AITransaction) => {
    if (transaction.type === 'request') {
      const endpoint = transaction.metadata?.endpoint || 'unknown';
      const modelId = transaction.metadata?.modelId || 'unknown';
      
      return {
        method: 'POST',
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          model: modelId,
          prompt: transaction.prompt,
          stream: false,
          options: {
            temperature: transaction.metadata?.temperature || 0.3,
            num_predict: transaction.metadata?.maxTokens || 1024
          }
        }
      };
    }
    return null;
  };

  // Format raw message for debugging
  const formatRawMessage = (transaction: AITransaction) => {
    return {
      id: transaction.id,
      timestamp: new Date(transaction.timestamp).toISOString(),
      type: transaction.type,
      operation: transaction.operation,
      model: transaction.model,
      ...(transaction.prompt && { prompt: transaction.prompt }),
      ...(transaction.response && { response: transaction.response }),
      metadata: transaction.metadata
    };
  };

  useEffect(() => {
    // Load transactions from backend when panel opens
    if (isOpen) {
      loadTransactions();
    }

    // Set up periodic refresh
    const interval = setInterval(() => {
      if (isOpen) {
        loadTransactions();
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadTransactions = async () => {
    try {
      console.log('🔍 Loading debug transactions...');
      console.log('🔍 electronAPI available:', !!window.electronAPI);
      console.log('🔍 getDebugTransactions available:', !!window.electronAPI?.getDebugTransactions);
      
      if (window.electronAPI?.getDebugTransactions) {
        console.log('🔍 Calling getDebugTransactions...');
        const backendTransactions = await window.electronAPI.getDebugTransactions();
        console.log('🔍 Backend transactions received:', backendTransactions);
        setTransactions(backendTransactions);
        updateStats(backendTransactions);
      } else {
        console.error('❌ getDebugTransactions not available on electronAPI');
        console.log('🔍 Available methods:', Object.keys(window.electronAPI || {}));
      }
    } catch (error) {
      console.error('❌ Failed to load debug transactions:', error);
    }
  };

  const updateStats = (allTransactions: AITransaction[]) => {
    const requests = allTransactions.filter(t => t.type === 'request' || t.type === 'response');
    const errors = allTransactions.filter(t => t.type === 'error');
    const responses = allTransactions.filter(t => t.type === 'response');
    
    const totalRequests = requests.length;
    const avgLatency = responses.reduce((sum, t) => sum + (t.metadata.latency || 0), 0) / (responses.length || 1);
    const successRate = totalRequests > 0 ? ((totalRequests - errors.length) / totalRequests) * 100 : 100;
    
    const latestTransaction = allTransactions[allTransactions.length - 1];
    const activeModel = latestTransaction?.model || 'Code Llama 7B';

    setStats({
      totalRequests,
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate),
      activeModel
    });

    // Update status based on latest transaction
    if (latestTransaction) {
      setCurrentStatus(latestTransaction.type === 'error' ? 'error' : 'success');
      setTimeout(() => setCurrentStatus('idle'), 3000);
    }
  };

  const clearTransactions = async () => {
    try {
      if (window.electronAPI?.clearDebugTransactions) {
        await window.electronAPI.clearDebugTransactions();
        setTransactions([]);
        setSelectedTransaction(null);
        setStats({
          totalRequests: 0,
          avgLatency: 0,
          successRate: 0,
          activeModel: 'Code Llama 7B'
        });
      }
    } catch (error) {
      console.error('Failed to clear transactions:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatLatency = (latency?: number) => {
    if (!latency) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'chat': return '💬';
      case 'completion': return '🔧';
      case 'inline-completion': return '⚡';
      default: return '🤖';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return '📤';
      case 'response': return '📥';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  // Auto-scroll to bottom when new transactions arrive
  useEffect(() => {
    if (transactionListRef.current) {
      transactionListRef.current.scrollTop = transactionListRef.current.scrollHeight;
    }
  }, [transactions]);

  return (
    <DebugContainer isOpen={isOpen}>
      <DebugHeader onClick={onToggle}>
        <DebugTitle>AI Debug Console ({transactions.length} transactions)</DebugTitle>
        <DebugControls>
          <button onClick={() => setShowRawDetails(!showRawDetails)}>
            {showRawDetails ? '📋 Hide Raw' : '📋 Show Raw'}
          </button>
          <button onClick={clearTransactions}>🗑️ Clear</button>
          <button onClick={loadTransactions}>🔄 Refresh</button>
          <select onChange={(e) => setCurrentStatus(e.target.value as any)} value={currentStatus}>
            <option value="idle">📊 Details</option>
            <option value="processing">⚙️ Processing</option>
            <option value="error">❌ Errors</option>
            <option value="success">✅ Success</option>
          </select>
        </DebugControls>
      </DebugHeader>

      {isOpen && (
        <DebugContent>
          <TransactionList ref={transactionListRef}>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                isSelected={selectedTransaction?.id === transaction.id}
                type={transaction.type}
              >
                <TransactionHeader>
                  <ModelName>{transaction.model}</ModelName>
                  <TransactionType type={transaction.type}>
                    {transaction.type === 'request' ? '📤 Request' : 
                     transaction.type === 'response' ? '📥 Response' : 
                     transaction.type === 'error' ? '❌ Error' : 'ℹ️ Info'}
                  </TransactionType>
                </TransactionHeader>
                
                <TransactionContent>
                  {transaction.type === 'request' && (
                    <div>
                      <strong>Prompt:</strong> {transaction.prompt}
                      <br />
                      <small>
                        🔗 {transaction.metadata?.endpoint || 'Unknown endpoint'} | 
                        🆔 {transaction.metadata?.modelId || 'Unknown model'} | 
                        🏢 {transaction.metadata?.provider || 'Unknown provider'} | 
                        📍 {transaction.metadata?.isLocal ? 'Local' : 'Cloud'}
                      </small>
                      <br />
                      <small>
                        ⚙️ Max Tokens: {transaction.metadata?.maxTokens} | 
                        🌡️ Temp: {transaction.metadata?.temperature} | 
                        📚 Context: {transaction.metadata?.contextLength} items
                      </small>
                    </div>
                  )}
                  
                  {transaction.type === 'response' && (
                    <div>
                      <strong>Response:</strong> {transaction.response?.substring(0, 100)}...
                      <br />
                      <small>
                        ⚡ Latency: {transaction.metadata?.latency}ms | 
                        🎯 Tokens: {transaction.metadata?.tokens} | 
                        🚀 Speed: {transaction.metadata?.tokensPerSecond || 'N/A'} tokens/sec
                      </small>
                      <br />
                      <small>
                        📏 Size: {transaction.metadata?.responseSize} chars | 
                        🕐 Time: {transaction.metadata?.responseTime ? new Date(transaction.metadata.responseTime).toLocaleTimeString() : 'N/A'}
                      </small>
                    </div>
                  )}
                  
                  {transaction.type === 'error' && (
                    <div>
                      <strong>Error:</strong> {transaction.response}
                      <br />
                      <small>
                        ❌ Type: {transaction.metadata?.errorType || 'Unknown'} | 
                        📍 Endpoint: {transaction.metadata?.endpoint || 'Unknown'}
                      </small>
                    </div>
                  )}
                  
                  {transaction.type === 'info' && (
                    <div>
                      <strong>Info:</strong> {transaction.response}
                      <br />
                      <small>
                        🔧 Operation: {transaction.operation} | 
                        📊 Context Length: {transaction.metadata?.contextLength || 0}
                      </small>
                    </div>
                  )}
                </TransactionContent>
                
                <TransactionTimestamp>
                  {new Date(transaction.timestamp).toLocaleTimeString()}
                </TransactionTimestamp>
              </TransactionItem>
            ))}
            
            {transactions.length === 0 && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#6f6f6f',
                fontStyle: 'italic'
              }}>
                No AI transactions yet. Start chatting or using AI features to see debug information.
                <br />
                <small style={{ opacity: 0.7 }}>
                  This panel shows all AI model interactions, latencies, errors, and internal details.
                </small>
              </div>
            )}
          </TransactionList>

          <DetailsPanel>
            <DetailSection>
              <DetailTitle>Performance Metrics</DetailTitle>
              <DetailContent>
                <MetricItem>
                  <span>Total Requests:</span>
                  <span>{stats.totalRequests}</span>
                </MetricItem>
                <MetricItem>
                  <span>Avg Latency:</span>
                  <span>{formatLatency(stats.avgLatency)}</span>
                </MetricItem>
                <MetricItem>
                  <span>Success Rate:</span>
                  <span>{stats.successRate}%</span>
                </MetricItem>
                <MetricItem>
                  <span>Active Model:</span>
                  <span>{stats.activeModel}</span>
                </MetricItem>
              </DetailContent>
            </DetailSection>

            <DetailSection>
              <DetailTitle>Debug Controls</DetailTitle>
              <DetailContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ActionButton 
                    onClick={loadTransactions}
                    style={{ 
                      backgroundColor: '#0e639c', 
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    🔄 Refresh Transactions
                  </ActionButton>
                  <ActionButton 
                    onClick={clearTransactions}
                    style={{ 
                      backgroundColor: '#f14c4c', 
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    🗑️ Clear All
                  </ActionButton>
                  <ActionButton 
                    onClick={async () => {
                      try {
                        console.log('🧪 Testing IPC connection...');
                        const result = await window.electronAPI?.getModels();
                        console.log('🧪 getModels result:', result);
                        alert(`IPC Test: getModels returned ${result?.length || 0} models`);
                      } catch (error) {
                        console.error('🧪 IPC test failed:', error);
                        alert(`IPC Test Failed: ${error.message}`);
                      }
                    }}
                    style={{ 
                      backgroundColor: '#ffa500', 
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    🧪 Test IPC
                  </ActionButton>
                  <ActionButton 
                    onClick={async () => {
                      try {
                        console.log('🔍 Testing getDebugTransactions directly...');
                        const result = await window.electronAPI?.getDebugTransactions();
                        console.log('🔍 getDebugTransactions result:', result);
                        alert(`Debug Test: getDebugTransactions returned ${result?.length || 0} transactions`);
                      } catch (error) {
                        console.error('🔍 getDebugTransactions test failed:', error);
                        alert(`Debug Test Failed: ${error.message}`);
                      }
                    }}
                    style={{ 
                      backgroundColor: '#9c27b0', 
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    🔍 Test Debug
                  </ActionButton>
                  <ActionButton 
                    onClick={async () => {
                      try {
                        console.log('🔄 Manual refresh triggered...');
                        await loadTransactions();
                        console.log('✅ Manual refresh completed');
                      } catch (error) {
                        console.error('❌ Manual refresh failed:', error);
                      }
                    }}
                    style={{ 
                      backgroundColor: '#4caf50', 
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px'
                    }}
                  >
                    🔄 Manual Refresh
                  </ActionButton>
                </div>
              </DetailContent>
            </DetailSection>

            {selectedTransaction && (
              <>
                <DetailSection>
                  <DetailTitle>Transaction Details</DetailTitle>
                  <DetailContent>
                    <MetricItem>
                      <span>ID:</span>
                      <span>{selectedTransaction.id.substring(0, 12)}...</span>
                    </MetricItem>
                    <MetricItem>
                      <span>Model:</span>
                      <span>{selectedTransaction.model}</span>
                    </MetricItem>
                    <MetricItem>
                      <span>Operation:</span>
                      <span>{selectedTransaction.operation}</span>
                    </MetricItem>
                    <MetricItem>
                      <span>Type:</span>
                      <span>{selectedTransaction.type}</span>
                    </MetricItem>
                    <MetricItem>
                      <span>Timestamp:</span>
                      <span>{new Date(selectedTransaction.timestamp).toLocaleString()}</span>
                    </MetricItem>
                  </DetailContent>
                </DetailSection>

                <DetailSection>
                  <DetailTitle>Parameters</DetailTitle>
                  <DetailContent>
                    {selectedTransaction.metadata.maxTokens && (
                      <MetricItem>
                        <span>Max Tokens:</span>
                        <span>{selectedTransaction.metadata.maxTokens}</span>
                      </MetricItem>
                    )}
                    {selectedTransaction.metadata.temperature !== undefined && (
                      <MetricItem>
                        <span>Temperature:</span>
                        <span>{selectedTransaction.metadata.temperature}</span>
                      </MetricItem>
                    )}
                    {selectedTransaction.metadata.contextLength !== undefined && (
                      <MetricItem>
                        <span>Context Length:</span>
                        <span>{selectedTransaction.metadata.contextLength} chars</span>
                      </MetricItem>
                    )}
                    {selectedTransaction.metadata.latency && (
                      <MetricItem>
                        <span>Latency:</span>
                        <span>{formatLatency(selectedTransaction.metadata.latency)}</span>
                      </MetricItem>
                    )}
                    {selectedTransaction.metadata.tokens && (
                      <MetricItem>
                        <span>Response Tokens:</span>
                        <span>{selectedTransaction.metadata.tokens}</span>
                      </MetricItem>
                    )}
                  </DetailContent>
                </DetailSection>

                {selectedTransaction.prompt && (
                  <DetailSection>
                    <DetailTitle>Full Prompt</DetailTitle>
                    <DetailContent>
                      <div style={{ 
                        background: '#1e1e1e', 
                        padding: '8px', 
                        borderRadius: '4px',
                        maxHeight: '100px',
                        overflow: 'auto',
                        fontSize: '10px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedTransaction.prompt}
                      </div>
                    </DetailContent>
                  </DetailSection>
                )}

                {selectedTransaction.response && (
                  <DetailSection>
                    <DetailTitle>Full Response</DetailTitle>
                    <DetailContent>
                      <div style={{ 
                        background: '#1e1e1e', 
                        padding: '8px', 
                        borderRadius: '4px',
                        maxHeight: '100px',
                        overflow: 'auto',
                        fontSize: '10px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedTransaction.response}
                      </div>
                    </DetailContent>
                  </DetailSection>
                )}

                {selectedTransaction.error && (
                  <DetailSection>
                    <DetailTitle>Error Details</DetailTitle>
                    <DetailContent>
                      <div style={{ 
                        background: '#2e1a1a', 
                        padding: '8px', 
                        borderRadius: '4px',
                        maxHeight: '100px',
                        overflow: 'auto',
                        fontSize: '10px',
                        color: '#ffb3b3',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedTransaction.error}
                      </div>
                    </DetailContent>
                  </DetailSection>
                )}
              </>
            )}

            {!selectedTransaction && (
              <DetailSection>
                <DetailTitle>Instructions</DetailTitle>
                <DetailContent style={{ fontSize: '11px', opacity: 0.8 }}>
                  <strong>AI Debug Console</strong>
                  <br />
                  Click on any transaction to view detailed information:
                  <br />• Full prompts and responses
                  <br />• Model parameters & settings
                  <br />• Performance metrics & latency
                  <br />• Error details & stack traces
                  <br />• Context information
                  <br />
                  <br />
                  <strong>Keyboard Shortcuts:</strong>
                  <br />• Cmd+` or Cmd+Shift+D to toggle
                  <br />• Auto-refreshes every 2 seconds
                </DetailContent>
              </DetailSection>
            )}
          </DetailsPanel>
        </DebugContent>
      )}
    </DebugContainer>
  );
};
