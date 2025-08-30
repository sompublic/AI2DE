import * as path from 'path';
import { Database } from 'sqlite3';

export interface CodeSymbol {
  id: string;
  name: string;
  type: 'class' | 'method' | 'function' | 'variable' | 'interface' | 'enum';
  filePath: string;
  startLine: number;
  endLine: number;
  signature?: string;
  documentation?: string;
  language: string;
}

export interface FileIndex {
  filePath: string;
  content: string;
  symbols: CodeSymbol[];
  lastModified: number;
  language: string;
  hash: string;
}

export class IndexerService {
  private db!: Database;
  private isInitialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db = new Database(':memory:'); // Use in-memory for now, can switch to file later
    
    // Create tables
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS file_index (
          file_path TEXT PRIMARY KEY,
          content TEXT,
          language TEXT,
          hash TEXT,
          last_modified INTEGER,
          created_at INTEGER
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS code_symbols (
          id TEXT PRIMARY KEY,
          name TEXT,
          type TEXT,
          file_path TEXT,
          start_line INTEGER,
          end_line INTEGER,
          signature TEXT,
          documentation TEXT,
          language TEXT,
          created_at INTEGER,
          FOREIGN KEY (file_path) REFERENCES file_index (file_path)
        )
      `);

      // Create indexes for faster searching
      this.db.run('CREATE INDEX IF NOT EXISTS idx_symbols_name ON code_symbols(name)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_symbols_type ON code_symbols(type)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_symbols_file ON code_symbols(file_path)');
    });

    this.isInitialized = true;
  }

  async indexFile(filePath: string, content: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('IndexerService not initialized');
    }

    try {
      const language = this.getLanguageFromPath(filePath);
      const hash = this.generateHash(content);
      const lastModified = Date.now();

      // Check if file has changed
      const existingIndex = await this.getFileIndex(filePath);
      if (existingIndex && existingIndex.hash === hash) {
        return; // File hasn't changed, skip indexing
      }

      // Parse the file and extract symbols
      const symbols = await this.extractSymbols(filePath, content, language);

      // Store in database
      await this.storeFileIndex({
        filePath,
        content,
        symbols,
        lastModified,
        language,
        hash
      });

      console.log(`Indexed file: ${filePath} (${symbols.length} symbols)`);
    } catch (error) {
      console.error(`Failed to index file ${filePath}:`, error);
    }
  }

  private async extractSymbols(filePath: string, content: string, language: string): Promise<CodeSymbol[]> {
    // For MVP, use regex-based extraction for all languages
    // Tree-sitter integration can be added in later phases
    return this.extractSymbolsWithRegex(filePath, content, language);
  }



  private extractSymbolsWithRegex(filePath: string, content: string, language: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    switch (language) {
      case 'apex':
        this.extractApexSymbols(lines, filePath, symbols);
        break;
      case 'javascript':
      case 'typescript':
        this.extractJavaScriptSymbols(lines, filePath, symbols);
        break;
      case 'python':
        this.extractPythonSymbols(lines, filePath, symbols);
        break;
      case 'java':
        this.extractJavaSymbols(lines, filePath, symbols);
        break;
      case 'soql':
        // SOQL doesn't have traditional symbols, but we can index queries
        break;
    }

    return symbols;
  }

  private extractApexSymbols(lines: string[], filePath: string, symbols: CodeSymbol[]): void {
    const classPattern = /^\s*(?:public|private|global)?\s*(?:abstract|virtual)?\s*class\s+(\w+)/i;
    const methodPattern = /^\s*(?:public|private|protected|global)?\s*(?:static)?\s*(?:\w+\s+)?(\w+)\s*\(/i;
    const propertyPattern = /^\s*(?:public|private|protected|global)?\s*(?:static)?\s*(\w+)\s+(\w+)\s*[{;]/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for class declaration
      const classMatch = line.match(classPattern);
      if (classMatch) {
        symbols.push({
          id: `${filePath}:${classMatch[1]}:${lineNumber}`,
          name: classMatch[1],
          type: 'class',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber, // We'd need to find the closing brace for accurate end line
          signature: line.trim(),
          language: 'apex'
        });
      }

      // Check for method declaration
      const methodMatch = line.match(methodPattern);
      if (methodMatch && !classMatch) { // Don't match class constructors
        symbols.push({
          id: `${filePath}:${methodMatch[1]}:${lineNumber}`,
          name: methodMatch[1],
          type: 'method',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'apex'
        });
      }
    }
  }

  private extractJavaScriptSymbols(lines: string[], filePath: string, symbols: CodeSymbol[]): void {
    const classPattern = /^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)/;
    const functionPattern = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
    const arrowFunctionPattern = /^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/;
    const methodPattern = /^\s*(?:async\s+)?(\w+)\s*\(/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const classMatch = line.match(classPattern);
      if (classMatch) {
        symbols.push({
          id: `${filePath}:${classMatch[1]}:${lineNumber}`,
          name: classMatch[1],
          type: 'class',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'javascript'
        });
      }

      const functionMatch = line.match(functionPattern);
      if (functionMatch) {
        symbols.push({
          id: `${filePath}:${functionMatch[1]}:${lineNumber}`,
          name: functionMatch[1],
          type: 'function',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'javascript'
        });
      }
    }
  }

  private extractPythonSymbols(lines: string[], filePath: string, symbols: CodeSymbol[]): void {
    const classPattern = /^\s*class\s+(\w+)/;
    const functionPattern = /^\s*(?:async\s+)?def\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const classMatch = line.match(classPattern);
      if (classMatch) {
        symbols.push({
          id: `${filePath}:${classMatch[1]}:${lineNumber}`,
          name: classMatch[1],
          type: 'class',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'python'
        });
      }

      const functionMatch = line.match(functionPattern);
      if (functionMatch) {
        symbols.push({
          id: `${filePath}:${functionMatch[1]}:${lineNumber}`,
          name: functionMatch[1],
          type: 'function',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'python'
        });
      }
    }
  }

  private extractJavaSymbols(lines: string[], filePath: string, symbols: CodeSymbol[]): void {
    const classPattern = /^\s*(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)/;
    const methodPattern = /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)?(\w+)\s*\(/;
    const interfacePattern = /^\s*(?:public)?\s*interface\s+(\w+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const classMatch = line.match(classPattern);
      if (classMatch) {
        symbols.push({
          id: `${filePath}:${classMatch[1]}:${lineNumber}`,
          name: classMatch[1],
          type: 'class',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'java'
        });
      }

      const interfaceMatch = line.match(interfacePattern);
      if (interfaceMatch) {
        symbols.push({
          id: `${filePath}:${interfaceMatch[1]}:${lineNumber}`,
          name: interfaceMatch[1],
          type: 'interface',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'java'
        });
      }

      const methodMatch = line.match(methodPattern);
      if (methodMatch && !classMatch && !interfaceMatch) {
        symbols.push({
          id: `${filePath}:${methodMatch[1]}:${lineNumber}`,
          name: methodMatch[1],
          type: 'method',
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          signature: line.trim(),
          language: 'java'
        });
      }
    }
  }

  async search(query: string): Promise<CodeSymbol[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM code_symbols 
        WHERE name LIKE ? OR signature LIKE ?
        ORDER BY 
          CASE 
            WHEN name = ? THEN 1
            WHEN name LIKE ? THEN 2
            ELSE 3
          END,
          name
        LIMIT 50
      `;

      const searchTerm = `%${query}%`;
      
      this.db.all(sql, [searchTerm, searchTerm, query, `${query}%`], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const symbols: CodeSymbol[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          filePath: row.file_path,
          startLine: row.start_line,
          endLine: row.end_line,
          signature: row.signature,
          documentation: row.documentation,
          language: row.language
        }));

