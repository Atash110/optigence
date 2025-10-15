import { useState, useCallback, useEffect } from 'react';
import { ActionSuggestion, SuggestionPipelineResult, SuggestionContext } from '@/lib/optimail/live-suggestions';

export interface UseLiveSuggestionsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  debounceMs?: number;
}

export interface LiveSuggestionsState {
  suggestions: ActionSuggestion[];
  primaryAction?: ActionSuggestion;
  contextualHints: string[];
  reasoning: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  processingTime?: number;
}

export function useLiveSuggestions(options: UseLiveSuggestionsOptions = {}) {
  const {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    debounceMs = 500
  } = options;

  const [state, setState] = useState<LiveSuggestionsState>({
    suggestions: [],
    contextualHints: [],
    reasoning: '',
    isLoading: false,
    error: null
  });

  const [, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Generate live suggestions based on context
   */
  const generateSuggestions = useCallback(async (context: Partial<SuggestionContext>) => {
    if (!enabled || !context.userInput || !context.intent) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/suggestions/live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput: context.userInput,
          intent: context.intent,
          confidence: context.confidence || 0.8,
          extraction: context.extraction,
          userProfile: context.userProfile,
          contactProfile: context.contactProfile,
          threadContext: context.threadContext,
          calendarContext: context.calendarContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: SuggestionPipelineResult & { 
        metadata?: {
          requestId: string;
          timestamp: string;
          totalProcessingTime: number;
          context: Record<string, unknown>;
        }
      } = await response.json();

      setState(prev => ({
        ...prev,
        suggestions: result.suggestions,
        primaryAction: result.primaryAction,
        contextualHints: result.contextualHints,
        reasoning: result.reasoning,
        isLoading: false,
        lastUpdated: new Date(),
        processingTime: result.processingTimeMs
      }));

      return result;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, [enabled]);

  /**
   * Generate suggestions with debouncing
   */
  const generateSuggestionsDebounced = useCallback((context: Partial<SuggestionContext>) => {
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }

      const timer = setTimeout(() => {
        generateSuggestions(context);
      }, debounceMs);

      return timer;
    });
  }, [generateSuggestions, debounceMs]);

  /**
   * Execute a suggestion action
   */
  const executeSuggestion = useCallback(async (suggestion: ActionSuggestion) => {
    try {
      // Route to appropriate action handler based on suggestion.action
      switch (suggestion.action) {
        case 'generate_reply':
          return await fetch('/api/draft/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suggestion.parameters)
          });
          
        case 'summarize_conversation':
          return await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suggestion.parameters)
          });
          
        case 'translate_message':
          return await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suggestion.parameters)
          });
          
        case 'create_calendar_event':
          return await fetch('/api/calendar/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suggestion.parameters)
          });
          
        case 'route_to_optitrip':
          window.location.href = `/optitrip?prefilled=true&query=${encodeURIComponent(JSON.stringify(suggestion.parameters))}`;
          break;
          
        case 'route_to_optishop':
          window.location.href = `/optishop?prefilled=true&query=${encodeURIComponent(JSON.stringify(suggestion.parameters))}`;
          break;
          
        case 'route_to_optihire':
          window.location.href = `/optihire?prefilled=true&query=${encodeURIComponent(JSON.stringify(suggestion.parameters))}`;
          break;
          
        default:
          console.warn(`Unhandled suggestion action: ${suggestion.action}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to execute suggestion ${suggestion.id}:`, error);
      throw error;
    }
  }, []);

  /**
   * Clear current suggestions
   */
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      primaryAction: undefined,
      contextualHints: [],
      reasoning: '',
      error: null
    }));
  }, []);

  /**
   * Refresh suggestions with the last context
   */
  const refreshSuggestions = useCallback((lastContext?: Partial<SuggestionContext>) => {
    if (lastContext) {
      generateSuggestions(lastContext);
    }
  }, [generateSuggestions]);

  // Auto-refresh suggestions if enabled
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(() => {
      // Only auto-refresh if we have existing suggestions
      if (state.suggestions.length > 0) {
        // We would need to store the last context to refresh
        // For now, just log that auto-refresh is attempted
        console.log('Auto-refresh attempted - requires last context');
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, state.suggestions.length]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      setDebounceTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    generateSuggestions,
    generateSuggestionsDebounced,
    executeSuggestion,
    clearSuggestions,
    refreshSuggestions,
    
    // Computed
    hasSuggestions: state.suggestions.length > 0,
    hasError: !!state.error,
    isEnabled: enabled,
    
    // Utilities
    getSuggestionsByCategory: (category: ActionSuggestion['category']) =>
      state.suggestions.filter(s => s.category === category),
    getSuggestionById: (id: string) =>
      state.suggestions.find(s => s.id === id),
    getHighConfidenceSuggestions: (threshold: number = 0.8) =>
      state.suggestions.filter(s => s.confidence >= threshold)
  };
}

// Utility function to build suggestion context from OptiMail interface state
export function buildSuggestionContext(
  userInput: string,
  intent: string,
  confidence: number,
  additionalContext?: {
    extraction?: SuggestionContext['extraction'];
    userProfile?: SuggestionContext['userProfile'];
    contactProfile?: SuggestionContext['contactProfile'];
    threadContext?: SuggestionContext['threadContext'];
    calendarContext?: SuggestionContext['calendarContext'];
  }
): SuggestionContext {
  return {
    userInput,
    intent,
    confidence,
    extraction: additionalContext?.extraction || {
      ask: userInput,
      sentiment: 'neutral',
      urgency: 'medium',
      topics: userInput.toLowerCase().split(/\s+/).filter(word => word.length > 3),
      language: 'en'
    },
    userProfile: additionalContext?.userProfile,
    contactProfile: additionalContext?.contactProfile,
    threadContext: additionalContext?.threadContext,
    calendarContext: additionalContext?.calendarContext
  };
}
