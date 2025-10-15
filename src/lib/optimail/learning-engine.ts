/**
 * Phase 6: Advanced Learning Engine
 * Adaptive AI that learns from user behavior and improves over time
 */

export interface UserPersonality {
  writingStyle: 'formal' | 'casual' | 'friendly' | 'direct';
  responseSpeed: 'immediate' | 'thoughtful' | 'delayed';
  communicationPreference: 'concise' | 'detailed' | 'balanced';
  tonePreference: 'professional' | 'warm' | 'neutral' | 'assertive';
  decisionMaking: 'quick' | 'deliberate' | 'collaborative';
}

export interface AutoSendMetrics {
  totalAutoSends: number;
  successfulAutoSends: number;
  canceledAutoSends: number;
  regrettedAutoSends: number;
  averageConfidenceAtSend: number;
  optimalConfidenceThreshold: number;
  lastThresholdUpdate: Date;
}

export interface ContactTrust {
  email: string;
  trustScore: number; // 0-1, higher = more trusted
  communicationFrequency: number;
  responseRate: number;
  relationshipType: 'colleague' | 'client' | 'friend' | 'manager' | 'vendor' | 'unknown';
  lastInteraction: Date;
  autoSendSuccess: number; // Success rate for auto-sends to this contact
}

export interface TemplatePerformance {
  templateId: string;
  content: string;
  usageCount: number;
  acceptanceRate: number; // How often it's used without modification
  modificationPatterns: string[]; // Common changes users make
  performanceScore: number; // Overall effectiveness
  lastUsed: Date;
  contexts: string[]; // When this template works best
}

export interface ThreadMemory {
  threadId: string;
  participants: string[];
  context: string;
  decisions: string[];
  followUpRequired: boolean;
  priority: 'high' | 'medium' | 'low';
  lastActivity: Date;
  keyInsights: string[];
}

export interface UserInteraction {
  type: 'draft' | 'auto_send' | 'template_use' | 'voice_input';
  content: string;
  timing: number;
  outcome: 'success' | 'modified' | 'canceled' | 'regretted';
  metadata: {
    confidence?: number;
    templateId?: string;
    modification?: string;
    recipients?: string[];
    [key: string]: unknown;
  };
}

export interface EnhancedSuggestion {
  id: string;
  text: string;
  intent: string;
  confidence: number;
  data?: unknown;
}

