'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  XMarkIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/store/app';
import { useLanguageStore } from '@/store/language';
import { useAI, ChatMessage } from '@/hooks/useAI';
import OptigenceLogo from '@/components/OptigenceLogo';
import TypingInput from '@/components/TypingInput';

// Intent recognition system for pre-launch responses
interface IntentResponse {
  message: string;
  showWaitlistButton?: boolean;
  showFeaturesButton?: boolean;
}

const detectIntent = (userInput: string, t: (key: string) => string): IntentResponse | null => {
  const input = userInput.toLowerCase();
  
  // Enhanced travel/trip intent patterns
  const travelPatterns = [
    // Direct travel terms
    'flight', 'travel', 'trip', 'hotel', 'vacation', 'destination', 'airport', 'airline',
    'booking', 'itinerary', 'suitcase', 'passport', 'visa', 'tourist', 'journey', 'adventure',
    'cruise', 'resort', 'backpack', 'explore', 'visit', 'tour', 'globe', 'wanderlust',
    // Intent-based phrases
    'plan my trip', 'book a flight', 'find hotels', 'travel planning', 'going to',
    'visiting', 'traveling to', 'flying to', 'vacation plans', 'holiday', 'getaway',
    'weekend trip', 'business trip', 'honeymoon', 'road trip', 'international',
    // Specific locations and actions
    'paris', 'tokyo', 'london', 'new york', 'beach', 'mountains', 'city break',
    'cheap flights', 'best hotels', 'travel deals', 'last minute', 'package deal'
  ];

  // Enhanced email/communication intent patterns  
  const emailPatterns = [
    // Direct email terms
    'email', 'write', 'message', 'letter', 'reply', 'communicate', 'correspondence',
    'compose', 'draft', 'send', 'inbox', 'attachment', 'subject line', 'cc', 'bcc',
    'newsletter', 'announcement', 'invitation', 'follow up', 'reminder', 'thank you',
    // Intent-based phrases
    'write an email', 'compose message', 'professional email', 'business letter',
    'follow up email', 'thank you note', 'invitation email', 'complaint letter',
    'cover letter', 'resignation letter', 'apology email', 'sales email',
    'marketing email', 'cold email', 'warm email', 'email template',
    // Communication contexts
    'reach out', 'get in touch', 'contact', 'respond', 'acknowledge', 'confirm',
    'decline', 'accept', 'schedule', 'meeting request', 'conference call'
  ];

  // Enhanced job/career intent patterns
  const careerPatterns = [
    // Direct career terms
    'job', 'resume', 'career', 'application', 'interview', 'hire', 'work', 'cv',
    'linkedin', 'portfolio', 'skills', 'experience', 'qualification', 'certification',
    'promotion', 'salary', 'benefits', 'position', 'role', 'opportunity', 'recruitment',
    'headhunter', 'networking', 'references', 'background check', 'onboarding',
    // Intent-based phrases
    'find a job', 'job search', 'career change', 'job hunting', 'apply for',
    'job interview', 'resume writing', 'cv creation', 'career advice', 'job market',
    'employment', 'job openings', 'job board', 'career path', 'professional development',
    'skill building', 'job training', 'career coaching', 'interview prep',
    // Specific roles and industries
    'software engineer', 'manager', 'developer', 'designer', 'analyst', 'consultant',
    'marketing', 'sales', 'finance', 'hr', 'startup', 'remote work', 'freelance'
  ];

  // Enhanced shopping intent patterns
  const shoppingPatterns = [
    // Direct shopping terms
    'shop', 'buy', 'purchase', 'product', 'deal', 'price', 'compare', 'discount',
    'sale', 'offer', 'coupon', 'bargain', 'cheap', 'expensive', 'affordable', 'budget',
    'brand', 'review', 'rating', 'quality', 'delivery', 'shipping', 'return', 'refund',
    'warranty', 'guarantee', 'customer service', 'online shopping', 'ecommerce',
    // Intent-based phrases
    'best price', 'price comparison', 'find deals', 'shopping list', 'wish list',
    'cart', 'checkout', 'payment', 'credit card', 'paypal', 'apple pay', 'gift card',
    'seasonal sale', 'black friday', 'cyber monday', 'clearance', 'liquidation',
    'bulk purchase', 'wholesale', 'retail', 'marketplace', 'vendor', 'supplier',
    // Product categories
    'laptop', 'phone', 'clothing', 'shoes', 'electronics', 'furniture', 'appliances',
    'books', 'games', 'toys', 'jewelry', 'watches', 'bags', 'accessories', 'cosmetics'
  ];

  // Enhanced AI/general productivity patterns
  const aiProductivityPatterns = [
    // Direct AI terms
    'help', 'assist', 'ai', 'productivity', 'automate', 'smart', 'intelligent', 'algorithm',
    'machine learning', 'artificial intelligence', 'automation', 'efficiency', 'optimize',
    'streamline', 'workflow', 'process', 'task management', 'organization', 'planning',
    'scheduling', 'reminder', 'notification', 'alert', 'dashboard', 'analytics',
    // Intent-based phrases
    'make me more productive', 'help me organize', 'automate my tasks', 'save time',
    'work smarter', 'increase efficiency', 'manage my day', 'stay organized',
    'digital assistant', 'virtual assistant', 'personal assistant', 'life coach',
    'productivity tips', 'time management', 'goal setting', 'habit tracking',
    // General assistance
    'what can you do', 'how does this work', 'show me features', 'capabilities',
    'help me with', 'i need assistance', 'can you help', 'support', 'guidance'
  ];

  // Enhanced features/modules inquiry patterns
  const featuresPatterns = [
    // Direct feature terms
    'feature', 'module', 'capability', 'function', 'tool', 'service', 'option',
    'setting', 'configuration', 'customization', 'integration', 'api', 'plugin',
    'extension', 'add-on', 'upgrade', 'premium', 'pro', 'advanced', 'basic',
    // Intent-based phrases
    'what do you do', 'what can you do', 'how does it work', 'show me', 'demo',
    'features list', 'capabilities overview', 'product tour', 'walkthrough',
    'getting started', 'tutorial', 'guide', 'documentation', 'manual', 'help',
    'pricing', 'plans', 'subscription', 'free trial', 'cost', 'payment',
    // Question patterns
    'can you', 'do you', 'are you able', 'is it possible', 'does it support',
    'how to', 'where can i', 'when will', 'why should', 'which option'
  ];

  // Check each category with enhanced pattern matching
  if (travelPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.travel_response'),
      showWaitlistButton: true
    };
  }

  if (emailPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.email_response'),
      showWaitlistButton: true
    };
  }

  if (careerPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.career_response'),
      showWaitlistButton: true
    };
  }

  if (shoppingPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.shopping_response'),
      showWaitlistButton: true
    };
  }

  if (featuresPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.features_response'),
      showFeaturesButton: true,
      showWaitlistButton: true
    };
  }

  if (aiProductivityPatterns.some(pattern => input.includes(pattern))) {
    return {
      message: t('assistant.general_response'),
      showFeaturesButton: true,
      showWaitlistButton: true
    };
  }

  return null;
};

