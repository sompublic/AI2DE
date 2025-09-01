import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AIChat } from './components/AIChat';
import { StatusBar } from './components/StatusBar';
import { MenuBar } from './components/MenuBar';
import { AIInlineCompletion } from './components/AIInlineCompletion';
import { SettingsDialog } from './components/SettingsDialog';
import { AIDebugPanel } from './components/AIDebugPanel';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
`;

const MainContent = styled.div<{ debugPanelOpen: boolean }>`
  display: flex;
  flex: 1;
  overflow: hidden;
  height: ${props => props.debugPanelOpen ? 'calc(100vh - 100px - 300px)' : 'calc(100vh - 100px)'};
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [inlineCompletion, setInlineCompletion] = useState<{
    suggestion: string;
    position: { line: number; column: number };
  } | null>(null);

  useEffect(() => {
    // Load initial data
    loadModels();
    loadCurrentModel();

    // Set up menu action listeners
    if (window.electronAPI) {
      console.log('Setting up menu action listeners...');
      window.electronAPI.onMenuAction((action: string, data?: any) => {
        console.log('Menu action received:', action);
        handleMenuAction(action, data);
      });
    } else {
      console.error('electronAPI not available');
    }

    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ` to toggle debug panel
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setDebugPanelOpen(!debugPanelOpen);
      }
      
      // Cmd/Ctrl + Shift + D to toggle debug panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugPanelOpen(!debugPanelOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
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
  }, [debugPanelOpen]);

  const loadModels = async () => {
    try {
      const models = await window.electronAPI.getModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadCurrentModel = async () => {
    try {
      const model = await window.electronAPI.getCurrentModel();
      setCurrentModel(model || '');
    } catch (error) {
      console.error('Failed to get current model:', error);
    }
  };

  const handleMenuAction = async (action: string, data?: any) => {
    console.log('Handling menu action:', action);
    try {
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
          setSettingsOpen(true);
          break;
        default:
          console.log('Unknown menu action:', action);
      }
    } catch (error) {
      console.error('Error handling menu action:', error);
    }
  };

  const createNewFile = async () => {
    console.log('Creating new file...');
    const timestamp = Date.now();
    const newFile: OpenFile = {
      path: `untitled-${timestamp}`,
      name: `Untitled-${openFiles.length + 1}`,
      content: '// Welcome to AI IDE!\n// Start typing to get AI-powered code suggestions\n\nfunction hello() {\n  console.log("Hello from AI IDE!");\n}\n',
      language: 'javascript',
      isDirty: false
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(newFile.path);
    console.log('New file created:', newFile.name);
  };

  const openFile = async () => {
    console.log('Opening file dialog...');
    try {
      const result = await window.electronAPI.openFileDialog();
      console.log('File dialog result:', result);
      
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        console.log('Loading file:', filePath);
        await loadFile(filePath);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      alert('Failed to open file: ' + error.message);
    }
  };

  const openFolder = async () => {
    console.log('Opening folder dialog...');
    try {
      const result = await window.electronAPI.openFolderDialog();
      console.log('Folder dialog result:', result);
      
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        console.log('Setting project path:', folderPath);
        setProjectPath(folderPath);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Failed to open folder: ' + error.message);
    }
  };

  const loadFile = async (filePath: string) => {
    console.log('Loading file:', filePath);
    try {
      // Check if file is already open
      const existingFile = openFiles.find(f => f.path === filePath);
      if (existingFile) {
        console.log('File already open, switching to it');
        setActiveFile(filePath);
        return;
      }

      console.log('Reading file content...');
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

      console.log('File loaded successfully:', fileName, `(${content.length} characters)`);
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(filePath);

      // Index the file for AI features (don't await to avoid blocking)
      window.electronAPI.indexFile(filePath, content).catch(error => {
        console.warn('Failed to index file:', error);
      });
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Failed to load file: ' + error.message);
    }
  };

  const saveActiveFile = async () => {
    console.log('Saving active file...');
    if (!activeFile) {
      console.log('No active file to save');
      return;
    }

    const file = openFiles.find(f => f.path === activeFile);
    if (!file) {
      console.log('Active file not found in open files');
      return;
    }

    if (!file.isDirty) {
      console.log('File is not dirty, no need to save');
      return;
    }

    try {
      await window.electronAPI.writeFile(file.path, file.content);
      console.log('File saved successfully');
      
      // Update file state
      setOpenFiles(prev =>
        prev.map(f =>
          f.path === activeFile ? { ...f, isDirty: false } : f
        )
      );

      // Re-index the file (don't await to avoid blocking)
      window.electronAPI.indexFile(file.path, file.content).catch(error => {
        console.warn('Failed to re-index file:', error);
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file: ' + error.message);
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
    // Disabled for now to prevent UI hanging
    return;
  };

  const handleModelSwitch = async (modelId: string) => {
    try {
      const success = await window.electronAPI.switchModel(modelId);
      if (success) {
        setCurrentModel(modelId);
        console.log('Switched to model:', modelId);
        
        // Add debug transaction
        if ((window as any).addAITransaction) {
          (window as any).addAITransaction({
            type: 'info',
            model: modelId,
            operation: 'chat',
            response: `Switched to model: ${modelId}`,
            metadata: { contextLength: 0 }
          });
        }
      } else {
        alert('Failed to switch to model: ' + modelId);
      }
    } catch (error) {
      console.error('Failed to switch model:', error);
      alert('Failed to switch model: ' + error.message);
    }
  };

  const handleApiKeyUpdate = async (provider: string, apiKey: string) => {
    try {
      await window.electronAPI.updateApiKey(provider, apiKey);
      // Reload models to see if new ones are available
      await loadModels();
      console.log('API key updated for:', provider);
      
      // Add debug transaction
      if ((window as any).addAITransaction) {
        (window as any).addAITransaction({
          type: 'info',
          model: provider,
          operation: 'chat',
          response: `API key updated for ${provider}`,
          metadata: { contextLength: apiKey.length }
        });
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      throw error;
    }
  };

  const handleApiKeyTest = async (provider: string, apiKey: string): Promise<boolean> => {
    try {
      // Add debug transaction for test start
      if ((window as any).addAITransaction) {
        (window as any).addAITransaction({
          type: 'request',
          model: provider,
          operation: 'chat',
          prompt: 'Testing API key...',
          metadata: { maxTokens: 10, temperature: 0.1, contextLength: 4 }
        });
      }

      const startTime = Date.now();
      const result = await window.electronAPI.testApiKey(provider, apiKey);
      const latency = Date.now() - startTime;
      
      // Add debug transaction for test result
      if ((window as any).addAITransaction) {
        (window as any).addAITransaction({
          type: result ? 'response' : 'error',
          model: provider,
          operation: 'chat',
          response: result ? 'API key test successful' : undefined,
          error: result ? undefined : 'API key test failed',
          metadata: { latency, tokens: result ? 5 : 0 }
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to test API key:', error);
      
      // Add debug transaction for error
      if ((window as any).addAITransaction) {
        (window as any).addAITransaction({
          type: 'error',
          model: provider,
          operation: 'chat',
          error: `API key test error: ${error.message}`,
          metadata: { contextLength: 0 }
        });
      }
      
      return false;
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
        onNewFile={createNewFile}
        onOpenFile={openFile}
        onSave={saveActiveFile}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleDebug={() => setDebugPanelOpen(!debugPanelOpen)}
        debugPanelOpen={debugPanelOpen}
      />
      
      <MainContent debugPanelOpen={debugPanelOpen}>
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

      <AIDebugPanel
        isOpen={debugPanelOpen}
        onToggle={() => setDebugPanelOpen(!debugPanelOpen)}
      />

      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        models={availableModels}
        currentModel={currentModel}
        onModelSwitch={handleModelSwitch}
        onApiKeyUpdate={handleApiKeyUpdate}
        onApiKeyTest={handleApiKeyTest}
      />
    </AppContainer>
  );
};

export default App;