export class LearningEngine {
  private userId: string;
  private personality: UserPersonality | null = null;
  private autoSendMetrics: AutoSendMetrics | null = null;
  private contactTrust: Map<string, ContactTrust> = new Map();
  private templatePerformance: Map<string, TemplatePerformance> = new Map();
  private threadMemory: Map<string, ThreadMemory> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize learning engine with user data
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadPersonalityProfile(),
      this.loadAutoSendMetrics(),
      this.loadContactTrust(),
      this.loadTemplatePerformance(),
      this.loadThreadMemory()
    ]);
  }

  /**
   * Analyze user behavior and update personality profile
   */
  async analyzeUserBehavior(interaction: UserInteraction): Promise<void> {
    // Update personality based on interaction patterns
    await this.updatePersonalityProfile(interaction);
    
    // Update auto-send metrics if relevant
    if (interaction.type === 'auto_send') {
      await this.updateAutoSendMetrics(interaction);
    }
    
    // Update template performance
    if (interaction.type === 'template_use') {
      await this.updateTemplatePerformance(interaction);
    }

    // Save updated profiles
    await this.persistLearningData();
  }

  /**
   * Get adaptive confidence threshold for auto-send
   */
  getAdaptiveConfidenceThreshold(contactEmail?: string): number {
    let baseThreshold = this.autoSendMetrics?.optimalConfidenceThreshold || 0.85;
    
    // Adjust based on contact trust
    if (contactEmail) {
      const trust = this.contactTrust.get(contactEmail);
      if (trust) {
        // Higher trust = lower threshold needed
        baseThreshold -= (trust.trustScore - 0.5) * 0.1;
      }
    }
    
    // Adjust based on user personality
    if (this.personality) {
      if (this.personality.decisionMaking === 'quick') {
        baseThreshold -= 0.05;
      } else if (this.personality.decisionMaking === 'deliberate') {
        baseThreshold += 0.05;
      }
    }
    
    // Keep within reasonable bounds
    return Math.max(0.75, Math.min(0.95, baseThreshold));
  }

  /**
   * Get personalized template suggestions
   */
  async getPersonalizedTemplates(context: {
    intent: string;
    recipient?: string;
    urgency: 'high' | 'medium' | 'low';
    previousContext?: string;
  }): Promise<TemplatePerformance[]> {
    const relevantTemplates = Array.from(this.templatePerformance.values())
      .filter(template => {
        // Filter by context relevance
        return template.contexts.some(ctx => 
          ctx.includes(context.intent) || 
          (context.urgency === 'high' && ctx.includes('urgent'))
        );
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    return relevantTemplates;
  }

  /**
   * Analyze contact relationship and build trust profile
   */
  async analyzeContactRelationship(email: string, interactions: {
    sent: number;
    received: number;
    responseTime: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[]): Promise<ContactTrust> {
    const trust = this.contactTrust.get(email) || {
      email,
      trustScore: 0.5,
      communicationFrequency: 0,
      responseRate: 0,
      relationshipType: 'unknown' as const,
      lastInteraction: new Date(),
      autoSendSuccess: 0.5
    };

    // Calculate trust based on interaction patterns
    const totalInteractions = interactions.length;
    const positiveInteractions = interactions.filter(i => i.sentiment === 'positive').length;
    const avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / totalInteractions;
    
    // Update trust score (0-1)
    trust.trustScore = Math.min(1, Math.max(0, 
      (positiveInteractions / totalInteractions) * 0.4 + // 40% from positive sentiment
      (Math.min(avgResponseTime, 86400) / 86400) * 0.3 + // 30% from response speed (max 24h)
      (totalInteractions / 100) * 0.3 // 30% from interaction frequency
    ));

    trust.communicationFrequency = totalInteractions;
    trust.responseRate = interactions.filter(i => i.received > 0).length / totalInteractions;
    trust.lastInteraction = new Date();

    // Infer relationship type
    if (totalInteractions > 50 && trust.trustScore > 0.8) {
      trust.relationshipType = 'colleague';
    } else if (avgResponseTime < 3600 && trust.trustScore > 0.7) {
      trust.relationshipType = 'friend';
    } else if (interactions.some(i => i.sent > i.received * 2)) {
      trust.relationshipType = 'client';
    }

    this.contactTrust.set(email, trust);
    return trust;
  }

  /**
   * Get contextual memory for email thread
   */
  getThreadContext(threadId: string): ThreadMemory | null {
    return this.threadMemory.get(threadId) || null;
  }

  /**
   * Update thread memory with new information
   */
  async updateThreadMemory(threadId: string, update: {
    newParticipants?: string[];
    contextUpdate?: string;
    decision?: string;
    followUpRequired?: boolean;
    priority?: 'high' | 'medium' | 'low';
    insights?: string[];
  }): Promise<void> {
    const memory = this.threadMemory.get(threadId) || {
      threadId,
      participants: [],
      context: '',
      decisions: [],
      followUpRequired: false,
      priority: 'medium' as const,
      lastActivity: new Date(),
      keyInsights: []
    };

    // Merge updates
    if (update.newParticipants) {
      memory.participants = [...new Set([...memory.participants, ...update.newParticipants])];
    }
    if (update.contextUpdate) {
      memory.context += (memory.context ? '\n' : '') + update.contextUpdate;
    }
    if (update.decision) {
      memory.decisions.push(update.decision);
    }
    if (update.followUpRequired !== undefined) {
      memory.followUpRequired = update.followUpRequired;
    }
    if (update.priority) {
      memory.priority = update.priority;
    }
    if (update.insights) {
      memory.keyInsights.push(...update.insights);
    }
    
    memory.lastActivity = new Date();
    this.threadMemory.set(threadId, memory);
  }

  /**
   * Generate learning-enhanced suggestions
   */
  async generateEnhancedSuggestions(input: string, context: {
    recipients?: string[];
    threadId?: string;
    urgency?: 'high' | 'medium' | 'low';
  }): Promise<{
    suggestions: EnhancedSuggestion[];
    confidence: number;
    reasoning: string[];
  }> {
    const suggestions: EnhancedSuggestion[] = [];
    const reasoning: string[] = [];
    let confidence = 0.7;

    // Get thread context if available
    const threadContext = context.threadId ? this.getThreadContext(context.threadId) : null;
    if (threadContext) {
      reasoning.push(`Found ${threadContext.decisions.length} previous decisions in this thread`);
      confidence += 0.05;
    }

    // Get contact trust for recipients
    if (context.recipients) {
      const avgTrust = context.recipients
        .map(email => this.contactTrust.get(email)?.trustScore || 0.5)
        .reduce((sum, trust) => sum + trust, 0) / context.recipients.length;
      
      if (avgTrust > 0.7) {
        reasoning.push('High trust relationship detected');
        confidence += 0.1;
      }
    }

    // Get personalized templates
    if (context.urgency) {
      const templates = await this.getPersonalizedTemplates({
        intent: 'reply',
        urgency: context.urgency
      });
      
      if (templates.length > 0) {
        suggestions.push({
          id: 'personalized-template',
          text: 'Use personalized template',
          intent: 'template',
          confidence: templates[0].performanceScore,
          data: templates[0]
        });
        reasoning.push(`Found ${templates.length} relevant templates with ${Math.round(templates[0].performanceScore * 100)}% success rate`);
      }
    }

    return {
      suggestions,
      confidence: Math.min(0.95, confidence),
      reasoning
    };
  }

  // Private methods
  private async loadPersonalityProfile(): Promise<void> {
    try {
      const response = await fetch(`/api/learning/profile?userId=${this.userId}`);
      if (response.ok) {
        this.personality = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load personality profile:', error);
    }
  }

  private async loadAutoSendMetrics(): Promise<void> {
    try {
      const response = await fetch(`/api/learning/autosend?userId=${this.userId}`);
      if (response.ok) {
        this.autoSendMetrics = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load auto-send metrics:', error);
    }
  }

  private async loadContactTrust(): Promise<void> {
    try {
      const response = await fetch(`/api/learning/contacts?userId=${this.userId}`);
      if (response.ok) {
        const contacts: ContactTrust[] = await response.json();
        this.contactTrust = new Map(contacts.map(c => [c.email, c]));
      }
    } catch (error) {
      console.warn('Failed to load contact trust:', error);
    }
  }

  private async loadTemplatePerformance(): Promise<void> {
    try {
      const response = await fetch(`/api/learning/templates?userId=${this.userId}`);
      if (response.ok) {
        const templates: TemplatePerformance[] = await response.json();
        this.templatePerformance = new Map(templates.map(t => [t.templateId, t]));
      }
    } catch (error) {
      console.warn('Failed to load template performance:', error);
    }
  }

  private async loadThreadMemory(): Promise<void> {
    try {
      const response = await fetch(`/api/learning/threads?userId=${this.userId}`);
      if (response.ok) {
        const threads: ThreadMemory[] = await response.json();
        this.threadMemory = new Map(threads.map(t => [t.threadId, t]));
      }
    } catch (error) {
      console.warn('Failed to load thread memory:', error);
    }
  }

  private async updatePersonalityProfile(interaction: UserInteraction): Promise<void> {
    if (!this.personality) {
      this.personality = {
        writingStyle: 'formal',
        responseSpeed: 'thoughtful',
        communicationPreference: 'balanced',
        tonePreference: 'professional',
        decisionMaking: 'deliberate'
      };
    }

    // Analyze patterns and update personality
    if (interaction.timing < 5000) { // Less than 5 seconds
      this.personality.responseSpeed = 'immediate';
    } else if (interaction.timing > 30000) { // More than 30 seconds
      this.personality.responseSpeed = 'thoughtful';
    }

    // Analyze content length and style
    const wordCount = interaction.content.split(' ').length;
    if (wordCount < 10) {
      this.personality.communicationPreference = 'concise';
    } else if (wordCount > 50) {
      this.personality.communicationPreference = 'detailed';
    }
  }

  private async updateAutoSendMetrics(interaction: UserInteraction): Promise<void> {
    if (!this.autoSendMetrics) {
      this.autoSendMetrics = {
        totalAutoSends: 0,
        successfulAutoSends: 0,
        canceledAutoSends: 0,
        regrettedAutoSends: 0,
        averageConfidenceAtSend: 0.85,
        optimalConfidenceThreshold: 0.85,
        lastThresholdUpdate: new Date()
      };
    }

    this.autoSendMetrics.totalAutoSends++;
    
    if (interaction.outcome === 'success') {
      this.autoSendMetrics.successfulAutoSends++;
    } else if (interaction.outcome === 'canceled') {
      this.autoSendMetrics.canceledAutoSends++;
    } else if (interaction.outcome === 'regretted') {
      this.autoSendMetrics.regrettedAutoSends++;
    }

    // Update confidence average
    const confidence = interaction.metadata.confidence || 0.85;
    this.autoSendMetrics.averageConfidenceAtSend = 
      (this.autoSendMetrics.averageConfidenceAtSend * (this.autoSendMetrics.totalAutoSends - 1) + confidence) / 
      this.autoSendMetrics.totalAutoSends;

    // Adjust optimal threshold based on success rate
    const successRate = this.autoSendMetrics.successfulAutoSends / this.autoSendMetrics.totalAutoSends;
    if (successRate < 0.8) {
      // Too many failures, increase threshold
      this.autoSendMetrics.optimalConfidenceThreshold += 0.02;
    } else if (successRate > 0.95) {
      // Very high success rate, can lower threshold
      this.autoSendMetrics.optimalConfidenceThreshold -= 0.01;
    }

    // Keep threshold in reasonable range
    this.autoSendMetrics.optimalConfidenceThreshold = Math.max(0.75, Math.min(0.95, this.autoSendMetrics.optimalConfidenceThreshold));
    this.autoSendMetrics.lastThresholdUpdate = new Date();
  }

  private async updateTemplatePerformance(interaction: UserInteraction): Promise<void> {
    const templateId = interaction.metadata.templateId;
    if (!templateId || typeof templateId !== 'string') return;

    const perf = this.templatePerformance.get(templateId) || {
      templateId,
      content: interaction.content,
      usageCount: 0,
      acceptanceRate: 0,
      modificationPatterns: [],
      performanceScore: 0.5,
      lastUsed: new Date(),
      contexts: []
    };

    perf.usageCount++;
    perf.lastUsed = new Date();

    if (interaction.outcome === 'success') {
      perf.acceptanceRate = (perf.acceptanceRate * (perf.usageCount - 1) + 1) / perf.usageCount;
    } else if (interaction.outcome === 'modified') {
      perf.acceptanceRate = (perf.acceptanceRate * (perf.usageCount - 1) + 0.5) / perf.usageCount;
      
      // Track modification patterns
      const modification = interaction.metadata.modification;
      if (modification && typeof modification === 'string' && !perf.modificationPatterns.includes(modification)) {
        perf.modificationPatterns.push(modification);
      }
    }

    // Update performance score based on acceptance rate and usage frequency
    perf.performanceScore = perf.acceptanceRate * 0.7 + Math.min(perf.usageCount / 10, 1) * 0.3;

    this.templatePerformance.set(templateId, perf);
  }

  private async persistLearningData(): Promise<void> {
    try {
      await Promise.all([
        fetch('/api/learning/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, profile: this.personality })
        }),
        fetch('/api/learning/autosend', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, metrics: this.autoSendMetrics })
        })
      ]);
    } catch (error) {
      console.warn('Failed to persist learning data:', error);
    }
  }
}
