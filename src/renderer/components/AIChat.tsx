import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { OpenFile } from '../App';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #252526;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
`;

const ChatTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const Message = styled.div<{ isUser: boolean }>`
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => props.isUser ? '#0e639c' : '#2d2d30'};
  color: #ffffff;
  
  ${props => props.isUser && `
    margin-left: 20%;
  `}
  
  ${props => !props.isUser && `
    margin-right: 20%;
    border: 1px solid #3e3e42;
  `}
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.8;
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  
  code {
    background-color: #1e1e1e;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }

  pre {
    background-color: #1e1e1e;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
    
    code {
      background: none;
      padding: 0;
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 16px;
  background-color: #2d2d30;
  border-top: 1px solid #3e3e42;
`;

const MessageInput = styled.textarea`
  flex: 1;
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  color: #d4d4d4;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  
  &:focus {
    outline: none;
    border-color: #007acc;
  }
  
  &::placeholder {
    color: #6f6f6f;
  }
`;

const SendButton = styled.button`
  background-color: #0e639c;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 12px 20px;
  margin-left: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  
  &:hover {
    background-color: #1177bb;
  }
  
  &:disabled {
    background-color: #3e3e42;
    cursor: not-allowed;
  }
`;

const ContextInfo = styled.div`
  padding: 8px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  color: #cccccc;
`;

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface AIChatProps {
  activeFile: OpenFile | null;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ activeFile, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message when chat opens
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: `Hello! I'm your AI coding assistant. I can help you with:

• Code completion and generation
• Debugging and error analysis  
• Code review and optimization
• Salesforce development (Apex, LWC, SOQL)
• JavaScript, Python, and Java development

${activeFile ? `Currently viewing: ${activeFile.name} (${activeFile.language})` : 'Open a file to get started!'}

What can I help you with today?`,
        isUser: false,
        timestamp: Date.now()
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare context for AI
      const context = {
        activeFile: activeFile ? {
          path: activeFile.path,
          name: activeFile.name,
          language: activeFile.language,
          content: activeFile.content
        } : null,
        history: messages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };

      const response = await window.electronAPI.chat(inputValue.trim(), context);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: response,
        isUser: false,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>AI Assistant</ChatTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </ChatHeader>

      {activeFile && (
        <ContextInfo>
          Context: {activeFile.name} ({activeFile.language})
        </ContextInfo>
      )}

      <MessagesContainer>
        {messages.map(message => (
          <Message key={message.id} isUser={message.isUser}>
            <MessageHeader>
              {message.isUser ? 'You' : 'AI Assistant'} • {new Date(message.timestamp).toLocaleTimeString()}
            </MessageHeader>
            <MessageContent 
              dangerouslySetInnerHTML={{ 
                __html: formatMessage(message.content) 
              }}
            />
          </Message>
        ))}
        
        {isLoading && (
          <Message isUser={false}>
            <MessageHeader>AI Assistant • Thinking...</MessageHeader>
            <MessageContent>...</MessageContent>
          </Message>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <MessageInput
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your code..."
          disabled={isLoading}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};
