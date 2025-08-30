import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const CompletionOverlay = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-width: 400px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
`;

const CompletionText = styled.div`
  color: #d4d4d4;
  white-space: pre;
  margin-bottom: 8px;
`;

const CompletionActions = styled.div`
  display: flex;
  gap: 8px;
  font-size: 11px;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #3e3e42;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const KeyHint = styled.span`
  color: #6f6f6f;
  font-size: 10px;
  margin-left: auto;
`;

interface AIInlineCompletionProps {
  suggestion: string;
  position: { line: number; column: number };
  onAccept: () => void;
  onReject: () => void;
}

export const AIInlineCompletion: React.FC<AIInlineCompletionProps> = ({
  suggestion,
  position,
  onAccept,
  onReject
}) => {
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Calculate overlay position based on cursor position
    // This is a simplified calculation - in a real implementation,
    // you'd need to get the actual pixel position from the Monaco editor
    const top = position.line * 19; // Approximate line height
    const left = position.column * 7; // Approximate character width
    
    setOverlayPosition({ top, left });

    // Set up keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onAccept, onReject]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onReject();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onReject]);

  if (!suggestion) return null;

  return (
    <CompletionOverlay top={overlayPosition.top} left={overlayPosition.left}>
      <CompletionText>{suggestion}</CompletionText>
      <CompletionActions>
        <ActionButton onClick={onAccept}>Accept</ActionButton>
        <ActionButton onClick={onReject}>Reject</ActionButton>
        <KeyHint>Tab to accept • Esc to dismiss</KeyHint>
      </CompletionActions>
    </CompletionOverlay>
  );
};
