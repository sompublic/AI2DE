import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { OpenFile } from '../App';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TabBar = styled.div`
  display: flex;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  overflow-x: auto;
`;

const Tab = styled.div<{ isActive: boolean; isDirty: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: ${props => props.isActive ? '#1e1e1e' : '#2d2d30'};
  border-right: 1px solid #3e3e42;
  cursor: pointer;
  min-width: 120px;
  position: relative;

  &:hover {
    background-color: ${props => props.isActive ? '#1e1e1e' : '#37373d'};
  }

  ${props => props.isDirty && `
    &::after {
      content: '●';
      color: #ffffff;
      margin-left: 4px;
    }
  `}
`;

const TabName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 2px 4px;
  margin-left: 4px;
  border-radius: 2px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const EditorWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextEditor = styled.textarea`
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  resize: none;
  tab-size: 2;
  
  &::selection {
    background-color: #264f78;
  }
  
  &:focus {
    background-color: #1e1e1e;
  }
`;

const LineNumbers = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 50px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  padding: 16px 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #858585;
  user-select: none;
  overflow: hidden;
  pointer-events: none;
`;

const EditorWithLineNumbers = styled.div`
  position: relative;
  height: 100%;
  
  ${TextEditor} {
    padding-left: 66px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #6f6f6f;
  font-size: 16px;
  text-align: center;
  gap: 16px;
`;

const LanguageIndicator = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: #2d2d30;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #3e3e42;
`;

interface CodeEditorProps {
  files: OpenFile[];
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  onFileClose: (filePath: string) => void;
  onContentChange: (filePath: string, content: string) => void;
  onCursorPositionChange: (filePath: string, position: { line: number; column: number }) => void;
  onInlineCompletionRequest: (
    code: string,
    position: { line: number; column: number },
    language: string
  ) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileClose,
  onContentChange,
  onCursorPositionChange,
  onInlineCompletionRequest
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const activeFileData = activeFile ? files.find(f => f.path === activeFile) : null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      onContentChange(activeFile, e.target.value);
      updateCursorPosition();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      if (activeFile) {
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onContentChange(activeFile, newValue);
        
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      }
    }
    
    // Handle Cmd+S for save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      // Save will be handled by the menu
    }
  };

  const updateCursorPosition = () => {
    if (textareaRef.current && activeFile) {
      const textarea = textareaRef.current;
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      
      const lines = text.substring(0, cursorPos).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      setCursorPosition({ line, column });
      onCursorPositionChange(activeFile, { line, column });
    }
  };

  const generateLineNumbers = (content: string) => {
    const lines = content.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  useEffect(() => {
    updateCursorPosition();
  }, [activeFile, activeFileData?.content]);

  useEffect(() => {
    // Focus the editor when a file is opened
    if (activeFileData && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeFileData]);

  return (
    <EditorContainer>
      <TabBar>
        {files.map(file => (
          <Tab
            key={file.path}
            isActive={file.path === activeFile}
            isDirty={file.isDirty}
            onClick={() => onFileSelect(file.path)}
          >
            <TabName title={file.path}>{file.name}</TabName>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(file.path);
              }}
            >
              ×
            </CloseButton>
          </Tab>
        ))}
      </TabBar>

      <EditorWrapper>
        {activeFileData ? (
          <EditorWithLineNumbers>
            <LineNumbers>
              {generateLineNumbers(activeFileData.content)}
            </LineNumbers>
            <TextEditor
              ref={textareaRef}
              value={activeFileData.content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onSelect={updateCursorPosition}
              onKeyUp={updateCursorPosition}
              onMouseUp={updateCursorPosition}
              placeholder="Start typing your code here..."
              spellCheck={false}
            />
            <LanguageIndicator>
              {activeFileData.language.toUpperCase()} • Ln {cursorPosition.line}, Col {cursorPosition.column}
            </LanguageIndicator>
          </EditorWithLineNumbers>
        ) : (
          <EmptyState>
            <div>📝 Welcome to AI IDE!</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Click "📄 New File" or "📁 Open File" to get started
            </div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>
              Use the toolbar buttons above for file operations
            </div>
          </EmptyState>
        )}
      </EditorWrapper>
    </EditorContainer>
  );
};