        resolve(symbols);
      });
    });
  }

  private async getFileIndex(filePath: string): Promise<FileIndex | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM file_index WHERE file_path = ?',
        [filePath],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          resolve({
            filePath: row.file_path,
            content: row.content,
            symbols: [], // Would need to load symbols separately
            lastModified: row.last_modified,
            language: row.language,
            hash: row.hash
          });
        }
      );
    });
  }

  private async storeFileIndex(fileIndex: FileIndex): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Store file index
        this.db.run(
          `INSERT OR REPLACE INTO file_index 
           (file_path, content, language, hash, last_modified, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            fileIndex.filePath,
            fileIndex.content,
            fileIndex.language,
            fileIndex.hash,
            fileIndex.lastModified,
            Date.now()
          ]
        );

        // Delete existing symbols for this file
        this.db.run('DELETE FROM code_symbols WHERE file_path = ?', [fileIndex.filePath]);

        // Insert new symbols
        const stmt = this.db.prepare(`
          INSERT INTO code_symbols 
          (id, name, type, file_path, start_line, end_line, signature, documentation, language, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const symbol of fileIndex.symbols) {
          stmt.run([
            symbol.id,
            symbol.name,
            symbol.type,
            symbol.filePath,
            symbol.startLine,
            symbol.endLine,
            symbol.signature,
            symbol.documentation,
            symbol.language,
            Date.now()
          ]);
        }

        stmt.finalize();
        resolve();
      });
    });
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
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
      '.soql': 'soql'
    };

    return languageMap[ext] || 'text';
  }

  private generateHash(content: string): string {
    // Simple hash function - could use crypto for better hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}
