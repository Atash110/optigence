import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  BookmarkIcon,
  LanguageIcon,
  MapIcon,
  ShoppingBagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface SuggestionPopupProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isProcessing?: boolean;
}

const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ 
  suggestions, 
  onSuggestionClick, 
  isProcessing = false 
}) => {
  const getIcon = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('reply') || lowerSuggestion.includes('response')) {
      return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('summarize') || lowerSuggestion.includes('summary')) {
      return <DocumentTextIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('calendar') || lowerSuggestion.includes('meeting') || lowerSuggestion.includes('schedule')) {
      return <CalendarIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('template')) {
      return <BookmarkIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('translate')) {
      return <LanguageIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('optitrip') || lowerSuggestion.includes('travel')) {
      return <MapIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('optishop') || lowerSuggestion.includes('shopping') || lowerSuggestion.includes('product')) {
      return <ShoppingBagIcon className="h-4 w-4" />;
    }
    if (lowerSuggestion.includes('ai') || lowerSuggestion.includes('assistance')) {
      return <SparklesIcon className="h-4 w-4" />;
    }
    
    return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
  };

  const getButtonColor = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('optitrip') || lowerSuggestion.includes('travel')) {
      return 'border-green-600 hover:bg-green-900/20';
    }
    if (lowerSuggestion.includes('optishop') || lowerSuggestion.includes('shopping')) {
      return 'border-purple-600 hover:bg-purple-900/20';
    }
    if (lowerSuggestion.includes('calendar') || lowerSuggestion.includes('meeting')) {
      return 'border-yellow-600 hover:bg-yellow-900/20';
    }
    
    return 'border-gray-600 hover:bg-gray-700';
  };

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      className="absolute bottom-full left-0 right-0 mb-4 z-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">
            {isProcessing ? 'Analyzing...' : 'AI Suggestions'}
          </h3>
          {isProcessing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <motion.button
              key={suggestion}
              onClick={() => !isProcessing && onSuggestionClick(suggestion)}
              disabled={isProcessing}
              className={`flex items-center space-x-2 p-3 rounded-lg bg-gray-800 border transition-all text-left ${
                isProcessing 
                  ? 'opacity-50 cursor-not-allowed border-gray-700' 
                  : getButtonColor(suggestion)
              }`}
              whileHover={!isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isProcessing ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="text-[#3B82F6] flex-shrink-0">{getIcon(suggestion)}</span>
              <span className="text-sm text-white truncate">{suggestion}</span>
            </motion.button>
          ))}
        </div>
        
        {suggestions.length > 6 && !isProcessing && (
          <div className="mt-3 text-center">
            <button className="text-xs text-gray-400 hover:text-gray-300">
              +{suggestions.length - 6} more suggestions
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SuggestionPopup;
