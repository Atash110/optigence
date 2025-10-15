'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  MoonIcon, 
  SunIcon,
  LanguageIcon,
  CalendarDaysIcon,
  XMarkIcon,
  InformationCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

// Import components
import MatrixChatBar from './MatrixChatBar2';
import SuggestionChips from './SuggestionChips';
import ContextDrawer from './ContextDrawer';
import SendCountdownToast from './SendCountdownToast';
import WhyThisPopover from './WhyThisPopover';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import TeamCollaborationHub from './TeamCollaborationHub';

// Import types
import { 
  ActionSuggestion, 
  SmartReplyOption, 
  EmailTemplate, 
  FloatingCard, 
  UserPreferences
} from '../../types/optimail';

// Import utilities
import { routeIntent } from '../../lib/optimail/intent-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';

// SpeechRecognition types (limited browser support)
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { isFinal: boolean; 0: { transcript: string } }[];
}

const OptiMail2100: React.FC = () => {
  // Authentication and translation
  const { user } = useAuth();
  const { locale, setLocale } = useTranslation();

  // Navigation State - Phase 7 Enhancement
  const [activeTab, setActiveTab] = useState<'composer' | 'analytics' | 'collaboration'>('composer');

  // UI State
  const [darkMode, setDarkMode] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: number;
    meta?: Record<string, unknown>;
  }>>([]);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  const [replyOptions, setReplyOptions] = useState<SmartReplyOption[]>([]);
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [wav, setWav] = useState<Array<{id: string; h: number}>>([]);
  const [lastPastedEmail, setLastPastedEmail] = useState<string>('');

  // Cursor animation
  const typingChars = ['▋', '▊', '▉', '█', '▉', '▊'];
  const [cursor, setCursor] = useState(0);

  // User preferences (load from API or localStorage)
  const [userPrefs] = useState<UserPreferences>({
    language: locale || 'en',
    tone: 'professional',
    autoIncludeSignature: false
  });

  // Refs for cleanup
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const cursorTicker = useRef<NodeJS.Timeout | null>(null);

  // Load templates on mount
  useEffect(() => {
    // Load user templates from API
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/optimail/templates', {
          headers: { 'Authorization': `Bearer ${user?.email || ''}` }
        });
        if (response.ok) {
          const userTemplates = await response.json();
          setTemplates(userTemplates);
        }
      } catch (error) {
        console.warn('Failed to load templates:', error);
      }
    };
    
    if (user) {
      loadTemplates();
    }
  }, [user]);

  // Cursor animation
  useEffect(() => {
    cursorTicker.current = setInterval(() => {
      setCursor(c => (c + 1) % typingChars.length);
    }, 450);
    
    return () => {
      if (cursorTicker.current) clearInterval(cursorTicker.current);
    };
  }, [typingChars.length]);

  // Utility functions
  const removeCard = useCallback((id: string) => {
    setCards(c => c.filter(card => card.id !== id));
  }, []);

  const upsertCard = useCallback((card: FloatingCard) => {
    setCards(c => {
      const existing = c.findIndex(x => x.id === card.id);
      if (existing >= 0) {
        const updated = [...c];
        updated[existing] = card;
        return updated;
      }
      return [...c, card];
    });
  }, []);

  const pushMessage = useCallback((role: 'user' | 'assistant' | 'system', content: string, meta?: Record<string, unknown>) => {
    setMessages(m => [...m, { 
      id: `${Date.now()}-${role}-${Math.random()}`, 
      role, 
      content, 
      createdAt: Date.now(), 
      meta 
    }]);
  }, []);

  const handleAutoSend = useCallback(() => {
    if (replyOptions.length > 0) {
      pushMessage('assistant', replyOptions[0].body, { autoSent: true });
      setReplyOptions([]);
    }
    setAutoSendCountdown(null);
  }, [replyOptions, pushMessage]);

  const cancelAutoSend = useCallback(() => {
    setAutoSendCountdown(null);
    if (countdownRef.current) clearTimeout(countdownRef.current);
  }, []);

  // Auto-send countdown logic
  useEffect(() => {
    if (autoSendCountdown === null) return;
    
    if (autoSendCountdown === 0) {
      handleAutoSend();
      return;
    }

    countdownRef.current = setTimeout(() => {
      setAutoSendCountdown(autoSendCountdown - 1);
    }, 1000);

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [autoSendCountdown, handleAutoSend]);

  // Voice initialization and control
  const initializeVoice = useCallback(() => {
    const win = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return false;
    
    const sr = new SR();
    sr.lang = userPrefs.language || 'en-US';
    sr.continuous = false;
    sr.interimResults = true;
    
    sr.onstart = () => setListening(true);
    sr.onresult = (e: SpeechRecognitionEventLike) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          setInput(r[0].transcript);
        } else {
          interim += r[0].transcript;
          setInput(interim);
        }
      }
    };
    sr.onend = () => setListening(false);
    
    recognitionRef.current = sr;
    return true;
  }, [userPrefs.language]);

  const startVoice = useCallback(() => {
    if (!recognitionRef.current && !initializeVoice()) {
      console.warn('Speech recognition not supported');
      return;
    }
    recognitionRef.current?.start();
  }, [initializeVoice]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (listening) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [listening, startVoice, stopVoice]);

  // Waveform simulation for voice input
  useEffect(() => {
    if (!listening) {
      setWav([]);
      return;
    }
    
    const interval = setInterval(() => {
      setWav(Array.from({ length: 12 }, (_, i) => ({
        id: String(i),
        h: 4 + Math.random() * 40
      })));
    }, 180);

    return () => clearInterval(interval);
  }, [listening]);

  // Intent preview suggestions as user types
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setReplyOptions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const routing = routeIntent(input);
      setSuggestions(routing.actionSuggestions.slice(0, 5));
      
      // Show thinking card for long emails
      if (routing.detected.intent === 'reply' && input.length > 200) {
        upsertCard({ 
          id: 'reply-hint', 
          type: 'thinking', 
          content: 'Analyzing email thread for context and smart replies…' 
        });
      } else {
        removeCard('reply-hint');
      }
    }, 300); // Debounce to avoid too many calls

    return () => clearTimeout(timeoutId);
  }, [input, removeCard, upsertCard]);

  // Simulate human-like typing
  const simulateTyping = useCallback((text: string) => {
    const words = text.split(' ');
    let currentText = '';
    let wordIndex = 0;

    const typeWord = () => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        
        // Update the message with current progress
        setMessages(m => {
          const last = m[m.length - 1];
          if (last && last.role === 'assistant' && last.meta?.typing) {
            const updated = [...m];
            updated[updated.length - 1] = { ...last, content: currentText };
            return updated;
          }
          return [...m, {
            id: `typing-${Date.now()}`,
            role: 'assistant',
            content: currentText,
            createdAt: Date.now(),
            meta: { typing: true }
          }];
        });

        wordIndex++;
        
        // Human-like timing: 280-360 CPM with occasional pauses
        const baseDelay = 60000 / 320; // 320 characters per minute base
        const variance = Math.random() * 100 - 50; // ±50ms variance
        const isPause = Math.random() < 0.1; // 10% chance of brief pause
        const delay = baseDelay + variance + (isPause ? 200 : 0);

        setTimeout(typeWord, delay);
      } else {
        // Finish typing, remove typing flag
        setMessages(m => {
          const updated = [...m];
          const last = updated[updated.length - 1];
          if (last && last.meta?.typing) {
            updated[updated.length - 1] = { ...last, meta: { ...last.meta, typing: false } };
          }
          return updated;
        });
      }
    };

    typeWord();
  }, []);

  // Main agent interaction
  const runAgent = useCallback(async (forcedIntent?: string) => {
    const text = input.trim();
    if (!text) return;

    pushMessage('user', text);
    setThinking(true);
    setInput(''); // Clear input immediately for better UX
    
    upsertCard({ 
      id: 'thinking', 
      type: 'thinking', 
      content: 'Processing your request with AI models...' 
    });

    try {
      const requestBody = {
        input: text,
        forcedIntent,
        preferences: userPrefs
      };

      const response = await fetch('/api/optimail/agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Agent request failed');
      }

      removeCard('thinking');
      setThinking(false);

      // Handle response data
      if (data.replyOptions && data.replyOptions.length > 0) {
        setReplyOptions(data.replyOptions);
        upsertCard({ 
          id: 'reply-options', 
          type: 'reply', 
          content: `${data.replyOptions.length} smart reply options generated`,
          meta: { count: data.replyOptions.length }
        });

        // Check for auto-send
        if (data.autoSend && data.autoSend.confidence >= 0.95) {
          setAutoSendCountdown(data.autoSend.countdownSeconds || 3);
        }
      }

      if (data.calendar) {
        upsertCard({ 
          id: 'calendar', 
          type: 'calendar', 
          content: `Meeting suggested: ${data.calendar.title} (${data.calendar.durationMinutes}min)`,
          meta: data.calendar
        });
      }

      if (data.actionSuggestions && data.actionSuggestions.length > 0) {
        setSuggestions(data.actionSuggestions.slice(0, 6));
      }

      if (data.finalText) {
        // Simulate typing effect
        simulateTyping(data.finalText);
      } else if (!data.replyOptions || data.replyOptions.length === 0) {
        pushMessage('assistant', 'I\'ve prepared contextual suggestions above. How would you like to proceed?');
      }

      // Open context drawer if we have useful context
      if (data.calendar || (data.templates && data.templates.length > 0)) {
        setDrawerOpen(true);
      }

    } catch (error) {
      console.error('Agent error:', error);
      setThinking(false);
      removeCard('thinking');
      pushMessage('assistant', 'I encountered an error processing your request. Please try again.');
    }
  }, [input, userPrefs, user, pushMessage, upsertCard, removeCard, simulateTyping]);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: ActionSuggestion) => {
    if (suggestion.intent.startsWith('cross.')) {
      // Handle cross-module routing
      const targetModule = suggestion.intent.split('.')[1];
      window.open(`/${targetModule}`, '_blank'); // Open in new tab
      return;
    }

    // Run agent with forced intent
    runAgent(suggestion.intent);
  }, [runAgent]);

  // Handle reply option selection
  const handleReplySelect = useCallback((reply: SmartReplyOption) => {
    pushMessage('assistant', reply.body, { selected: true, confidence: reply.score });
    setReplyOptions([]);
  }, [pushMessage]);

  // Email paste detection and quick actions
  const handleEmailPaste = useCallback(() => {
    if (input.length > 200) {
      // Store the pasted email content
      setLastPastedEmail(input);
      
      // Auto-detect as email and show quick action chips
      const emailSuggestions: ActionSuggestion[] = [
        { id: 'reply-email', text: 'Reply', intent: 'reply', icon: '↩️', priority: 95 },
        { id: 'summarize-email', text: 'Summarize', intent: 'summarize', icon: '📝', priority: 90 },
        { id: 'translate-email', text: 'Translate', intent: 'translate', icon: '🌐', priority: 85 },
        { id: 'schedule-meeting', text: 'Schedule Meeting', intent: 'schedule', icon: '📅', priority: 80 }
      ];
      setSuggestions(emailSuggestions);
      setDrawerOpen(true); // Open context drawer for email analysis
    }
  }, [input]);

  const handleSettingsOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  return (
    <div className={`relative min-h-screen font-[Geist] text-gray-100 overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0D1B2A]' : 'bg-gray-50'
    }`}>
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%)]" />

      {/* Header with Navigation - Phase 7 Enhancement */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <SparklesIcon className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-100">OptiMail</h1>
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold rounded-full">
              PHASE 7
            </span>
          </div>
          
          {/* Phase 7 Navigation Tabs */}
          <nav className="flex items-center space-x-1 ml-8">
            <button
              onClick={() => setActiveTab('composer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'composer' 
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
              Email Composer
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              AI Analytics
            </button>
            <button
              onClick={() => setActiveTab('collaboration')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'collaboration' 
                  ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              <UsersIcon className="w-4 h-4 inline mr-2" />
              Team Hub
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <button 
            onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            title="Toggle language"
          >
            <LanguageIcon className="w-5 h-5" />
          </button>
          
          {/* Theme toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* Context drawer toggle */}
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            title="Open context"
          >
            <CalendarDaysIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conditional Content Based on Active Tab - Phase 7 */}
      {activeTab === 'composer' && (
        <>
          {/* Messages stream */}
          <div className="max-w-4xl mx-auto pt-8 pb-48 px-6 space-y-6 relative z-10">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div 
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`max-w-2xl ${message.role === 'user' ? 'ml-auto' : ''}`}
            >
              <div className={`rounded-2xl px-6 py-4 shadow-sm backdrop-blur-md border transition-all text-sm leading-relaxed ${
                message.role === 'user' 
                  ? 'bg-blue-600/80 border-blue-500/50 text-white shadow-blue-600/25' 
                  : 'bg-white/8 border-white/10 text-gray-100'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {message.content}
                    {message.meta?.typing === true && (
                      <span className="animate-pulse">▌</span>
                    )}
                  </div>
                  
                  {/* Why this button for assistant messages */}
                  {message.role === 'assistant' && !message.meta?.typing && (
                    <button
                      onClick={() => setShowWhyThis(!showWhyThis)}
                      className="ml-3 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                      title="Why this suggestion?"
                    >
                      <InformationCircleIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-blue-300 flex items-center space-x-2 pl-2"
          >
            <SparklesIcon className="w-4 h-4 animate-pulse" />
            <span>AI synthesizing {typingChars[cursor]}</span>
          </motion.div>
        )}
      </div>

      {/* Floating cards */}
      <div className="pointer-events-none fixed inset-0 flex flex-col items-start justify-end gap-3 px-6 pb-40 z-20">
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="pointer-events-auto bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-lg max-w-sm w-full text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200 capitalize text-xs">
                  {card.type}
                </span>
                <button 
                  onClick={() => removeCard(card.id)}
                  className="text-xs text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-white/10"
                  title="Close"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                {card.content}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reply options */}
      <AnimatePresence>
        {replyOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-36 left-0 right-0 flex justify-center z-30"
          >
            <div className="flex gap-3 flex-wrap max-w-4xl px-6">
              {replyOptions.map((reply) => (
                <motion.button
                  key={reply.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleReplySelect(reply)}
                  className="bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs px-4 py-2 rounded-xl backdrop-blur-md hover:bg-blue-600/30 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{reply.label}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      reply.score >= 0.8 ? 'bg-green-400' : 
                      reply.score >= 0.6 ? 'bg-yellow-400' : 'bg-orange-400'
                    }`} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion chips */}
      <SuggestionChips
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Matrix Chat Bar */}
      <MatrixChatBar
        onSendMessage={async (message: string) => {
          setInput(message);
          await runAgent();
        }}
        onVoiceInput={(transcript: string) => {
          setInput(transcript);
        }}
        disabled={thinking}
        placeholder="Type your message or paste an email..."
      />

      {/* Context Drawer */}
      <ContextDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        threadSummary="Email thread context and analysis will appear here"
        calendarSlots={[
          { time: '10:00 AM - 11:00 AM', available: true },
          { time: '2:00 PM - 3:00 PM', available: true },
          { time: '4:00 PM - 5:00 PM', available: false }
        ]}
        templates={templates}
        recentReplies={replyOptions}
        emailContent={lastPastedEmail || input}
        contactContext={lastPastedEmail ? 'Interview candidate' : ''}
        onTemplateSelect={(template: EmailTemplate) => {
          setInput(template.content);
          setDrawerOpen(false);
        }}
        onReplySelect={handleReplySelect}
        onCalendarSlotSelect={(slot: string) => {
          console.log('Selected calendar slot:', slot);
          setDrawerOpen(false);
        }}
        onAutoSend={(email: string, delay: number) => {
          setAutoSendCountdown(delay);
          setInput(email);
          // Auto-send logic will be handled by the existing countdown system
        }}
      />

      {/* Auto-send countdown toast */}
      <SendCountdownToast
        countdown={autoSendCountdown}
        onSend={handleAutoSend}
        onCancel={cancelAutoSend}
        recipientName="Contact"
      />

      {/* Why this explanation popover */}
      <WhyThisPopover
        isOpen={showWhyThis}
        onClose={() => setShowWhyThis(false)}
        explanation="This suggestion was generated based on your communication patterns and the email context."
        sourceCues={[
          "Professional tone preference",
          "Calendar availability", 
          "Previous email interactions",
          "Thread context analysis"
        ]}
      />
        </>
      )}

      {/* Phase 7: Advanced Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="h-screen overflow-auto">
          <AdvancedAnalyticsDashboard 
            userId={user?.id || 'demo-user'}
            teamId={user?.id || 'default-team'}
            timeframe="last_30_days"
          />
        </div>
      )}

      {/* Phase 7: Team Collaboration Hub */}
      {activeTab === 'collaboration' && (
        <div className="h-screen overflow-auto">
          <TeamCollaborationHub 
            userId={user?.id || 'demo-user'}
            teamId={user?.id || 'demo-team'}
          />
        </div>
      )}
    </div>
  );
};

export default OptiMail2100;
