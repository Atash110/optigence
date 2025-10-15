// Vector Memory System for OptiMail - Deep Semantic Recall
export interface MemoryContext {
  id: string;
  content: string;
  summary: string;
  timestamp: Date;
  metadata: {
    intent: string;
    tone: string;
    success: boolean;
    userFeedback?: 'positive' | 'negative' | 'neutral';
  };
}

export interface InteractionData {
  input: string;
  output: string;
  intent: string;
  success: boolean;
  timestamp: Date;
  metadata: {
    usedLLM: string;
    confidence: number;
  };
}

export interface FeedbackData {
  request: {
    purpose: string;
    tone?: string;
  };
  response: string;
  feedback: 'positive' | 'negative' | 'neutral';
  improvements?: string;
  timestamp: Date;
}

export interface RetrievalOptions {
  limit: number;
  threshold: number;
  intentFilter?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export class VectorMemorySystem {
  private memories: Map<string, MemoryContext> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Store interaction for future learning
  async storeInteraction(interaction: InteractionData): Promise<void> {
    try {
      const id = this.generateId();
      const embedding = await this.generateEmbedding(interaction.input);
      
      const memoryContext: MemoryContext = {
        id,
        content: interaction.input,
        summary: this.generateSummary(interaction.input, interaction.output),
        timestamp: interaction.timestamp,
        metadata: {
          intent: interaction.intent,
          tone: 'professional', // Default, should be passed from request
          success: interaction.success
        }
      };

      this.memories.set(id, memoryContext);
      this.embeddings.set(id, embedding);
      
      await this.saveToStorage();
    } catch (error) {
      console.error('Error storing interaction:', error);
    }
  }

  // Store user feedback for continuous learning
  async storeFeedback(feedback: FeedbackData): Promise<void> {
    try {
      const id = this.generateId();
      const embedding = await this.generateEmbedding(feedback.request.purpose);
      
      const memoryContext: MemoryContext = {
        id,
        content: feedback.request.purpose,
        summary: `User feedback: ${feedback.feedback}. ${feedback.improvements || ''}`,
        timestamp: feedback.timestamp,
        metadata: {
          intent: 'feedback',
          tone: feedback.request.tone || 'neutral',
          success: feedback.feedback === 'positive',
          userFeedback: feedback.feedback
        }
      };

      this.memories.set(id, memoryContext);
      this.embeddings.set(id, embedding);
      
      await this.saveToStorage();
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  }

  // Retrieve relevant context based on semantic similarity
  async retrieveRelevantContext(
    query: string,
    options: RetrievalOptions
  ): Promise<MemoryContext[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const similarities: Array<{ id: string; similarity: number; context: MemoryContext }> = [];

      // Calculate similarities
      for (const [id, embedding] of this.embeddings.entries()) {
        const context = this.memories.get(id);
        if (!context) continue;

        // Apply filters
        if (options.intentFilter && context.metadata.intent !== options.intentFilter) {
          continue;
        }

        if (options.timeRange) {
          if (context.timestamp < options.timeRange.start || context.timestamp > options.timeRange.end) {
            continue;
          }
        }

        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        
        if (similarity >= options.threshold) {
          similarities.push({ id, similarity, context });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.limit)
        .map(item => item.context);

    } catch (error) {
      console.error('Error retrieving context:', error);
      return [];
    }
  }

  // Get user patterns and preferences
  async getUserPatterns(): Promise<{
    preferredTones: string[];
    commonIntents: string[];
    successfulPatterns: MemoryContext[];
  }> {
    const allMemories = Array.from(this.memories.values());
    
    // Analyze successful interactions
    const successfulMemories = allMemories.filter(m => m.metadata.success);
    
    // Count tone preferences
    const toneCount = new Map<string, number>();
    const intentCount = new Map<string, number>();
    
    successfulMemories.forEach(memory => {
      const tone = memory.metadata.tone;
      const intent = memory.metadata.intent;
      
      toneCount.set(tone, (toneCount.get(tone) || 0) + 1);
      intentCount.set(intent, (intentCount.get(intent) || 0) + 1);
    });

    // Get top preferences
    const preferredTones = Array.from(toneCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tone]) => tone);

    const commonIntents = Array.from(intentCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);

    return {
      preferredTones,
      commonIntents,
      successfulPatterns: successfulMemories.slice(0, 10)
    };
  }

  // Simple embedding generation (in production, use a proper embedding model)
  private async generateEmbedding(text: string): Promise<number[]> {
    // This is a simplified embedding function
    // In production, you would use OpenAI embeddings, Sentence Transformers, etc.
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // 384-dimensional embedding
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate pseudo-embedding based on text characteristics
    for (let i = 0; i < 384; i++) {
      embedding[i] = Math.sin(hash * (i + 1) * 0.01) + Math.cos(words.length * (i + 1) * 0.02);
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude ? dotProduct / magnitude : 0;
  }

  private generateSummary(input: string, output: string): string {
    // Simple summary generation - in production use an LLM
    const inputWords = input.split(' ').slice(0, 10).join(' ');
    const outputWords = output.split(' ').slice(0, 15).join(' ');
    return `Request: ${inputWords}... Response: ${outputWords}...`;
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        memories: Array.from(this.memories.entries()),
        embeddings: Array.from(this.embeddings.entries())
      };
      localStorage.setItem('optimail_memory', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('optimail_memory');
      if (stored) {
        const data = JSON.parse(stored);
        this.memories = new Map(data.memories || []);
        this.embeddings = new Map(data.embeddings || []);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.memories = new Map();
      this.embeddings = new Map();
    }
  }

  // Clear old memories to prevent storage bloat
  async cleanupOldMemories(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const toRemove: string[] = [];
    
    for (const [id, memory] of this.memories.entries()) {
      if (memory.timestamp < cutoffDate && memory.metadata.userFeedback !== 'positive') {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => {
      this.memories.delete(id);
      this.embeddings.delete(id);
    });

    await this.saveToStorage();
  }
}
