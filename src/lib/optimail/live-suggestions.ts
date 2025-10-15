// Types for the live suggestion pipeline
export interface SuggestionContext {
  userInput: string;
  intent: string;
  confidence: number;
  extraction: {
    ask: string;
    people?: Array<{ name: string; email?: string; role?: string }>;
    dates_times?: Array<{ text: string; parsed?: string; type?: string }>;
    locations?: Array<{ text: string; type?: string }>;
    sentiment: string;
    urgency: string;
    topics: string[];
    constraints?: string[];
    language: string;
  };
  userProfile?: {
    name?: string;
    email?: string;
    defaultTone: string;
    signature?: string;
    timeWindows?: Array<{ day: string; start: string; end: string; preference: string }>;
    confidenceAutoSend: number;
    autoSendEnabled: boolean;
    primaryLanguage?: string;
  };
  contactProfile?: {
    email?: string;
    name?: string;
    trustLevel: number;
    lastInteraction?: string;
    responseTimeAvg?: number;
  };
  threadContext?: {
    hasHistory: boolean;
    messageCount: number;
    lastMessage?: string;
    participants: string[];
    status: string;
  };
  calendarContext?: {
    hasCalendarAccess: boolean;
    upcomingEvents: number;
    availableSlots?: Array<{ start: string; end: string }>;
  };
}

export interface ActionSuggestion {
  id: string;
  label: string;
  icon: string;
  description: string;
  confidence: number;
  category: 'primary' | 'secondary' | 'contextual' | 'cross_module';
  action: string;
  parameters?: Record<string, unknown>;
  tooltip: string;
  estimatedTime?: string;
  requiresConfirmation?: boolean;
}

export interface SuggestionPipelineResult {
  suggestions: ActionSuggestion[];
  primaryAction?: ActionSuggestion;
  contextualHints: string[];
  reasoning: string;
  processingTimeMs: number;
}

export class LiveSuggestionEngine {
  
