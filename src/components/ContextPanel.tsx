import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Users, 
  MessageCircle, 
  Lightbulb, 
  History,
  Settings,
  TrendingUp
} from 'lucide-react';
import { ContextWindow, EmailHistory } from '@/lib/memory';

interface ContextPanelProps {
  isDarkMode: boolean;
  userId?: string;
  currentInput?: string;
  onContextUpdate?: (context: ContextWindow) => void;
}

const ContextPanel: React.FC<ContextPanelProps> = ({ 
  isDarkMode, 
  userId = 'demo-user',
  currentInput = '',
  onContextUpdate 
}) => {
  const [contextWindow, setContextWindow] = useState<ContextWindow | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [suggestions, setSuggestions] = useState<{
    suggestedTone?: string;
    suggestedRecipients?: string[];
    templateSuggestion?: string;
    contextHints?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'context' | 'history' | 'suggestions'>('context');

  // Load context window on mount and input change
  const loadContextWindow = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/optimail/memory?userId=${userId}&action=context`);
      const context = await response.json();
      
      setContextWindow(context);
      if (onContextUpdate) {
        onContextUpdate(context);
      }

      // Also load recent history
      const historyResponse = await fetch(`/api/optimail/memory?userId=${userId}&action=history&limit=5`);
      const historyData = await historyResponse.json();
      setEmailHistory(historyData.history || []);

    } catch (error) {
      console.error('Failed to load context:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onContextUpdate]);

  const loadSuggestions = React.useCallback(async (input: string) => {
    try {
      const response = await fetch(`/api/optimail/memory?userId=${userId}&action=suggestions&input=${encodeURIComponent(input)}`);
      const suggestionData = await response.json();
      setSuggestions(suggestionData);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadContextWindow();
  }, [loadContextWindow]);

  useEffect(() => {
    if (currentInput.length > 3) {
      loadSuggestions(currentInput);
    }
  }, [currentInput, loadSuggestions]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      default: return '⏰';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain size={20} className={isDarkMode ? 'text-optimail-bright-blue' : 'text-blue-500'} />
          </motion.div>
          <h3 className={`text-lg font-medium ${
            isDarkMode ? 'text-optimail-light' : 'text-gray-900'
          }`}>
            Loading Context...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Brain size={20} className={isDarkMode ? 'text-optimail-bright-blue' : 'text-blue-500'} />
        <h3 className={`text-lg font-medium ${
          isDarkMode ? 'text-optimail-light' : 'text-gray-900'
        }`}>
          Intelligence Context
        </h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6">
        {[
          { key: 'context', label: 'Context', icon: Brain },
          { key: 'history', label: 'History', icon: History },
          { key: 'suggestions', label: 'Insights', icon: Lightbulb }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === key
                ? isDarkMode
                  ? 'bg-optimail-bright-blue text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'text-optimail-muted hover:bg-optimail-navy-light/40'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'context' && contextWindow && (
          <motion.div
            key="context"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Temporal Context */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-optimail-navy-light/30' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} />
                <h4 className={`font-medium ${
                  isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                }`}>
                  Current Context
                </h4>
              </div>
              <div className={`text-sm space-y-2 ${
                isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
              }`}>
                <p className="flex items-center gap-2">
                  <span>{getTimeIcon(contextWindow.temporal_context.time_of_day)}</span>
                  <span className="capitalize">{contextWindow.temporal_context.time_of_day}</span>
                  <span className="text-xs opacity-70">• {contextWindow.temporal_context.day_of_week}</span>
                </p>
                {contextWindow.temporal_context.is_weekend && (
                  <p className="text-amber-500 text-xs">🏖️ Weekend context active</p>
                )}
              </div>
            </div>

            {/* User Preferences */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-optimail-navy-light/30' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Settings size={16} />
                <h4 className={`font-medium ${
                  isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                }`}>
                  Preferences
                </h4>
              </div>
              <div className={`text-sm space-y-1 ${
                isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
              }`}>
                <p>Tone: <span className="capitalize font-medium">{contextWindow.user_preferences.preferred_tone}</span></p>
                <p>Language: <span className="font-medium">{contextWindow.user_preferences.language}</span></p>
                <p>Voice: <span className="font-medium capitalize">{contextWindow.user_preferences.voice_provider}</span></p>
              </div>
            </div>

            {/* Active Contacts */}
            {contextWindow.current_contacts.length > 0 && (
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-optimail-navy-light/30' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} />
                  <h4 className={`font-medium ${
                    isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                  }`}>
                    Recent Contacts
                  </h4>
                </div>
                <div className="space-y-2">
                  {contextWindow.current_contacts.slice(0, 3).map((contact, index) => (
                    <div key={index} className={`text-sm ${
                      isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
                    }`}>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs opacity-70">{contact.email} • {contact.relationship}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {emailHistory.length > 0 ? (
              emailHistory.map((email, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-optimail-navy-light/20 border-optimail-bright-blue/20' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} />
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                      }`}>
                        {email.intent}
                      </span>
                    </div>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-optimail-muted' : 'text-gray-500'
                    }`}>
                      {formatTimeAgo(email.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${
                    isDarkMode ? 'text-optimail-muted' : 'text-gray-600'
                  }`}>
                    &ldquo;{email.original_input.slice(0, 80)}...&rdquo;
                  </p>
                  {email.recipient && (
                    <p className={`text-xs ${
                      isDarkMode ? 'text-optimail-muted' : 'text-gray-500'
                    }`}>
                      To: {email.recipient}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-optimail-muted' : 'text-gray-500'
              }`}>
                <History size={32} className="mx-auto mb-2 opacity-50" />
                <p>No email history yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'suggestions' && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {suggestions && suggestions.contextHints && suggestions.contextHints.length > 0 ? (
              <>
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-optimail-navy-light/30' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-yellow-500" />
                    <h4 className={`font-medium ${
                      isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                    }`}>
                      Smart Suggestions
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {suggestions.contextHints.map((hint: string, index: number) => (
                      <div key={index} className={`text-sm p-2 rounded border-l-2 border-yellow-500 ${
                        isDarkMode ? 'bg-optimail-navy-light/20 text-optimail-muted' : 'bg-yellow-50 text-gray-700'
                      }`}>
                        {hint}
                      </div>
                    ))}
                  </div>
                </div>

                {suggestions.suggestedTone && (
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-optimail-navy-light/20' : 'bg-blue-50'
                  }`}>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-optimail-light' : 'text-gray-800'
                    }`}>
                      💡 Suggested tone: <span className="font-medium capitalize">{suggestions.suggestedTone}</span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-optimail-muted' : 'text-gray-500'
              }`}>
                <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                <p>Start typing to see AI insights</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextPanel;
