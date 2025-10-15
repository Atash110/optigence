'use client';

import React, { useEffect, useState } from 'react';
import { useLiveSuggestions, buildSuggestionContext } from '@/hooks/useLiveSuggestions';
import { ActionSuggestion, SuggestionContext } from '@/lib/optimail/live-suggestions';

interface LiveSuggestionsProps {
  userInput: string;
  intent: string;
  confidence: number;
  onSuggestionClick: (suggestion: ActionSuggestion) => void;
  userProfile?: SuggestionContext['userProfile'];
  contactProfile?: SuggestionContext['contactProfile'];
  threadContext?: SuggestionContext['threadContext'];
  calendarContext?: SuggestionContext['calendarContext'];
  className?: string;
}

export function LiveSuggestions({
  userInput,
  intent,
  confidence,
  onSuggestionClick,
  userProfile,
  contactProfile,
  threadContext,
  calendarContext,
  className = ''
}: LiveSuggestionsProps) {
  const {
    primaryAction,
    contextualHints,
    reasoning,
    isLoading,
    error,
    processingTime,
    generateSuggestionsDebounced,
    executeSuggestion,
    getSuggestionsByCategory
  } = useLiveSuggestions({
    enabled: true,
    debounceMs: 500
  });

  const [showReasoning, setShowReasoning] = useState(false);

  // Generate suggestions when context changes
  useEffect(() => {
    if (userInput.trim().length > 3 && intent && confidence > 0.3) {
      const context = buildSuggestionContext(userInput, intent, confidence, {
        userProfile,
        contactProfile,
        threadContext,
        calendarContext
      });
      generateSuggestionsDebounced(context);
    }
  }, [userInput, intent, confidence, userProfile, contactProfile, threadContext, calendarContext, generateSuggestionsDebounced]);

  const handleSuggestionClick = async (suggestion: ActionSuggestion) => {
    try {
      // Execute the suggestion action
      await executeSuggestion(suggestion);
      // Notify parent component
      onSuggestionClick(suggestion);
    } catch (error) {
      console.error('Failed to execute suggestion:', error);
    }
  };

  const primarySuggestions = getSuggestionsByCategory('primary');
  const secondarySuggestions = getSuggestionsByCategory('secondary');
  const contextualSuggestions = getSuggestionsByCategory('contextual');
  const crossModuleSuggestions = getSuggestionsByCategory('cross_module');

  return (
    <div className={`live-suggestions ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Analyzing context...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-700 text-sm">Failed to generate suggestions: {error}</span>
          </div>
        </div>
      )}

      {/* Primary Action - Highlighted */}
      {primaryAction && !isLoading && (
        <div className="mb-4">
          <button
            onClick={() => handleSuggestionClick(primaryAction)}
            className={`
              w-full flex items-center justify-between gap-3 p-4 rounded-lg border-2
              ${primaryAction.confidence > 0.8 ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}
              hover:shadow-md transition-all duration-200
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{primaryAction.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-gray-800">{primaryAction.label}</div>
                <div className="text-sm text-gray-600">{primaryAction.description}</div>
                {primaryAction.estimatedTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Est. {primaryAction.estimatedTime}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`
                text-sm px-2 py-1 rounded-full
                ${primaryAction.confidence > 0.8 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'}
              `}>
                {Math.round(primaryAction.confidence * 100)}%
              </div>
              {primaryAction.requiresConfirmation && (
                <div className="text-xs text-orange-600 mt-1">Confirm</div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Primary Suggestions */}
      {primarySuggestions.length > 0 && !primaryAction && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {primarySuggestions.map((suggestion) => (
              <SuggestionChip
                key={suggestion.id}
                suggestion={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                variant="primary"
              />
            ))}
          </div>
        </div>
      )}

      {/* Secondary & Contextual Suggestions */}
      {(secondarySuggestions.length > 0 || contextualSuggestions.length > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">More Options</h4>
          <div className="flex flex-wrap gap-2">
            {[...secondarySuggestions, ...contextualSuggestions].map((suggestion) => (
              <SuggestionChip
                key={suggestion.id}
                suggestion={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                variant="secondary"
              />
            ))}
          </div>
        </div>
      )}

      {/* Cross-Module Routing */}
      {crossModuleSuggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Switch to Other Tools</h4>
          <div className="flex flex-wrap gap-2">
            {crossModuleSuggestions.map((suggestion) => (
              <SuggestionChip
                key={suggestion.id}
                suggestion={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                variant="cross-module"
              />
            ))}
          </div>
        </div>
      )}

      {/* Contextual Hints */}
      {contextualHints.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {contextualHints.slice(0, 2).map((hint, index) => (
              <div
                key={index}
                className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200"
              >
                💡 {hint}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning Toggle */}
      {reasoning && (
        <div className="text-xs text-gray-500">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <span>Why these suggestions?</span>
            <span className={`transition-transform ${showReasoning ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showReasoning && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <p>{reasoning}</p>
              {processingTime && (
                <p className="text-gray-400 mt-1">Generated in {processingTime}ms</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual suggestion chip component
interface SuggestionChipProps {
  suggestion: ActionSuggestion;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'cross-module';
}

function SuggestionChip({ suggestion, onClick, variant }: SuggestionChipProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'secondary':
        return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
      case 'cross-module':
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <button
      onClick={onClick}
      title={suggestion.tooltip}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
        transition-all duration-200 hover:shadow-sm
        ${getVariantStyles()}
      `}
    >
      <span>{suggestion.icon}</span>
      <span>{suggestion.label}</span>
      {suggestion.confidence > 0.9 && (
        <span className="text-xs opacity-75">✨</span>
      )}
    </button>
  );
}

export default LiveSuggestions;
