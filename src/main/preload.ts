import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('folder:open-dialog'),

  // AI operations
  getCompletion: (prompt: string, context: any) => ipcRenderer.invoke('ai:completion', prompt, context),
  chat: (message: string, context: any) => ipcRenderer.invoke('ai:chat', message, context),
  getInlineCompletion: (code: string, position: any) => ipcRenderer.invoke('ai:inline-completion', code, position),

  // Indexing operations
  indexFile: (filePath: string, content: string) => ipcRenderer.invoke('index:file', filePath, content),
  searchIndex: (query: string) => ipcRenderer.invoke('index:search', query),

  // Menu event listeners
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    ipcRenderer.on('menu:new-file', () => callback('new-file'));
    ipcRenderer.on('menu:open-file', () => callback('open-file'));
    ipcRenderer.on('menu:open-folder', () => callback('open-folder'));
    ipcRenderer.on('menu:save', () => callback('save'));
    ipcRenderer.on('ai:toggle-chat', () => callback('toggle-chat'));
    ipcRenderer.on('ai:open-settings', () => callback('open-settings'));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      openFileDialog: () => Promise<Electron.OpenDialogReturnValue>;
      openFolderDialog: () => Promise<Electron.OpenDialogReturnValue>;
      getCompletion: (prompt: string, context: any) => Promise<string>;
      chat: (message: string, context: any) => Promise<string>;
      getInlineCompletion: (code: string, position: any) => Promise<string>;
      indexFile: (filePath: string, content: string) => Promise<void>;
      searchIndex: (query: string) => Promise<any[]>;
      onMenuAction: (callback: (action: string, data?: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