  /**
   * Generate contextual suggestions based on user input and extracted information
   */
  static async generateSuggestions(context: SuggestionContext): Promise<SuggestionPipelineResult> {
    const startTime = Date.now();
    const suggestions: ActionSuggestion[] = [];
    const contextualHints: string[] = [];
    
    try {
      // Step 1: Intent-based core suggestions
      const coreSuggestions = this.getCoreSuggestionsByIntent(context);
      suggestions.push(...coreSuggestions);
      
      // Step 2: Context-driven enhancements
      const contextualSuggestions = await this.getContextualSuggestions(context);
      suggestions.push(...contextualSuggestions);
      
      // Step 3: User profile personalization
      const personalizedSuggestions = this.getPersonalizedSuggestions(context);
      suggestions.push(...personalizedSuggestions);
      
      // Step 4: Cross-module routing suggestions
      const crossModuleSuggestions = this.getCrossModuleSuggestions(context);
      suggestions.push(...crossModuleSuggestions);
      
      // Step 5: Generate contextual hints
      contextualHints.push(...this.generateContextualHints(context));
      
      // Step 6: Rank and filter suggestions
      const rankedSuggestions = this.rankAndFilterSuggestions(suggestions, context);
      
      // Step 7: Identify primary action
      const primaryAction = this.identifyPrimaryAction(rankedSuggestions, context);
      
      const processingTime = Date.now() - startTime;
      
      return {
        suggestions: rankedSuggestions.slice(0, 6), // Max 6 suggestions
        primaryAction,
        contextualHints,
        reasoning: this.generateReasoning(context, rankedSuggestions),
        processingTimeMs: processingTime
      };
      
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      
      // Fallback to basic suggestions
      const fallbackSuggestions = this.getFallbackSuggestions(context.intent);
      
      return {
        suggestions: fallbackSuggestions,
        contextualHints: ['Using basic suggestions due to processing error'],
        reasoning: 'Fallback mode due to error',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Core suggestions based on detected intent
   */
  private static getCoreSuggestionsByIntent(context: SuggestionContext): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];
    const { intent, extraction, confidence } = context;
    
    switch (intent) {
      case 'reply':
        suggestions.push({
          id: 'reply_draft',
          label: 'Draft Reply',
          icon: '↩️',
          description: 'Generate AI-powered email reply',
          confidence: confidence,
          category: 'primary',
          action: 'generate_reply',
          tooltip: 'Creates a contextual reply based on the conversation',
          estimatedTime: '5-10 seconds'
        });
        
        if (extraction.sentiment === 'positive') {
          suggestions.push({
            id: 'reply_thank',
            label: 'Thank You Reply',
            icon: '🙏',
            description: 'Generate grateful response',
            confidence: 0.8,
            category: 'secondary',
            action: 'generate_thank_you',
            tooltip: 'Quick thank you message template'
          });
        }
        break;
        
      case 'summarize':
        suggestions.push({
          id: 'summarize_thread',
          label: 'Summarize Thread',
          icon: '📋',
          description: 'Create concise summary of conversation',
          confidence: confidence,
          category: 'primary',
          action: 'summarize_conversation',
          tooltip: 'AI-generated bullet-point summary',
          estimatedTime: '3-5 seconds'
        });
        
        if (context.threadContext?.messageCount && context.threadContext.messageCount > 5) {
          suggestions.push({
            id: 'summarize_key_points',
            label: 'Extract Key Points',
            icon: '🎯',
            description: 'Highlight important decisions and action items',
            confidence: 0.9,
            category: 'contextual',
            action: 'extract_action_items',
            tooltip: 'Focus on actionable items and decisions'
          });
        }
        break;
        
      case 'translate':
        suggestions.push({
          id: 'translate_text',
          label: 'Translate',
          icon: '🌐',
          description: `Translate to ${this.getTargetLanguage(context)}`,
          confidence: confidence,
          category: 'primary',
          action: 'translate_message',
          tooltip: 'Professional translation maintaining tone'
        });
        break;
        
      case 'calendar':
        if (extraction.dates_times && extraction.dates_times.length > 0) {
          suggestions.push({
            id: 'add_to_calendar',
            label: 'Add to Calendar',
            icon: '📅',
            description: 'Create calendar event',
            confidence: 0.9,
            category: 'primary',
            action: 'create_calendar_event',
            parameters: { dates: extraction.dates_times },
            tooltip: 'Creates event with detected time and participants',
            requiresConfirmation: true
          });
        } else {
          suggestions.push({
            id: 'propose_times',
            label: 'Propose Times',
            icon: '🕐',
            description: 'Suggest meeting times',
            confidence: 0.8,
            category: 'primary',
            action: 'propose_meeting_times',
            tooltip: 'AI-generated time suggestions based on availability'
          });
        }
        break;
        
      case 'template':
        suggestions.push({
          id: 'save_template',
          label: 'Save Template',
          icon: '💾',
          description: 'Create reusable template',
          confidence: confidence,
          category: 'primary',
          action: 'save_as_template',
          tooltip: 'Save this pattern for future use'
        });
        break;
    }
    
    return suggestions;
  }

  /**
   * Contextual suggestions based on extracted information
   */
  private static async getContextualSuggestions(context: SuggestionContext): Promise<ActionSuggestion[]> {
    const suggestions: ActionSuggestion[] = [];
    const { extraction, threadContext, calendarContext } = context;
    
    // People-based suggestions
    if (extraction.people && extraction.people.length > 0) {
      suggestions.push({
        id: 'cc_participants',
        label: `CC ${extraction.people.length} People`,
        icon: '👥',
        description: 'Include all participants in reply',
        confidence: 0.7,
        category: 'contextual',
        action: 'include_participants',
        parameters: { people: extraction.people },
        tooltip: 'Automatically add detected participants to the email'
      });
    }
    
    // Urgency-based suggestions
    if (extraction.urgency === 'high') {
      suggestions.push({
        id: 'priority_response',
        label: 'Priority Response',
        icon: '🚨',
        description: 'Generate urgent reply',
        confidence: 0.9,
        category: 'contextual',
        action: 'generate_urgent_reply',
        tooltip: 'High-priority response template with urgent tone'
      });
    }
    
    // Date/time suggestions
    if (extraction.dates_times && extraction.dates_times.length > 0 && calendarContext?.hasCalendarAccess) {
      suggestions.push({
        id: 'check_availability',
        label: 'Check Availability',
        icon: '🗓️',
        description: 'Verify calendar conflicts',
        confidence: 0.8,
        category: 'contextual',
        action: 'check_calendar_availability',
        tooltip: 'Cross-reference with your calendar'
      });
    }
    
    // Location-based suggestions
    if (extraction.locations && extraction.locations.length > 0) {
      suggestions.push({
        id: 'location_details',
        label: 'Location Info',
        icon: '📍',
        description: 'Get venue details and directions',
        confidence: 0.6,
        category: 'contextual',
        action: 'fetch_location_info',
        parameters: { locations: extraction.locations },
        tooltip: 'Address, directions, and venue information'
      });
    }
    
    // Thread context suggestions
    if (threadContext?.hasHistory && threadContext.messageCount > 3) {
      suggestions.push({
        id: 'reference_history',
        label: 'Reference Previous',
        icon: '🔗',
        description: 'Include conversation context',
        confidence: 0.7,
        category: 'contextual',
        action: 'include_thread_context',
        tooltip: 'Reference relevant parts of the conversation'
      });
    }
    
    return suggestions;
  }

  /**
   * Personalized suggestions based on user profile and preferences
   */
  private static getPersonalizedSuggestions(context: SuggestionContext): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];
    const { userProfile, contactProfile, intent } = context;
    
