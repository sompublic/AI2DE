import React from 'react';
import styled from 'styled-components';
import { OpenFile } from '../App';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #007acc;
  color: #ffffff;
  padding: 4px 16px;
  font-size: 12px;
  height: 24px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

interface StatusBarProps {
  activeFile: OpenFile | null;
  projectPath: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  projectPath
}) => {
  const getFileInfo = () => {
    if (!activeFile) return 'No file open';
    
    const lines = activeFile.content.split('\n').length;
    const chars = activeFile.content.length;
    const position = activeFile.cursorPosition 
      ? `Ln ${activeFile.cursorPosition.line}, Col ${activeFile.cursorPosition.column}`
      : 'Ln 1, Col 1';
    
    return `${lines} lines, ${chars} chars • ${position}`;
  };

  return (
    <StatusContainer>
      <LeftSection>
        <StatusItem>
          📁 {projectPath ? projectPath.split('/').pop() || projectPath.split('\\').pop() : 'No project'}
        </StatusItem>
        
        {activeFile && (
          <>
            <StatusItem>
              📄 {activeFile.name}
            </StatusItem>
            <StatusItem>
              🔤 {activeFile.language.toUpperCase()}
            </StatusItem>
          </>
        )}
      </LeftSection>

      <RightSection>
        <StatusItem>
          {getFileInfo()}
        </StatusItem>
        
        <StatusItem>
          🤖 AI Ready
        </StatusItem>
        
        <StatusItem>
          🔍 Indexed
        </StatusItem>
      </RightSection>
    </StatusContainer>
  );
};
