import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 8px 16px;
  gap: 16px;
  height: 48px;
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

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const DebugToggle = styled.button<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#0e639c' : 'none'};
  border: 1px solid ${props => props.isActive ? '#1177bb' : '#3e3e42'};
  color: ${props => props.isActive ? '#ffffff' : '#cccccc'};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  
  &:hover {
    background-color: ${props => props.isActive ? '#1177bb' : '#3e3e42'};
  }
`;

interface MenuBarProps {
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  sidebarOpen: boolean;
  chatOpen: boolean;
  onNewFile: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
  onToggleDebug: () => void;
  debugPanelOpen: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onToggleSidebar,
  onToggleChat,
  sidebarOpen,
  chatOpen,
  onNewFile,
  onOpenFile,
  onSave,
  onOpenSettings,
  onToggleDebug,
  debugPanelOpen
}) => {
  return (
    <MenuContainer>
      <MenuButton onClick={onToggleSidebar}>
        {sidebarOpen ? '◀' : '▶'} Explorer
      </MenuButton>
      
      <MenuSeparator />
      
      <MenuButton onClick={onNewFile}>
        📄 New File
      </MenuButton>
      
      <MenuButton onClick={onOpenFile}>
        📁 Open File
      </MenuButton>
      
      <MenuButton onClick={onSave}>
        💾 Save
      </MenuButton>
      
      <MenuSeparator />
      
      <MenuButton onClick={onToggleChat}>
        💬 AI Chat
      </MenuButton>
      
      <MenuButton onClick={onOpenSettings}>
        ⚙️ AI Settings
      </MenuButton>
      
      <MenuSeparator />
      
      <DebugToggle 
        isActive={debugPanelOpen}
        onClick={onToggleDebug}
        title="AI Debug Console (Cmd+` or Cmd+Shift+D)"
      >
        🔍 DEBUG
      </DebugToggle>
      
      <QuickActions>
        <StatusIndicator isActive={true}>
          Code Llama 7B
        </StatusIndicator>
        
        <StatusIndicator isActive={true}>
          AI Ready
        </StatusIndicator>
        
        <StatusIndicator isActive={false}>
          Indexer Ready
        </StatusIndicator>
      </QuickActions>
    </MenuContainer>
  );
};