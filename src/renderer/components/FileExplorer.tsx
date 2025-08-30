import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ExplorerContainer = styled.div`
  height: 100%;
  background-color: #252526;
`;

const ExplorerHeader = styled.div`
  padding: 12px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
`;

const FileTree = styled.div`
  padding: 8px;
`;

const FileItem = styled.div<{ level: number; isDirectory: boolean }>`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-left: ${props => props.level * 16}px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: ${props => props.isDirectory ? '#cccccc' : '#d4d4d4'};
  
  &:hover {
    background-color: #2a2d2e;
  }
  
  &::before {
    content: '${props => props.isDirectory ? '📁' : '📄'}';
    margin-right: 8px;
    font-size: 12px;
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #6f6f6f;
  font-size: 14px;
`;

interface FileExplorerProps {
  projectPath: string | null;
  onFileSelect: (filePath: string) => void;
  onFolderSelect: (folderPath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectPath,
  onFileSelect,
  onFolderSelect
}) => {
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectPath) {
      loadFileTree(projectPath);
    }
  }, [projectPath]);

  const loadFileTree = async (path: string) => {
    try {
      // For now, we'll implement a simple file tree
      // In a full implementation, this would use the file system API
      console.log('Loading file tree for:', path);
      
      // Placeholder file tree structure
      const mockFileTree = [
        { name: 'src', type: 'directory', path: `${path}/src`, children: [
          { name: 'classes', type: 'directory', path: `${path}/src/classes`, children: [
            { name: 'AccountController.cls', type: 'file', path: `${path}/src/classes/AccountController.cls` },
            { name: 'ContactService.cls', type: 'file', path: `${path}/src/classes/ContactService.cls` }
          ]},
          { name: 'lwc', type: 'directory', path: `${path}/src/lwc`, children: [
            { name: 'accountList', type: 'directory', path: `${path}/src/lwc/accountList`, children: [
              { name: 'accountList.js', type: 'file', path: `${path}/src/lwc/accountList/accountList.js` },
              { name: 'accountList.html', type: 'file', path: `${path}/src/lwc/accountList/accountList.html` }
            ]}
          ]}
        ]},
        { name: 'package.json', type: 'file', path: `${path}/package.json` },
        { name: 'README.md', type: 'file', path: `${path}/README.md` }
      ];

      setFileTree(mockFileTree);
      setExpandedFolders(new Set([path, `${path}/src`]));
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const renderFileTree = (items: any[], level: number = 0): React.ReactNode => {
    return items.map(item => (
      <div key={item.path}>
        <FileItem
          level={level}
          isDirectory={item.type === 'directory'}
          onClick={() => {
            if (item.type === 'directory') {
              toggleFolder(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          {item.name}
        </FileItem>
        
        {item.type === 'directory' && 
         expandedFolders.has(item.path) && 
         item.children &&
         renderFileTree(item.children, level + 1)}
      </div>
    ));
  };

  return (
    <ExplorerContainer>
      <ExplorerHeader>
        {projectPath ? 'Explorer' : 'No Folder Open'}
      </ExplorerHeader>
      
      <FileTree>
        {projectPath ? (
          renderFileTree(fileTree)
        ) : (
          <EmptyState>
            Open a folder to explore files
          </EmptyState>
        )}
      </FileTree>
    </ExplorerContainer>
  );
};
