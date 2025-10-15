'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon,
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  MicrophoneIcon as MicrophoneIconSolid
} from '@heroicons/react/24/solid';

import { TypingEffect } from '../TypingEffect';
import { VoiceInput } from '../VoiceInput';
import { SuggestionPopup } from '../SuggestionPopup';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    confidence?: number;
    processingTime?: number;
  };
}

interface ConversationThread {
  id: string;
  subject: string;
  participants: string[];
  messages: Message[];
  lastActivity: Date;
  status: 'draft' | 'sent' | 'received';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  aiInsights?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: number;
    suggestedActions: string[];
    keyTopics: string[];
  };
}

interface AIAnalysis {
  confidence: number;
  suggestions: string[];
  toneAnalysis: {
    formality: number;
    emotion: string;
    clarity: number;
  };
  contextAwareness: {
    threadContinuity: boolean;
    relevantHistory: Message[];
    suggestedContext: string[];
  };
}

export const OptiMail2100: React.FC = () => {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Phase 7 Navigation State
  const [activeTab, setActiveTab] = useState<'composer' | 'analytics' | 'collaboration'>('composer');
  
  // Advanced features state
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contextHistory, setContextHistory] = useState<Message[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to OptiMail 2100 - Phase 7: Predictive Intelligence Ecosystem! 🚀

I'm your AI email companion with advanced predictive capabilities. Here's what's new:

**🔮 Predictive Analytics**
• Email success prediction before sending
• Optimal timing recommendations
• Recipient behavior analysis

**📊 Business Intelligence**
• Performance trend analysis
• Response rate optimization
• Strategic insights generation

**🎯 Smart Collaboration**
• Team performance analytics
• Context-aware suggestions
• Real-time intelligence sharing

Ready to experience the future of email intelligence?`,
      timestamp: new Date(),
      metadata: {
        confidence: 1.0,
        processingTime: 0
      }
    };
    
    setMessages([welcomeMessage]);
    
    // Initialize sample conversation threads
    const sampleConversations: ConversationThread[] = [
      {
        id: 'thread-1',
        subject: 'Q4 Strategy Review',
        participants: ['john@company.com', 'sarah@company.com'],
        messages: [],
        lastActivity: new Date(),
        status: 'draft',
        priority: 'high',
        tags: ['strategy', 'quarterly', 'urgent'],
        aiInsights: {
          sentiment: 'positive',
          urgency: 0.8,
          suggestedActions: ['Schedule follow-up', 'Prepare metrics'],
          keyTopics: ['Q4 goals', 'budget allocation', 'team expansion']
        }
      },
      {
        id: 'thread-2',
        subject: 'Project Timeline Update',
        participants: ['mike@company.com'],
        messages: [],
        lastActivity: new Date(Date.now() - 86400000),
        status: 'sent',
        priority: 'medium',
        tags: ['project', 'timeline'],
        aiInsights: {
          sentiment: 'neutral',
          urgency: 0.5,
          suggestedActions: ['Request status update'],
          keyTopics: ['milestones', 'deliverables']
        }
      }
    ];
    
    setConversations(sampleConversations);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing with contextual analysis
    setTimeout(() => {
      const responses = [
        "I've analyzed your message and can provide several strategic insights. Based on your writing style and the recipient context, I recommend adjusting the tone to be more collaborative. Would you like me to suggest specific revisions?",
        "Excellent choice of words! I predict this email has a 87% success rate based on similar communications. The timing is optimal - sending now would maximize engagement. Should I also prepare a follow-up sequence?",
        "I notice this continues a previous conversation thread. I've analyzed the context and suggest mentioning the key points from your last exchange to maintain continuity. I can also predict the likely response patterns.",
        "This message aligns well with your communication goals. I'm detecting high engagement potential with the recipient. Would you like me to run a sentiment analysis and provide tone recommendations?",
        "Based on my predictive analysis, this email type typically receives responses within 4-6 hours when sent at this time. I can also suggest follow-up strategies based on recipient behavior patterns."
      ];

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        metadata: {
          confidence: 0.85 + Math.random() * 0.15,
          processingTime: 1200 + Math.random() * 800,
          suggestions: [
            "Adjust tone for better engagement",
            "Add personalized context",
            "Optimize send timing",
            "Include call-to-action"
          ]
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Show suggestions popup occasionally
      if (Math.random() > 0.7) {
        setShowSuggestions(true);
        setTimeout(() => setShowSuggestions(false), 5000);
      }
    }, 1500 + Math.random() * 1000);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
  };

  const handleVoiceEnd = (transcript: string) => {
    setIsRecording(false);
    if (transcript.trim()) {
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    }
  };

  const memoizedMessages = useMemo(() => messages, [messages]);

  // Phase 7 Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-6">
      <button
        onClick={() => setActiveTab('composer')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'composer'
            ? 'bg-blue-500 text-white'
            : 'text-gray-300 hover:bg-white/10'
        }`}
      >
        <SparklesIcon className="w-5 h-5" />
        <span>AI Composer</span>
      </button>
      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'analytics'
            ? 'bg-blue-500 text-white'
            : 'text-gray-300 hover:bg-white/10'
        }`}
      >
        <ChartBarIcon className="w-5 h-5" />
        <span>Analytics</span>
      </button>
      <button
        onClick={() => setActiveTab('collaboration')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'collaboration'
            ? 'bg-blue-500 text-white'
            : 'text-gray-300 hover:bg-white/10'
        }`}
      >
        <UserGroupIcon className="w-5 h-5" />
        <span>Collaboration</span>
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 ${
          darkMode 
            ? 'bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-teal-900/20' 
            : 'bg-gradient-to-br from-blue-100/50 via-purple-100/50 to-teal-100/50'
        }`} />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div
          className="absolute top-1/2 left-3/4 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"
          animate={{ 
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                OptiMail 2100
              </h1>
              <p className="text-sm text-gray-400">Phase 7: Predictive Intelligence</p>
            </div>
          </div>

          {/* Phase 7 Tab Navigation */}
          <TabNavigation />

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
              title="Open context"
            >
              <CalendarDaysIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Conditional Content Based on Active Tab - Phase 7 */}
      {activeTab === 'composer' && (
        <>
          {/* Messages stream */}
          <div className="max-w-4xl mx-auto pt-8 pb-48 px-6 space-y-6 relative z-10">
            <AnimatePresence>
              {memoizedMessages.map((message) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`max-w-2xl ${message.role === 'user' ? 'ml-auto' : ''}`}
                >
                  <div className={`p-6 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-blue-600/20 border border-blue-500/30' 
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-500' 
                          : 'bg-gradient-to-r from-purple-500 to-teal-500'
                      }`}>
                        {message.role === 'user' 
                          ? <div className="w-4 h-4 bg-white rounded-full" />
                          : <SparklesIcon className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="prose prose-invert max-w-none">
                          {message.id === 'welcome' || message.role === 'user' ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          ) : (
                            <TypingEffect text={message.content} />
                          )}
                        </div>
                        {message.metadata && (
                          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-400">
                            {message.metadata.confidence && (
                              <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                            )}
                            {message.metadata.processingTime && (
                              <span>Processed in {message.metadata.processingTime}ms</span>
                            )}
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent backdrop-blur-sm border-t border-white/10">
            <div className="max-w-4xl mx-auto p-6">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Compose your message with AI assistance..."
                    className="w-full p-4 pr-24 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    rows={Math.min(Math.max(input.split('\n').length, 1), 6)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                    <VoiceInput
                      onStart={handleVoiceStart}
                      onEnd={handleVoiceEnd}
                      isRecording={isRecording}
                    />
                    <motion.button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-xl transition-colors duration-200"
                      whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                      whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                    >
                      <PaperAirplaneIcon className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                  <span>Press Cmd/Ctrl + Enter to send</span>
                  <span>{input.length} characters</span>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto pt-8 pb-16 px-6 relative z-10">
          <AdvancedAnalyticsDashboard />
        </div>
      )}

      {/* Collaboration Tab Content */}
      {activeTab === 'collaboration' && (
        <div className="max-w-6xl mx-auto pt-8 pb-16 px-6 relative z-10">
          <div className="text-center py-16">
            <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Team Collaboration Hub</h2>
            <p className="text-gray-400 mb-8">
              Advanced collaboration features with AI-powered team insights coming soon...
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-2">Team Performance</h3>
                <p className="text-sm text-gray-400">Track team email effectiveness and response patterns</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-2">Shared Intelligence</h3>
                <p className="text-sm text-gray-400">Collaborative AI insights and knowledge sharing</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-2">Workflow Optimization</h3>
                <p className="text-sm text-gray-400">AI-driven process improvements for teams</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion popup */}
      <AnimatePresence>
        {showSuggestions && currentAnalysis && (
          <SuggestionPopup
            suggestions={currentAnalysis.suggestions}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </AnimatePresence>

      {/* Context drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-96 bg-gray-800/95 backdrop-blur-sm border-l border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Conversation Context</h3>
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div key={conv.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{conv.subject}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        conv.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        conv.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {conv.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {conv.participants.join(', ')}
                    </p>
                    {conv.aiInsights && (
                      <div className="text-xs text-gray-300">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {conv.aiInsights.keyTopics.map((topic) => (
                            <span key={topic} className="px-1 py-0.5 bg-blue-500/20 rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <p>Sentiment: {conv.aiInsights.sentiment} | Urgency: {Math.round(conv.aiInsights.urgency * 100)}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-3">AI Insights</h4>
                <div className="space-y-2 text-xs text-gray-300">
                  {[
                    "Peak response time: 2-4 PM",
                    "Best day: Tuesday",
                    "Optimal length: 50-100 words",
                    "Thread context analysis"
                  ].map((insight) => (
                    <div key={insight} className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