    // Auto-send suggestions based on trust and confidence
    if (userProfile?.autoSendEnabled && contactProfile?.trustLevel && contactProfile.trustLevel > 70) {
      const totalConfidence = context.confidence * (contactProfile.trustLevel / 100);
      
      if (totalConfidence > userProfile.confidenceAutoSend / 100) {
        suggestions.push({
          id: 'auto_send',
          label: 'Auto-Send',
          icon: '⚡',
          description: `High confidence (${Math.round(totalConfidence * 100)}%)`,
          confidence: totalConfidence,
          category: 'primary',
          action: 'auto_send_with_countdown',
          parameters: { countdown: 3000 }, // 3 seconds
          tooltip: 'Trusted contact + high confidence = auto-send option',
          requiresConfirmation: false
        });
      }
    }
    
    // Tone adjustments based on contact relationship
    if (contactProfile?.email && userProfile?.defaultTone) {
      const suggestedTone = this.getToneForContact(contactProfile, userProfile.defaultTone);
      
      if (suggestedTone !== userProfile.defaultTone) {
        suggestions.push({
          id: 'adjust_tone',
          label: `Use ${suggestedTone} Tone`,
          icon: '🎭',
          description: `Better fit for ${contactProfile.name || contactProfile.email}`,
          confidence: 0.8,
          category: 'contextual',
          action: 'adjust_tone',
          parameters: { tone: suggestedTone },
          tooltip: `Based on your relationship with ${contactProfile.name || 'this contact'}`
        });
      }
    }
    
    // Signature suggestions
    if (userProfile?.signature && intent === 'reply') {
      suggestions.push({
        id: 'add_signature',
        label: 'Add Signature',
        icon: '✍️',
        description: 'Include your email signature',
        confidence: 0.9,
        category: 'secondary',
        action: 'include_signature',
        tooltip: 'Your saved signature will be added automatically'
      });
    }
    