// Helper function to check if message should show CTA buttons
const shouldShowCTAButtons = (content: string): { showWaitlist: boolean; showFeatures: boolean } => {
  const hasWaitlistCue = content.includes('🎯') && (content.includes('waitlist') || content.includes('early access'));
  const hasFeaturesCue = content.includes('🎯') && content.includes('features');
  
  return {
    showWaitlist: hasWaitlistCue,
    showFeatures: hasFeaturesCue
  };
};

export default function SuperficialAssistant() {
  const { 
    assistant, 
    toggleAssistant,
    closeAssistant,
    addMessage: addGlobalMessage,
  } = useAppStore();
  
  const { t, currentLanguage } = useLanguageStore();
  const { sendMessage, loading, error } = useAI();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close assistant
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assistant.isOpen && 
        chatContainerRef.current && 
        !chatContainerRef.current.contains(event.target as Node)
      ) {
        toggleAssistant();
      }
    };

    if (assistant.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assistant.isOpen, toggleAssistant]);

  // Initialize messages with translated greeting and integrate with global store
  useEffect(() => {
    const initialMessages = [
      {
        role: 'assistant' as const,
        content: t('assistant.greeting'),
        timestamp: new Date(),
      },
    ];

    // If there are messages in the global store, include them
    if (assistant.messages.length > 0) {
      // Convert global messages to local format and merge, filter out system messages
      const globalMessages = assistant.messages
        .filter(msg => msg.role !== 'system') // Filter out system messages
        .map(msg => ({
          role: msg.role as 'user' | 'assistant', // Cast to correct type
          content: msg.content,
          timestamp: msg.timestamp,
        }));
      setMessages([...initialMessages, ...globalMessages]);
    } else {
      setMessages(initialMessages);
    }
  }, [t, currentLanguage, assistant.messages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Set typing state
    setIsUserTyping(value.length > 0);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to clear typing state
    if (value.length > 0) {
      const timeout = setTimeout(() => {
        setIsUserTyping(false);
      }, 1000);
      setTypingTimeout(timeout);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message to local state
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    // Also add to global store
    addGlobalMessage({
      role: 'user',
      content: userMessage,
    });

    // Check for pre-launch intent responses first
    const intentResponse = detectIntent(userMessage, t);
    
    if (intentResponse) {
      // Simulate typing delay for natural feel
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: intentResponse.message,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);

        // Add to global store
        addGlobalMessage({
          role: 'assistant',
          content: intentResponse.message,
        });

        // Add call-to-action buttons after a brief delay
        if (intentResponse.showWaitlistButton || intentResponse.showFeaturesButton) {
          setTimeout(() => {
            let ctaMessage = '';
            
            if (intentResponse.showFeaturesButton && intentResponse.showWaitlistButton) {
              ctaMessage = t('assistant.cta_both');
            } else if (intentResponse.showWaitlistButton) {
              ctaMessage = t('assistant.cta_waitlist');
            } else if (intentResponse.showFeaturesButton) {
              ctaMessage = t('assistant.cta_features');
            }

            const ctaAiMessage: ChatMessage = {
              role: 'assistant',
              content: ctaMessage,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, ctaAiMessage]);

            // Add to global store
            addGlobalMessage({
              role: 'assistant',
              content: ctaMessage,
            });
          }, 800);
        }
      }, 1000);
      
      return;
    }

    // Fallback to original AI API for unrecognized intents
    try {
      // Send message to AI API
      const response = await sendMessage(
        userMessage, 
        'superficial', 
        messages
      );

      // Add AI response to local state
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Add to global store
      addGlobalMessage({
        role: 'assistant',
        content: response.message,
      });
    } catch {
      // Add helpful error message with pre-launch context
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: t('assistant.error_message'),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);

      // Add to global store
      addGlobalMessage({
        role: 'assistant',
        content: t('assistant.error_message'),
      });
    }
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t('assistant.voice_not_supported'));
      return;
    }

    // Enhanced sample queries showcasing intelligent intent recognition
    const sampleQueries = [
      // Email/Communication examples
      'Help me write a professional email to my boss',
      'I need to compose a follow-up message',
      'Draft a thank you note for the interview',
      'Write a resignation letter',
      
      // Travel examples
      'I want to plan a trip to Paris next month',
      'Find me cheap flights to Tokyo',
      'Book a romantic getaway for two',
      'Plan my business trip itinerary',
      
      // Career examples
      'Help me improve my resume for software engineer position',
      'I need interview preparation tips',
      'Find remote job opportunities',
      'Write a compelling cover letter',
      
      // Shopping examples
      'Compare prices for the latest MacBook',
      'Find the best deals on winter clothing',
      'I need reviews for wireless headphones',
      'Search for budget-friendly furniture',
      
      // General productivity
      'How can you make me more productive?',
      'What automation features do you offer?',
      'Show me all your capabilities',
      'Help me organize my daily tasks'
    ];
    
    const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    setInputValue(randomQuery);
  };

  return (
    <>
      {/* Elegant AI Assistant Button */}
      <motion.button
        onClick={toggleAssistant}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl border border-white/20 text-gray-800 dark:text-white rounded-full shadow-lg hover:shadow-xl hover:bg-white/20 transition-all duration-300 z-50 pb-safe cursor-pointer"
        style={{ 
          marginBottom: 'env(safe-area-inset-bottom)', 
          marginRight: 'env(safe-area-inset-right)' 
        }}
        animate={{ 
          scale: [1, 1.05, 1], 
          opacity: [0.9, 1, 0.9],
          boxShadow: [
            '0 4px 20px rgba(59, 130, 246, 0.2)',
            '0 8px 30px rgba(99, 102, 241, 0.3)',
            '0 4px 20px rgba(59, 130, 246, 0.2)'
          ]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        whileHover={{ 
          scale: 1.1,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-full h-full flex items-center justify-center"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 2, -2, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 2
            }}
          >
            <OptigenceLogo size="sm" animate={true} />
          </motion.div>
        </motion.div>
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {assistant.isOpen && (
          <motion.div
            ref={chatContainerRef}
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-24 right-4 sm:bottom-6 sm:right-20 w-[calc(100vw-2rem)] max-w-96 h-[32rem] max-h-[calc(100vh-12rem)] bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl border border-border-light dark:border-border-dark z-40 flex flex-col overflow-hidden"
            style={{ 
              marginBottom: 'env(safe-area-inset-bottom)',
              marginRight: 'env(safe-area-inset-right)' 
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border-light dark:border-border-dark bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-sm">
                    <OptigenceLogo size="sm" animate={true} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Superficial Assistant
                    </h3>
                  </div>
                </div>
                {/* Close Button - Smaller and in header */}
                <button
                  onClick={closeAssistant}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors duration-200 opacity-60 hover:opacity-100"
                  aria-label="Close assistant"
                >
                  <XMarkIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 min-h-[16px] flex items-center">
                {isUserTyping ? (
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center space-x-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{t('assistant.understanding_input')}</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-2 h-2"
                    >
                      <div className="w-full h-full border border-blue-400 border-t-transparent rounded-full"></div>
                    </motion.div>
                  </motion.span>
                ) : assistant.isListening ? t('assistant.listening') : 
                 assistant.isProcessing ? t('assistant.processing') : 
                 t('assistant.ready_to_help')}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('assistant.placeholder')}</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const ctaButtons = message.role === 'assistant' ? shouldShowCTAButtons(message.content) : { showWaitlist: false, showFeatures: false };
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          message.role === 'user'
                            ? 'bg-primary-light dark:bg-primary-dark text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-foreground-light dark:text-foreground-dark'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Call-to-action buttons for assistant messages */}
                        {message.role === 'assistant' && (ctaButtons.showWaitlist || ctaButtons.showFeatures) && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            {ctaButtons.showFeatures && (
                              <Link
                                href="/features"
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-gray-800 dark:bg-white text-white dark:text-gray-800 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                View Features
                                <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                              </Link>
                            )}
                            {ctaButtons.showWaitlist && (
                              <Link
                                href="/waitlist"
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-gray-600 dark:bg-gray-300 text-white dark:text-gray-800 rounded-md hover:bg-gray-500 dark:hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                Join Waitlist
                                <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                              </Link>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              
              {/* Processing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-3 rounded-lg max-w-[80%]">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      Sorry, I encountered an error. Please try again.
                    </p>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border-light dark:border-border-dark">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <TypingInput
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('assistant.placeholder')}
                    typingText={t('assistant.typing_placeholder')}
                    typingSpeed={120}
                    typingDelay={3000}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  />
                  
                  {/* AI Understanding Indicator */}
                  {isUserTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -bottom-8 left-4 flex items-center space-x-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs shadow-lg"
                    >
                      <OptigenceLogo size="sm" animate={true} variant="white" />
                      <span>AI is understanding your request...</span>
                    </motion.div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={loading}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title={t('assistant.voice_button')}
                >
                  <MicrophoneIcon 
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  />
                </button>
                
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="p-2 rounded-lg bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
