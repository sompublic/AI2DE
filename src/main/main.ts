import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import * as path from 'path';
import { AIModelManager } from './ai/AIModelManager';
import { FileSystemManager } from './filesystem/FileSystemManager';
import { IndexerService } from './services/IndexerService';
import { EmbeddingsService } from './services/EmbeddingsService';

class AIIDEApp {
  private mainWindow: BrowserWindow | null = null;
  private aiModelManager: AIModelManager;
  private fileSystemManager: FileSystemManager;
  private indexerService: IndexerService;
  private embeddingsService: EmbeddingsService;

  constructor() {
    this.aiModelManager = new AIModelManager();
    this.fileSystemManager = new FileSystemManager();
    this.indexerService = new IndexerService();
    this.embeddingsService = new EmbeddingsService();
    
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupIpcHandlers();
      this.initializeServices();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false // For local model access
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.setupMenu();
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewFile()
          },
          {
            label: 'Open File',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenFile()
          },
          {
            label: 'Open Folder',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: () => this.handleOpenFolder()
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSave()
          }
        ]
      },
      {
        label: 'AI',
        submenu: [
          {
            label: 'Toggle Chat',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: () => this.toggleAIChat()
          },
          {
            label: 'AI Model Settings',
            click: () => this.openAISettings()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private async initializeServices(): Promise<void> {
    try {
      await this.aiModelManager.initialize();
      await this.embeddingsService.initialize();
      console.log('AI IDE services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }

  private setupIpcHandlers(): void {
    // File operations
    ipcMain.handle('file:read', async (_, filePath: string) => {
      return await this.fileSystemManager.readFile(filePath);
    });

    ipcMain.handle('file:write', async (_, filePath: string, content: string) => {
      return await this.fileSystemManager.writeFile(filePath, content);
    });

    ipcMain.handle('file:open-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          { name: 'All Supported', extensions: ['apex', 'cls', 'trigger', 'js', 'ts', 'py', 'java', 'soql'] },
          { name: 'Apex', extensions: ['apex', 'cls', 'trigger'] },
          { name: 'JavaScript', extensions: ['js', 'ts'] },
          { name: 'Python', extensions: ['py'] },
          { name: 'Java', extensions: ['java'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    });

    ipcMain.handle('folder:open-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      });
      return result;
    });

    // AI operations
    ipcMain.handle('ai:completion', async (_, prompt: string, context: any) => {
      return await this.aiModelManager.getCompletion(prompt, context);
    });

    ipcMain.handle('ai:chat', async (_, message: string, context: any) => {
      return await this.aiModelManager.chat(message, context);
    });

    ipcMain.handle('ai:inline-completion', async (_, code: string, position: any) => {
      return await this.aiModelManager.getInlineCompletion(code, position);
    });

    // Indexing operations
    ipcMain.handle('index:file', async (_, filePath: string, content: string) => {
      return await this.indexerService.indexFile(filePath, content);
    });

    ipcMain.handle('index:search', async (_, query: string) => {
      return await this.indexerService.search(query);
    });
  }

  private async handleNewFile(): Promise<void> {
    this.mainWindow?.webContents.send('menu:new-file');
  }

  private async handleOpenFile(): Promise<void> {
    this.mainWindow?.webContents.send('menu:open-file');
  }

  private async handleOpenFolder(): Promise<void> {
    this.mainWindow?.webContents.send('menu:open-folder');
  }

  private async handleSave(): Promise<void> {
    this.mainWindow?.webContents.send('menu:save');
  }

  private toggleAIChat(): void {
    this.mainWindow?.webContents.send('ai:toggle-chat');
  }

  private openAISettings(): void {
    this.mainWindow?.webContents.send('ai:open-settings');
  }
}

// Start the application
new AIIDEApp();
