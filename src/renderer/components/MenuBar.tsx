import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 8px 16px;
  gap: 16px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const MenuSeparator = styled.div`
  width: 1px;
  height: 20px;
  background-color: #3e3e42;
`;

const StatusIndicator = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.isActive ? '#4fc3f7' : '#6f6f6f'};
  
  &::before {
    content: '●';
    font-size: 8px;
  }
`;

interface MenuBarProps {
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  sidebarOpen: boolean;
  chatOpen: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onToggleSidebar,
  onToggleChat,
  sidebarOpen,
  chatOpen
}) => {
  return (
    <MenuContainer>
      <MenuButton onClick={onToggleSidebar}>
        {sidebarOpen ? '◀' : '▶'} Explorer
      </MenuButton>
      
      <MenuSeparator />
      
      <MenuButton onClick={onToggleChat}>
        💬 AI Chat
      </MenuButton>
      
      <MenuSeparator />
      
      <StatusIndicator isActive={true}>
        Code Llama 70B
      </StatusIndicator>
      
      <StatusIndicator isActive={false}>
        Indexer Ready
      </StatusIndicator>
    </MenuContainer>
  );
};
