import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

export class FileSystemManager {
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Failed to write file ${filePath}:`, error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => entry.name);
    } catch (error) {
      console.error(`Failed to read directory ${dirPath}:`, error);
      throw new Error(`Failed to read directory: ${dirPath}`);
    }
  }

  async getFileStats(filePath: string): Promise<fsSync.Stats> {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      console.error(`Failed to get stats for ${filePath}:`, error);
      throw new Error(`Failed to get file stats: ${filePath}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      throw new Error(`Failed to delete file: ${filePath}`);
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rmdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to delete directory ${dirPath}:`, error);
      throw new Error(`Failed to delete directory: ${dirPath}`);
    }
  }

  getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  getLanguageFromExtension(filePath: string): string {
    const ext = this.getFileExtension(filePath);
    const languageMap: Record<string, string> = {
      '.apex': 'apex',
      '.cls': 'apex',
      '.trigger': 'apex',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.soql': 'soql',
      '.html': 'html',
      '.css': 'css',
      '.xml': 'xml',
      '.json': 'json'
    };

    return languageMap[ext] || 'text';
  }

  isSalesforceFile(filePath: string): boolean {
    const ext = this.getFileExtension(filePath);
    const salesforceExtensions = ['.apex', '.cls', '.trigger', '.soql'];
    return salesforceExtensions.includes(ext) || 
           filePath.includes('lwc/') ||
           filePath.includes('aura/');
  }

  async walkDirectory(dirPath: string, callback: (filePath: string) => Promise<void>): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories that shouldn't be indexed
          if (!['node_modules', '.git', 'dist', 'build', '.vscode'].includes(entry.name)) {
            await this.walkDirectory(fullPath, callback);
          }
        } else if (entry.isFile()) {
          await callback(fullPath);
        }
      }
    } catch (error) {
      console.error(`Failed to walk directory ${dirPath}:`, error);
    }
  }
}
