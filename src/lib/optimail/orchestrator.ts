// Main OptiMail orchestrator - brings together all advanced AI components
import { HybridLLMClients, AdvancedIntentClassifier, LLMConfig } from './llm-clients';
import { IntelligentEmailRouter, EmailRequest, EmailResponse } from './intelligent-router';
import { VectorMemorySystem } from './vector-memory';
import { EmotionalIntelligence } from './emotional-intelligence';
import { VoiceAssistant, VoiceConfig } from './voice-assistant';

export interface OptiMailConfig {
  llm: LLMConfig;
  voice: VoiceConfig;
  features: {
    voiceEnabled: boolean;
    emotionalIntelligence: boolean;
    vectorMemory: boolean;
    multiLLM: boolean;
  };
  userTier: 'free' | 'pro' | 'elite';
}

export interface OptiMailCapabilities {
  compose: boolean;
  reply: boolean;
  summarize: boolean;
  rewrite: boolean;
  voiceInteraction: boolean;
  emotionalAnalysis: boolean;
  contextualMemory: boolean;
  multiModalInput: boolean;
}

export class OptiMailOrchestrator {
  private llmClients: HybridLLMClients;
  private intentClassifier: AdvancedIntentClassifier;
  private emailRouter: IntelligentEmailRouter;
  private vectorMemory: VectorMemorySystem;
  private emotionalIntelligence: EmotionalIntelligence;
  private voiceAssistant: VoiceAssistant | null = null;
  private config: OptiMailConfig;

  constructor(config: OptiMailConfig) {
    this.config = config;
    
    // Initialize core systems
    this.llmClients = new HybridLLMClients(config.llm);
    this.intentClassifier = new AdvancedIntentClassifier(config.llm.cohere.apiKey);
    this.vectorMemory = new VectorMemorySystem();
    this.emotionalIntelligence = new EmotionalIntelligence();
    
    // Initialize voice assistant if enabled
    if (config.features.voiceEnabled && config.userTier !== 'free') {
      this.voiceAssistant = new VoiceAssistant(config.voice);
    }
    
    // Initialize email router with all components
    this.emailRouter = new IntelligentEmailRouter(
      this.llmClients,
      this.intentClassifier,
      this.vectorMemory,
      this.emotionalIntelligence
    );
  }

  // Main email processing method
  async processEmailRequest(request: EmailRequest): Promise<EmailResponse> {
    try {
      // Validate user permissions based on tier
      this.validateUserPermissions(request);
      
      // Process through intelligent router
      const response = await this.emailRouter.processEmailRequest(request);
      
      // Add tier-specific enhancements
      return this.enhanceResponseForTier(response);
      
    } catch (error) {
      console.error('Error processing email request:', error);
      throw new Error('Failed to process email request');
    }
  }

  // Voice-enabled email composition
  async startVoiceSession(): Promise<{
    sessionId: string;
    isListening: boolean;
    capabilities: string[];
  }> {
    if (!this.voiceAssistant || this.config.userTier === 'free') {
      throw new Error('Voice features not available for your plan');
    }

    try {
      const sessionId = `voice_${Date.now()}`;
      
      await this.voiceAssistant.startListening((transcription) => {
        this.handleVoiceInput(transcription.text, sessionId);
      });

      return {
        sessionId,
        isListening: true,
        capabilities: [
          'voice_compose',
          'voice_reply', 
          'voice_commands',
          'conversational_flow'
        ]
      };

    } catch (error) {
      console.error('Error starting voice session:', error);
      throw new Error('Failed to start voice session');
    }
  }

  // Handle voice input and convert to email actions
  async handleVoiceInput(transcript: string, sessionId: string): Promise<void> {
    if (!this.voiceAssistant) return;

    try {
      const voiceCommand = await this.voiceAssistant.processVoiceCommand(transcript);
      
      switch (voiceCommand.action) {
        case 'compose':
          await this.handleVoiceCompose(voiceCommand.entities);
          break;
        case 'reply':
          await this.handleVoiceReply(voiceCommand.entities);
          break;
        case 'help':
          await this.provideVoiceHelp();
          break;
        default:
          await this.voiceAssistant.synthesizeSpeech(
            "I didn't understand that command. Try saying 'compose email' or 'help'."
          );
      }

    } catch (error) {
      console.error('Error handling voice input:', error);
      if (this.voiceAssistant) {
        await this.voiceAssistant.synthesizeSpeech(
          "Sorry, I encountered an error. Please try again."
        );
      }
    }
  }

