import { Database } from 'sqlite3';
import axios from 'axios';

export interface CodeEmbedding {
  id: string;
  filePath: string;
  content: string;
  embedding: number[];
  language: string;
  symbolType?: string;
  startLine: number;
  endLine: number;
  createdAt: number;
}

export interface SemanticSearchResult {
  id: string;
  filePath: string;
  content: string;
  similarity: number;
  language: string;
  startLine: number;
  endLine: number;
}

export class EmbeddingsService {
  private db!: Database;
  private isInitialized = false;
  private embeddingModel = 'all-MiniLM-L6-v2'; // Local embedding model
  private embeddingDimensions = 384;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db = new Database(':memory:'); // Use in-memory for now
    
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id TEXT PRIMARY KEY,
          file_path TEXT,
          content TEXT,
          embedding BLOB,
          language TEXT,
          symbol_type TEXT,
          start_line INTEGER,
          end_line INTEGER,
          created_at INTEGER
        )
      `);

      // Create indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_embeddings_file ON embeddings(file_path)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_embeddings_language ON embeddings(language)');
    });
  }

  async initialize(): Promise<void> {
    try {
      // Check if local embedding service is available (e.g., sentence-transformers via HTTP)
      // For now, we'll use a simple placeholder
      this.isInitialized = true;
      console.log('Embeddings service initialized');
    } catch (error) {
      console.warn('Embeddings service initialization failed:', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('Embeddings service not initialized');
    }

    try {
      // Try to use local embedding service first
      const response = await axios.post('http://localhost:8000/embed', {
        text: text,
        model: this.embeddingModel
      });

      return response.data.embedding;
    } catch (error) {
      // Fallback to simple hash-based "embedding" for development
      console.warn('Local embedding service not available, using fallback');
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for development/testing
    // In production, this should use a proper embedding model
    const embedding = new Array(this.embeddingDimensions).fill(0);
    
    for (let i = 0; i < text.length && i < embedding.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % embedding.length] += charCode;
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  async embedCode(
    id: string,
    filePath: string,
    content: string,
    language: string,
    symbolType?: string,
    startLine: number = 1,
    endLine: number = 1
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      
      await this.storeEmbedding({
        id,
        filePath,
        content,
        embedding,
        language,
        symbolType,
        startLine,
        endLine,
        createdAt: Date.now()
      });

      console.log(`Generated embedding for ${filePath}:${startLine}-${endLine}`);
    } catch (error) {
      console.error(`Failed to embed code from ${filePath}:`, error);
    }
  }

  async semanticSearch(query: string, limit: number = 10): Promise<SemanticSearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      return new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM embeddings', [], (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const results: SemanticSearchResult[] = [];

          for (const row of rows) {
            const embedding = this.deserializeEmbedding(row.embedding);
            const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);

            results.push({
              id: row.id,
              filePath: row.file_path,
              content: row.content,
              similarity,
              language: row.language,
              startLine: row.start_line,
              endLine: row.end_line
            });
          }

          // Sort by similarity and return top results
          results.sort((a, b) => b.similarity - a.similarity);
          resolve(results.slice(0, limit));
        });
      });
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  async findSimilarCode(
    filePath: string,
    startLine: number,
    endLine: number,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    try {
      // Get the embedding for the specified code block
      const targetEmbedding = await this.getEmbeddingByLocation(filePath, startLine, endLine);
      if (!targetEmbedding) {
        return [];
      }

      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM embeddings WHERE file_path != ? OR start_line != ? OR end_line != ?',
          [filePath, startLine, endLine],
          (err, rows: any[]) => {
            if (err) {
              reject(err);
              return;
            }

            const results: SemanticSearchResult[] = [];

            for (const row of rows) {
              const embedding = this.deserializeEmbedding(row.embedding);
              const similarity = this.calculateCosineSimilarity(targetEmbedding, embedding);

              if (similarity > 0.7) { // Only include reasonably similar code
                results.push({
                  id: row.id,
                  filePath: row.file_path,
                  content: row.content,
                  similarity,
                  language: row.language,
                  startLine: row.start_line,
                  endLine: row.end_line
                });
              }
            }

            // Sort by similarity and return top results
            results.sort((a, b) => b.similarity - a.similarity);
            resolve(results.slice(0, limit));
          }
        );
      });
    } catch (error) {
      console.error('Find similar code failed:', error);
      return [];
    }
  }

  private async getEmbeddingByLocation(
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<number[] | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT embedding FROM embeddings WHERE file_path = ? AND start_line = ? AND end_line = ?',
        [filePath, startLine, endLine],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          resolve(this.deserializeEmbedding(row.embedding));
        }
      );
    });
  }

  private async storeEmbedding(codeEmbedding: CodeEmbedding): Promise<void> {
    return new Promise((resolve, reject) => {
      const embeddingBlob = this.serializeEmbedding(codeEmbedding.embedding);
      
      this.db.run(
        `INSERT OR REPLACE INTO embeddings 
         (id, file_path, content, embedding, language, symbol_type, start_line, end_line, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codeEmbedding.id,
          codeEmbedding.filePath,
          codeEmbedding.content,
          embeddingBlob,
          codeEmbedding.language,
          codeEmbedding.symbolType,
          codeEmbedding.startLine,
          codeEmbedding.endLine,
          codeEmbedding.createdAt
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  private serializeEmbedding(embedding: number[]): Buffer {
    // Convert number array to Buffer for storage
    const buffer = Buffer.allocUnsafe(embedding.length * 8); // 8 bytes per double
    for (let i = 0; i < embedding.length; i++) {
      buffer.writeDoubleLE(embedding[i], i * 8);
    }
    return buffer;
  }

  private deserializeEmbedding(buffer: Buffer): number[] {
    // Convert Buffer back to number array
    const embedding: number[] = [];
    for (let i = 0; i < buffer.length; i += 8) {
      embedding.push(buffer.readDoubleLE(i));
    }
    return embedding;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  async removeEmbeddingsForFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM embeddings WHERE file_path = ?',
        [filePath],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}