    return suggestions;
  }

  /**
   * Cross-module routing suggestions
   */
  private static getCrossModuleSuggestions(context: SuggestionContext): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];
    const { extraction } = context;
    
    // OptiTrip routing
    const travelKeywords = ['travel', 'trip', 'flight', 'hotel', 'vacation', 'visit', 'airport'];
    if (extraction.topics.some(topic => 
      travelKeywords.some(keyword => topic.toLowerCase().includes(keyword))
    ) || extraction.locations && extraction.locations.length > 0) {
      suggestions.push({
        id: 'route_optitrip',
        label: 'Open OptiTrip',
        icon: '✈️',
        description: 'Plan travel with AI assistance',
        confidence: 0.8,
        category: 'cross_module',
        action: 'route_to_optitrip',
        parameters: { 
          prefilled: true,
          query: context.userInput,
          locations: extraction.locations 
        },
        tooltip: 'Switch to OptiTrip with current context'
      });
    }
    
    // OptiShop routing
    const shoppingKeywords = ['buy', 'purchase', 'product', 'shop', 'order', 'price', 'deal'];
    if (extraction.topics.some(topic => 
      shoppingKeywords.some(keyword => topic.toLowerCase().includes(keyword))
    )) {
      suggestions.push({
        id: 'route_optishop',
        label: 'Open OptiShop',
        icon: '🛒',
        description: 'Find and compare products',
        confidence: 0.8,
        category: 'cross_module',
        action: 'route_to_optishop',
        parameters: { 
          prefilled: true,
          query: context.userInput,
          products: extraction.topics 
        },
        tooltip: 'Switch to OptiShop for product search'
      });
    }
    
    // OptiHire routing
    const jobKeywords = ['job', 'interview', 'hire', 'career', 'resume', 'position', 'salary'];
    if (extraction.topics.some(topic => 
      jobKeywords.some(keyword => topic.toLowerCase().includes(keyword))
    )) {
      suggestions.push({
        id: 'route_optihire',
        label: 'Open OptiHire',
        icon: '💼',
        description: 'Job search and career assistance',
        confidence: 0.8,
        category: 'cross_module',
        action: 'route_to_optihire',
        parameters: { 
          prefilled: true,
          query: context.userInput,
          skills: extraction.topics 
        },
        tooltip: 'Switch to OptiHire for job-related tasks'
      });
    }
    
    return suggestions;
  }

  /**
   * Generate contextual hints for better user understanding
   */
  private static generateContextualHints(context: SuggestionContext): string[] {
    const hints: string[] = [];
    const { confidence, extraction, contactProfile } = context;
    
    // Confidence-based hints
    if (confidence < 0.7) {
      hints.push(`Intent confidence: ${Math.round(confidence * 100)}% - Consider rephrasing for better suggestions`);
    }
    
    // Contact-based hints
    if (contactProfile?.trustLevel && contactProfile.trustLevel > 80) {
      hints.push(`High trust contact (${contactProfile.trustLevel}%) - Auto-send available`);
    }
    
    // Extraction insights
    if (extraction.people && extraction.people.length > 3) {
      hints.push(`${extraction.people.length} participants detected - Consider group reply options`);
    }
    
    if (extraction.urgency === 'high') {
      hints.push('High urgency detected - Priority response templates available');
    }
    
    if (extraction.dates_times && extraction.dates_times.length > 1) {
      hints.push(`${extraction.dates_times.length} time references found - Calendar integration recommended`);
    }
    
    return hints;
  }

  /**
   * Rank and filter suggestions based on context and relevance
   */
  private static rankAndFilterSuggestions(
    suggestions: ActionSuggestion[],
    _context: SuggestionContext
  ): ActionSuggestion[] {
    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    );
    
    // Sort by category priority and confidence
    const categoryPriority = { primary: 4, secondary: 3, contextual: 2, cross_module: 1 };
    
    return uniqueSuggestions.sort((a, b) => {
      // First sort by category
      const categoryDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (categoryDiff !== 0) return categoryDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    });
  }

  /**
   * Identify the primary action based on confidence and context
   */
  private static identifyPrimaryAction(
    suggestions: ActionSuggestion[],
    _context: SuggestionContext
  ): ActionSuggestion | undefined {
    const primarySuggestions = suggestions.filter(s => s.category === 'primary');
    
    if (primarySuggestions.length > 0) {
      return primarySuggestions[0]; // Highest confidence primary action
    }
    
    // Fallback to highest confidence suggestion
    return suggestions[0];
  }

  /**
   * Generate reasoning explanation for suggestions
   */
  private static generateReasoning(
    context: SuggestionContext, 
    suggestions: ActionSuggestion[]
  ): string {
    const { intent, confidence, extraction } = context;
    
    let reasoning = `Detected "${intent}" intent with ${Math.round(confidence * 100)}% confidence. `;
    
    if (extraction.urgency === 'high') {
      reasoning += 'High urgency detected, prioritizing immediate response options. ';
    }
    
    if (extraction.people && extraction.people.length > 0) {
      reasoning += `Found ${extraction.people.length} participants, suggesting collaborative actions. `;
    }
    
    if (suggestions.some(s => s.category === 'cross_module')) {
      reasoning += 'Cross-module opportunities identified based on topic analysis. ';
    }
    
    return reasoning.trim();
  }

  /**
   * Fallback suggestions when pipeline fails
   */
  private static getFallbackSuggestions(intent: string): ActionSuggestion[] {
    const fallbackMap: { [key: string]: ActionSuggestion[] } = {
      reply: [{
        id: 'fallback_reply',
        label: 'Generate Reply',
        icon: '↩️',
        description: 'Basic reply generation',
        confidence: 0.5,
        category: 'primary',
        action: 'generate_basic_reply',
        tooltip: 'Simple reply template'
      }],
      summarize: [{
        id: 'fallback_summarize',
        label: 'Summarize',
        icon: '📋',
        description: 'Create summary',
        confidence: 0.5,
        category: 'primary',
        action: 'basic_summarize',
        tooltip: 'Basic text summarization'
      }],
      translate: [{
        id: 'fallback_translate',
        label: 'Translate',
        icon: '🌐',
        description: 'Language translation',
        confidence: 0.5,
        category: 'primary',
        action: 'basic_translate',
        tooltip: 'Basic translation service'
      }]
    };
    
    return fallbackMap[intent] || [{
      id: 'fallback_general',
      label: 'Process Request',
      icon: '⚙️',
      description: 'General processing',
      confidence: 0.3,
      category: 'primary',
      action: 'general_process',
      tooltip: 'General AI assistance'
    }];
  }

  // Helper methods
  private static getTargetLanguage(context: SuggestionContext): string {
    const { extraction, userProfile } = context;
    
    if (extraction.language !== 'en' && userProfile?.primaryLanguage === 'en') {
      return 'English';
    } else if (extraction.language === 'en' && userProfile?.primaryLanguage !== 'en') {
      return userProfile?.primaryLanguage || 'Spanish';
    }
    
    return 'target language';
  }

  private static getToneForContact(contactProfile: SuggestionContext['contactProfile'], defaultTone: string): string {
    if (contactProfile && contactProfile.trustLevel > 80 && contactProfile.responseTimeAvg && contactProfile.responseTimeAvg < 2) {
      return 'casual'; // Close, responsive contact
    } else if (contactProfile && contactProfile.trustLevel < 50) {
      return 'formal'; // Unknown or less trusted contact
    }
    
    return defaultTone; // Keep default
  }
}
