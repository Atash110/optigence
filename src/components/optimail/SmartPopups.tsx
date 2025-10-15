import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Check, Clock, Zap } from 'lucide-react';

interface SmartSuggestion {
  id: string;
  type: 'intent' | 'template' | 'tone' | 'recipient' | 'schedule' | 'action';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
  dismissable: boolean;
}

interface SmartPopupsProps {
  input: string;
  isDarkMode: boolean;
  onSuggestionApply: (suggestion: SmartSuggestion) => void;
  isVisible: boolean;
}

const SmartPopups: React.FC<SmartPopupsProps> = ({
  input,
  isDarkMode,
  onSuggestionApply,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Generate smart suggestions based on input
  useEffect(() => {
    if (!input.trim() || !isVisible) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: SmartSuggestion[] = [];
    const text = input.toLowerCase();

    // Intent detection suggestions
    if (text.includes('meeting') || text.includes('schedule')) {
      newSuggestions.push({
        id: 'schedule-meeting',
        type: 'schedule',
        title: 'Schedule Meeting',
        description: 'I can help you find available time slots',
        confidence: 0.85,
        action: () => {
          // This will be handled by the parent component
        },
        dismissable: true
      });
    }

    if (text.includes('follow up') || text.includes('followup')) {
      newSuggestions.push({
        id: 'followup-template',
        type: 'template',
        title: 'Use Follow-up Template',
        description: 'Apply a professional follow-up template',
        confidence: 0.90,
        action: () => {
          // Template application logic
        },
        dismissable: true
      });
    }

    if (text.includes('thank you') || text.includes('thanks')) {
      newSuggestions.push({
        id: 'gratitude-tone',
        type: 'tone',
        title: 'Grateful Tone Detected',
        description: 'This email expresses gratitude well',
        confidence: 0.88,
        action: () => {},
        dismissable: true
      });
    }

    if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
      newSuggestions.push({
        id: 'urgent-formatting',
        type: 'action',
        title: 'Mark as Urgent',
        description: 'Add priority formatting for urgent emails',
        confidence: 0.92,
        action: () => {
          // Add urgent formatting
        },
        dismissable: true
      });
    }

    if (text.includes('@') && text.includes('.com')) {
      const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
      if (emails && emails.length > 1) {
        newSuggestions.push({
          id: 'multiple-recipients',
          type: 'recipient',
          title: 'Multiple Recipients Detected',
          description: `Found ${emails.length} email addresses`,
          confidence: 0.95,
          action: () => {
            // Recipient management
          },
          dismissable: true
        });
      }
    }

    // Job posting detection
    if ((text.includes('job') || text.includes('position')) && 
        (text.includes('apply') || text.includes('hiring'))) {
      newSuggestions.push({
        id: 'job-posting',
        type: 'action',
        title: 'Job Posting Detected',
        description: 'Send to OptiHire for job management',
        confidence: 0.87,
        action: () => {
          // Cross-module action
        },
        dismissable: true
      });
    }

    // Travel booking detection
    if (text.includes('flight') || text.includes('hotel') || text.includes('booking')) {
      newSuggestions.push({
        id: 'travel-booking',
        type: 'action',
        title: 'Travel Booking Detected',
        description: 'Send to OptiTrip for travel planning',
        confidence: 0.83,
        action: () => {
          // Cross-module action
        },
        dismissable: true
      });
    }

    // Filter out dismissed suggestions
    const filteredSuggestions = newSuggestions.filter(s => !dismissedIds.has(s.id));
    setSuggestions(filteredSuggestions.slice(0, 3)); // Show max 3 suggestions

  }, [input, isVisible, dismissedIds]);

  const applySuggestion = (suggestion: SmartSuggestion) => {
    onSuggestionApply(suggestion);
    setDismissedIds(prev => new Set([...prev, suggestion.id]));
  };

  const dismissSuggestion = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Clock size={16} />;
      case 'action': return <Zap size={16} />;
      case 'template': return <Lightbulb size={16} />;
      default: return <Lightbulb size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'schedule': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'action': return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'template': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
      case 'tone': return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'recipient': return isDarkMode ? 'text-pink-400' : 'text-pink-600';
      default: return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence>
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
            className={`max-w-sm p-4 rounded-lg border shadow-lg ${
              isDarkMode
                ? 'bg-optimail-navy border-optimail-bright-blue/20 shadow-black/20'
                : 'bg-white border-gray-200 shadow-gray-200'
            }`}
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 ${getTypeColor(suggestion.type)}`}>
                {getTypeIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-medium text-sm ${
                    isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                  }`}>
                    {suggestion.title}
                  </h4>
                  
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      suggestion.confidence >= 0.9
                        ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        : suggestion.confidence >= 0.8
                        ? isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                        : isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
                }`}>
                  {suggestion.description}
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-optimail-bright-blue text-optimail-navy hover:bg-optimail-bright-blue/80'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Check size={12} />
                    Apply
                  </button>
                  
                  {suggestion.dismissable && (
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                        isDarkMode
                          ? 'text-optimail-muted hover:bg-optimail-navy-light hover:text-optimail-light'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      <X size={12} />
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartPopups;