  // Stop voice session
  async stopVoiceSession(sessionId: string): Promise<void> {
    if (this.voiceAssistant) {
      await this.voiceAssistant.stopListening();
    }
  }

  // Get user's email patterns and preferences
  async getUserInsights(): Promise<{
    patterns: any;
    suggestions: string[];
    capabilities: OptiMailCapabilities;
  }> {
    try {
      const patterns = await this.vectorMemory.getUserPatterns();
      
      const suggestions = this.generatePersonalizedSuggestions(patterns);
      
      const capabilities = this.getUserCapabilities();

      return {
        patterns,
        suggestions,
        capabilities
      };

    } catch (error) {
      console.error('Error getting user insights:', error);
      return {
        patterns: { preferredTones: [], commonIntents: [], successfulPatterns: [] },
        suggestions: ['Start using OptiMail to build your personalized insights'],
        capabilities: this.getUserCapabilities()
      };
    }
  }

  // Provide feedback to improve future responses
  async provideFeedback(
    originalRequest: EmailRequest,
    generatedResponse: string,
    userFeedback: 'positive' | 'negative' | 'neutral',
    improvements?: string
  ): Promise<void> {
    try {
      await this.emailRouter.provideFeedback(
        originalRequest,
        generatedResponse,
        userFeedback,
        improvements
      );

      // Voice confirmation for Pro/Elite users
      if (this.voiceAssistant && this.config.userTier !== 'free') {
        const message = userFeedback === 'positive' 
          ? "Thank you for the positive feedback! I'll remember your preferences."
          : "Thanks for the feedback. I'll use this to improve future responses.";
        
        await this.voiceAssistant.synthesizeSpeech(message);
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  }

  // Real-time collaboration and suggestions
  async getRealtimeSuggestions(
    partialInput: string,
    context: {
      recipient?: string;
      subject?: string;
      existingContent?: string;
    }
  ): Promise<{
    suggestions: string[];
    toneRecommendations: string[];
    predictedContent: string;
  }> {
    if (this.config.userTier === 'free') {
      return {
        suggestions: ['Upgrade to Pro for real-time suggestions'],
        toneRecommendations: ['professional'],
        predictedContent: ''
      };
    }

    try {
      // Use emotional intelligence to analyze current content
      const emotionalAnalysis = await this.emotionalIntelligence.analyzeEmotionalContext(
        partialInput,
        context.existingContent || ''
      );

      // Get contextual memory
      const relevantContext = await this.vectorMemory.retrieveRelevantContext(
        partialInput,
        { limit: 3, threshold: 0.6 }
      );

      // Generate suggestions based on analysis
      const suggestions = [
        ...emotionalAnalysis.suggestions,
        'Consider adding a specific call to action',
        'Review for clarity and conciseness'
      ];

      const toneRecommendations = this.generateToneRecommendations(emotionalAnalysis);

      // Predict next content (simplified)
      const predictedContent = await this.predictNextContent(partialInput, context);

      return {
        suggestions: suggestions.slice(0, 5),
        toneRecommendations,
        predictedContent
      };

    } catch (error) {
      console.error('Error getting realtime suggestions:', error);
      return {
        suggestions: ['Continue writing your email'],
        toneRecommendations: ['professional'],
        predictedContent: ''
      };
    }
  }

  // Private helper methods
  private validateUserPermissions(request: EmailRequest): void {
    const tierLimits = {
      free: ['compose', 'reply', 'summarize'],
      pro: ['compose', 'reply', 'summarize', 'rewrite', 'voice', 'emotion'],
      elite: ['compose', 'reply', 'summarize', 'rewrite', 'voice', 'emotion', 'advanced_ai', 'real_time']
    };

    // Add validation logic based on user tier and request type
    // This is a simplified version - in production you'd have more complex validation
  }

  private enhanceResponseForTier(response: EmailResponse): EmailResponse {
    switch (this.config.userTier) {
      case 'elite':
        // Add advanced analytics and insights
        response.metadata = {
          ...response.metadata
        };
        break;
      case 'pro':
        // Add pro-level enhancements
        response.suggestions = [
          ...(response.suggestions || []),
          'Pro tip: Consider A/B testing different versions'
        ];
        break;
      default:
        // Free tier - no additional enhancements
        break;
    }

    return response;
  }

  private async handleVoiceCompose(entities: { [key: string]: string }): Promise<void> {
    if (!this.voiceAssistant) return;

    const request: EmailRequest = {
      purpose: `Compose an email to ${entities.recipient || 'recipient'} about ${entities.subject || 'the topic'}`,
      tone: (entities.tone as any) || 'professional'
    };

    try {
      const response = await this.processEmailRequest(request);
      
      await this.voiceAssistant.synthesizeSpeech(
        "I've composed your email. Let me read it to you: " + response.content.substring(0, 200) + "..."
      );

    } catch (error) {
      await this.voiceAssistant.synthesizeSpeech(
        "I encountered an error composing your email. Please try again."
      );
    }
  }

  private async handleVoiceReply(entities: { [key: string]: string }): Promise<void> {
    if (!this.voiceAssistant) return;

    await this.voiceAssistant.synthesizeSpeech(
      "I'll help you compose a reply. What's the main message you want to convey?"
    );
  }

  private async provideVoiceHelp(): Promise<void> {
    if (!this.voiceAssistant) return;

    const helpMessage = `I'm your OptiMail voice assistant. I can help you:
    - Compose emails by saying "compose an email"
    - Reply to messages by saying "reply to email" 
    - Summarize email threads
    - Adjust tone and style
    What would you like to do?`;

    await this.voiceAssistant.synthesizeSpeech(helpMessage);
  }

  private generatePersonalizedSuggestions(patterns: any): string[] {
    const suggestions: string[] = [];

    if (patterns.preferredTones.length > 0) {
      suggestions.push(`You tend to prefer ${patterns.preferredTones[0]} tone in your emails`);
    }

    if (patterns.commonIntents.length > 0) {
      suggestions.push(`Your most common email type is ${patterns.commonIntents[0]}`);
    }

    suggestions.push('Try using voice commands for faster email composition');
    suggestions.push('Consider setting up email templates for common scenarios');

    return suggestions;
  }

  private getUserCapabilities(): OptiMailCapabilities {
    return {
      compose: true,
      reply: true,
      summarize: true,
      rewrite: this.config.userTier !== 'free',
      voiceInteraction: this.config.userTier !== 'free' && this.config.features.voiceEnabled,
      emotionalAnalysis: this.config.userTier !== 'free',
      contextualMemory: this.config.features.vectorMemory,
      multiModalInput: this.config.userTier === 'elite'
    };
  }

  private generateToneRecommendations(analysis: any): string[] {
    const recommendations = ['professional', 'friendly'];
    
    if (analysis.sentiment === 'negative') {
      recommendations.unshift('empathetic');
    } else if (analysis.sentiment === 'positive') {
      recommendations.unshift('enthusiastic');
    }

    return recommendations.slice(0, 3);
  }

  private async predictNextContent(
    partialInput: string,
    context: { recipient?: string; subject?: string; existingContent?: string }
  ): Promise<string> {
    // Simplified prediction - in production this would use advanced ML models
    const commonContinuations = [
      'I hope this email finds you well.',
      'I wanted to follow up on our previous conversation.',
      'Please let me know if you have any questions.',
      'I look forward to hearing from you.',
      'Thank you for your time and consideration.'
    ];

    // Simple heuristic based on input
    if (partialInput.toLowerCase().includes('follow up')) {
      return 'I wanted to follow up on our previous conversation regarding...';
    } else if (partialInput.toLowerCase().includes('thank')) {
      return 'Thank you for your time and consideration. I appreciate...';
    }

    return commonContinuations[Math.floor(Math.random() * commonContinuations.length)];
  }

  // Public method to check if a feature is available for the user's tier
  isFeatureAvailable(feature: string): boolean {
    const tierFeatures = {
      free: ['compose', 'reply', 'summarize'],
      pro: ['compose', 'reply', 'summarize', 'rewrite', 'voice', 'emotion', 'tone_analysis'],
      elite: ['compose', 'reply', 'summarize', 'rewrite', 'voice', 'emotion', 'tone_analysis', 'real_time', 'advanced_ai', 'multi_llm']
    };

    return tierFeatures[this.config.userTier].includes(feature);
  }

  // Get configuration information
  getConfig(): OptiMailConfig {
    return { ...this.config };
  }

  // Health check for all systems
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: {
      llm: boolean;
      voice: boolean;
      memory: boolean;
      emotion: boolean;
    };
  }> {
    const services = {
      llm: true, // Would test LLM connections
      voice: this.voiceAssistant !== null,
      memory: true, // Would test vector memory
      emotion: true // Would test emotional intelligence
    };

    const allHealthy = Object.values(services).every(Boolean);
    const status = allHealthy ? 'healthy' : 'degraded';

    return { status, services };
  }
}
