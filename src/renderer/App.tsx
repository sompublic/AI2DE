import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AIChat } from './components/AIChat';
import { StatusBar } from './components/StatusBar';
import { MenuBar } from './components/MenuBar';
import { AIInlineCompletion } from './components/AIInlineCompletion';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const SidePanel = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '300px' : '0px'};
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  transition: width 0.3s ease;
  overflow: hidden;
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ChatPanel = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '400px' : '0px'};
  background-color: #252526;
  border-left: 1px solid #3e3e42;
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorPosition?: { line: number; column: number };
}

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [inlineCompletion, setInlineCompletion] = useState<{
    suggestion: string;
    position: { line: number; column: number };
  } | null>(null);

  useEffect(() => {
    // Set up menu action listeners
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action: string, data?: any) => {
        handleMenuAction(action, data);
      });
    }

    return () => {
      // Cleanup listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu:new-file');
        window.electronAPI.removeAllListeners('menu:open-file');
        window.electronAPI.removeAllListeners('menu:open-folder');
        window.electronAPI.removeAllListeners('menu:save');
        window.electronAPI.removeAllListeners('ai:toggle-chat');
        window.electronAPI.removeAllListeners('ai:open-settings');
      }
    };
  }, []);

  const handleMenuAction = async (action: string, data?: any) => {
    switch (action) {
      case 'new-file':
        await createNewFile();
        break;
      case 'open-file':
        await openFile();
        break;
      case 'open-folder':
        await openFolder();
        break;
      case 'save':
        await saveActiveFile();
        break;
      case 'toggle-chat':
        setChatOpen(!chatOpen);
        break;
      case 'open-settings':
        // TODO: Implement settings dialog
        break;
    }
  };

  const createNewFile = async () => {
    const newFile: OpenFile = {
      path: 'untitled-1',
      name: 'Untitled-1',
      content: '',
      language: 'javascript',
      isDirty: false
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(newFile.path);
  };

  const openFile = async () => {
    try {
      const result = await window.electronAPI.openFileDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        await loadFile(filePath);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const openFolder = async () => {
    try {
      const result = await window.electronAPI.openFolderDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        setProjectPath(folderPath);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const loadFile = async (filePath: string) => {
    try {
      // Check if file is already open
      const existingFile = openFiles.find(f => f.path === filePath);
      if (existingFile) {
        setActiveFile(filePath);
        return;
      }

      const content = await window.electronAPI.readFile(filePath);
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
      const language = getLanguageFromFileName(fileName);

      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content,
        language,
        isDirty: false
      };

      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(filePath);

      // Index the file for AI features
      await window.electronAPI.indexFile(filePath, content);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const saveActiveFile = async () => {
    if (!activeFile) return;

    const file = openFiles.find(f => f.path === activeFile);
    if (!file || !file.isDirty) return;

    try {
      await window.electronAPI.writeFile(file.path, file.content);
      
      // Update file state
      setOpenFiles(prev =>
        prev.map(f =>
          f.path === activeFile ? { ...f, isDirty: false } : f
        )
      );

      // Re-index the file
      await window.electronAPI.indexFile(file.path, file.content);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleFileContentChange = (filePath: string, newContent: string) => {
    setOpenFiles(prev =>
      prev.map(f =>
        f.path === filePath
          ? { ...f, content: newContent, isDirty: true }
          : f
      )
    );
  };

  const handleCloseFile = (filePath: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    if (activeFile === filePath) {
      const remainingFiles = openFiles.filter(f => f.path !== filePath);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0].path : null);
    }
  };

  const handleCursorPositionChange = (
    filePath: string,
    position: { line: number; column: number }
  ) => {
    setOpenFiles(prev =>
      prev.map(f =>
        f.path === filePath ? { ...f, cursorPosition: position } : f
      )
    );
  };

  const handleInlineCompletionRequest = async (
    code: string,
    position: { line: number; column: number },
    language: string
  ) => {
    try {
      const suggestion = await window.electronAPI.getInlineCompletion(code, {
        ...position,
        language
      });

      if (suggestion && suggestion.trim()) {
        setInlineCompletion({
          suggestion: suggestion.trim(),
          position
        });
      }
    } catch (error) {
      console.error('Failed to get inline completion:', error);
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'apex': 'apex',
      'cls': 'apex',
      'trigger': 'apex',
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'soql': 'soql',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };

    return languageMap[ext || ''] || 'text';
  };

  const activeFileData = activeFile ? openFiles.find(f => f.path === activeFile) || null : null;

  return (
    <AppContainer>
      <MenuBar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        sidebarOpen={sidebarOpen}
        chatOpen={chatOpen}
      />
      
      <MainContent>
        <SidePanel isOpen={sidebarOpen}>
          <FileExplorer
            projectPath={projectPath}
            onFileSelect={loadFile}
            onFolderSelect={setProjectPath}
          />
        </SidePanel>

        <EditorArea>
          <CodeEditor
            files={openFiles}
            activeFile={activeFile}
            onFileSelect={setActiveFile}
            onFileClose={handleCloseFile}
            onContentChange={handleFileContentChange}
            onCursorPositionChange={handleCursorPositionChange}
            onInlineCompletionRequest={handleInlineCompletionRequest}
          />
          
          {inlineCompletion && (
            <AIInlineCompletion
              suggestion={inlineCompletion.suggestion}
              position={inlineCompletion.position}
              onAccept={() => {
                // Handle accepting the completion
                setInlineCompletion(null);
              }}
              onReject={() => {
                setInlineCompletion(null);
              }}
            />
          )}
        </EditorArea>

        <ChatPanel isOpen={chatOpen}>
          <AIChat
            activeFile={activeFileData}
            onClose={() => setChatOpen(false)}
          />
        </ChatPanel>
      </MainContent>

      <StatusBar
        activeFile={activeFileData}
        projectPath={projectPath}
      />
    </AppContainer>
  );
};

export default App;
