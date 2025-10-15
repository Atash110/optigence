'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  CalendarIcon,
  LanguageIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import VoiceInput from '../VoiceInput';
import SuperficialAssistant from '../SuperficialAssistant';
import cohereUtils from '../../../lib/cohere';
import crossModuleIntelligence from '../../lib/optimail/cross-module-intelligence';
import { detectMeetingRequests } from '../../lib/optimail/client-detection';
import { apiOptimail, apiUpcomingEvents } from '../../lib/optimail/client-api';
import type { CalendarEvent } from '../../lib/optimail/calendar-integration';
import type { EmailContext as GPTEmailContext } from '../../lib/optimail/gpt-integration';

interface Message {
  id: string;
  type: 'user' | 'system' | 'suggestion' | 'cross-module';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  module?: string;
  action?: string;
  emailContext?: EmailContext;
}

interface EmailContext {
  content: string;
  sender?: string;
  recipient?: string;
  subject?: string;
  timestamp?: Date;
  thread?: string[];
  userPreferences?: {
    tone: 'professional' | 'casual' | 'friendly';
    length: 'brief' | 'detailed' | 'comprehensive';
    language: string;
  };
}

const OptiMailInterface: React.FC = () => {
  // State management
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSettings, setShowSettings] = useState(false);
  const [emailContext, setEmailContext] = useState<EmailContext | null>(null);
  const [crossModuleSuggestions, setCrossModuleSuggestions] = useState<Array<{
    text: string;
    module: string;
    action: string;
    priority: number;
  }>>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Cohere on component mount
  useEffect(() => {
    cohereUtils.initializeCohere();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (
    content: string, 
    type: 'user' | 'system' | 'suggestion' | 'cross-module', 
    intent?: string, 
    confidence?: number,
    module?: string,
    action?: string
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      intent,
      confidence,
      module,
      action,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Enhanced analysis for input longer than 10 characters
    if (value.length > 10) {
      setIsProcessing(true);
      try {
        // Parallel processing for better performance
        const [cohereResult, crossModuleResult] = await Promise.all([
          cohereUtils.classifyIntent(value),
          Promise.resolve(crossModuleIntelligence.generateCrossModuleSuggestions(value))
        ]);

        // Set basic suggestions
        setSuggestions(cohereResult.suggestions);
        setShowSuggestions(true);

        // Set cross-module suggestions
        setCrossModuleSuggestions(crossModuleResult);

        // Detect if input contains email content
        if (value.includes('@') || value.includes('Subject:') || value.includes('From:')) {
          const emailData: GPTEmailContext = {
            content: value,
            userPreferences: {
              tone: 'professional',
              length: 'detailed',
              language: currentLanguage
            }
          };
          setEmailContext(emailData);

          // Get GPT-4 contextual suggestions for email content
          try {
            // Call API to get GPT suggestions without importing server SDKs client-side
            const gptRes = await apiOptimail('compose', {
              purpose: 'contextual suggestions',
              tone: emailData.userPreferences?.tone || 'professional',
              intent: 'assist',
              body: value,
              originalEmail: value,
            });
            const enhanced = [...cohereResult.suggestions];
            if (gptRes?.result) {
              // Heuristic: extract up to 3 actionable lines
              const lines = String(gptRes.result).split('\n').map(s => s.trim()).filter(Boolean);
              const picks = lines.filter(l => l.length < 120 && /\b(reply|schedule|summarize|translate|template)\b/i.test(l)).slice(0,3);
              enhanced.push(...picks);
            }
            setSuggestions([...new Set(enhanced)]);

            // Client-side meeting detection for suggestion surfacing
            const meetingDetection = detectMeetingRequests(value);
            if (meetingDetection.hasMeetingRequest) {
              const calendarSuggestion = `📅 Schedule "${meetingDetection.suggestedTitle}" (${meetingDetection.suggestedDuration} min)`;
              setSuggestions(prev => [calendarSuggestion, ...prev]);
            }
          } catch (error) {
            console.error('Suggestion enrichment error:', error);
          }
        }
      } catch (error) {
        console.error('Enhanced analysis error:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowSuggestions(false);
      setCrossModuleSuggestions([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    addMessage(input, 'user');
    
    try {
      // Enhanced processing with multiple AI systems
  const [cohereResult, crossModuleRoutes] = await Promise.all([
        cohereUtils.classifyIntent(input),
        Promise.resolve(crossModuleIntelligence.analyzeForCrossModuleIntent(input, emailContext?.content))
      ]);
      
      let response = '';
      let responseType: 'system' | 'cross-module' = 'system';

      // Check for cross-module routing first
      if (crossModuleRoutes.length > 0) {
        const bestRoute = crossModuleRoutes[0];
        response = `🔄 Routing to ${bestRoute.targetModule.toUpperCase()}: ${bestRoute.suggestedAction}`;
        responseType = 'cross-module';
        
        // Update user context
        crossModuleIntelligence.updateUserContext(bestRoute.targetModule, bestRoute.suggestedAction, { input });
        
        addMessage(response, responseType, bestRoute.targetModule, bestRoute.confidence, bestRoute.targetModule, bestRoute.suggestedAction);
      } else {
        // Standard OptiMail responses
        switch (cohereResult.intent) {
          case 'reply':
            try {
              const payload = {
                originalEmail: emailContext?.content || input,
                tone: emailContext?.userPreferences?.tone || 'professional',
              };
              const res = await apiOptimail('reply', payload);
              response = `✨ AI-powered reply options:\n\n${res?.result || 'Ready to send with your personal style.'}`;
            } catch {
              response = '✨ AI-powered reply generated! Ready to send with your personal style.';
            }
            break;
            
          case 'calendar':
            try {
              const meetingDetection = detectMeetingRequests(input);
              if (meetingDetection.hasMeetingRequest) {
                response = `📅 Calendar integration activated.\n\nDetected meeting: "${meetingDetection.suggestedTitle}"\nSuggested duration: ${meetingDetection.suggestedDuration} minutes\nUrgency: ${meetingDetection.urgency}\n\nFinding optimal meeting times...`;
                const upcoming = await apiUpcomingEvents(5);
                const upcomingEvents: CalendarEvent[] = Array.isArray(upcoming?.events)
                  ? (upcoming.events as CalendarEvent[])
                  : [];
                if (upcomingEvents.length > 0) {
                  response += `\n\nUpcoming events:\n${upcomingEvents
                    .map((event) => `• ${event.summary} - ${new Date(event.start.dateTime).toLocaleDateString()}`)
                    .join('\n')}`;
                }
              } else {
                response = '📅 Calendar integration activated. Finding your available time slots...';
              }
            } catch {
              response = '📅 Calendar integration activated. Finding your available time slots...';
            }
            break;
            
          case 'translation':
            response = `🌍 Translation service ready. Which language would you like? Current: ${currentLanguage}`;
            break;
            
          case 'travel':
            response = '✈️ Connecting to OptiTrip for your travel planning needs...';
            break;
            
          case 'shopping':
            response = '🛍️ OptiShop integration activated for product recommendations...';
            break;
            
          default:
            // Generate contextual response using GPT-4
            try {
              const payload = { body: emailContext?.content || input };
              const res = await apiOptimail('summarize', payload);
              response = res?.result ? `🎯 Email Analysis Complete!\n\n${res.result}` : '🎯 I understand your request. How can I assist you further?';
            } catch {
              response = '🎯 I understand your request. How can I assist you further?';
            }
        }
        
        addMessage(response, responseType, cohereResult.intent, cohereResult.confidence);
      }

    } catch (error) {
      console.error('Enhanced processing error:', error);
      addMessage('❌ Error processing your request. Please try again.', 'system');
    }

    setInput('');
    setShowSuggestions(false);
    setCrossModuleSuggestions([]);
    setIsProcessing(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    setTimeout(handleSend, 100);
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript);
    setIsListening(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const themeClasses = darkMode ? 'bg-[#0D1B2A] text-white' : 'bg-gray-50 text-gray-900';
  const navClasses = darkMode ? 'bg-[#0D1B2A]/90 border-gray-800' : 'bg-white/90 border-gray-200';
  const buttonClasses = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen font-['Geist',sans-serif] transition-colors duration-300 ${themeClasses}`}>
      
      {/* Top Navigation */}
      <motion.div 
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-lg border-b ${navClasses}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">OptiMail</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                AI-Powered Assistant
              </p>
            </div>
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <motion.button
              onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'fr' : 'en')}
              className={`p-2 rounded-lg transition-colors ${buttonClasses}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Change Language"
            >
              <LanguageIcon className="h-5 w-5" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${buttonClasses}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${buttonClasses}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Central Chat Area */}
      <div className="pt-24 pb-32 px-4 max-w-4xl mx-auto flex flex-col min-h-screen">
        
        {/* Messages Area */}
        <div className="flex-1 mb-8">
          {messages.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.div
                className="w-24 h-24 bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  boxShadow: ["0 0 0 0px rgba(59, 130, 246, 0.7)", "0 0 0 20px rgba(59, 130, 246, 0)"],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <SparklesIcon className="h-12 w-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4">
                Your Personal Email Assistant
              </h2>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Paste an email, speak a command, or describe what you need
              </p>

              {/* Example Commands */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { text: 'Reply to Sarah', icon: ChatBubbleLeftRightIcon },
                  { text: 'Schedule meeting', icon: CalendarIcon },
                  { text: 'Translate to French', icon: LanguageIcon },
                  { text: 'Save as template', icon: DocumentDuplicateIcon }
                ].map((example, index) => (
                  <motion.button
                    key={example.text}
                    onClick={() => setInput(example.text)}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-[#3B82F6]' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-[#3B82F6]'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <example.icon className="h-6 w-6 text-[#3B82F6] mx-auto mb-2" />
                    <span className="text-sm font-medium">{example.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`p-4 rounded-xl max-w-md ${
                    message.type === 'user' 
                      ? 'bg-[#3B82F6] text-white ml-auto' 
                      : message.type === 'cross-module'
                        ? 'bg-gradient-to-r from-[#3B82F6] to-purple-500 text-white'
                        : darkMode 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-white border border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  {(message.intent || message.module) && (
                    <div className="mt-2 text-xs opacity-75">
                      {message.type === 'cross-module' ? (
                        <>Module: {message.module} • Action: {message.action}</>
                      ) : (
                        <>Intent: {message.intent} ({Math.round((message.confidence || 0) * 100)}%)</>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg border-t ${
          darkMode ? 'bg-[#0D1B2A]/90 border-gray-800' : 'bg-white/90 border-gray-200'
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Suggestions Box */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || crossModuleSuggestions.length > 0) && (
              <motion.div
                className={`mb-4 p-3 rounded-xl border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {/* Regular Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <SparklesIcon className="h-4 w-4 text-[#3B82F6]" />
                      <span className="text-sm font-medium">Smart Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-[#3B82F6]' 
                              : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-[#3B82F6]'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-Module Suggestions */}
                {crossModuleSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-[#3B82F6] to-purple-500 rounded-full" />
                      <span className="text-sm font-medium">Cross-Module Intelligence</span>
                    </div>
                    <div className="space-y-2">
                      {crossModuleSuggestions.slice(0, 3).map((suggestion, index) => (
                        <motion.button
                          key={`${suggestion.module}-${index}`}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-purple-400' 
                              : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-purple-400'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>{suggestion.text}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {suggestion.priority}%
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Area */}
          <div className="flex items-end space-x-3">
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message, paste an email, or speak a command..."
                className={`w-full p-4 rounded-xl resize-none transition-all duration-200 min-h-[60px] max-h-[120px] ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                }`}
                rows={1}
              />
              
              {/* Processing Indicator */}
              {isProcessing && (
                <motion.div
                  className="flex items-center space-x-2 mt-2 text-sm text-[#3B82F6]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-2 h-2 bg-[#3B82F6] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span>Processing with AI...</span>
                </motion.div>
              )}
            </div>

            {/* Voice Input Button */}
            <motion.button
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className={`p-4 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-500'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!isProcessing ? { scale: 1.1 } : {}}
              whileTap={!isProcessing ? { scale: 0.95 } : {}}
              title={isListening ? 'Stop Recording' : 'Start Voice Input'}
            >
              <MicrophoneIcon className="h-6 w-6 text-white" />
            </motion.button>

            {/* Send Button */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className={`p-4 rounded-full transition-colors ${
                input.trim() && !isProcessing
                  ? 'bg-[#3B82F6] hover:bg-blue-600'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
              whileHover={input.trim() && !isProcessing ? { scale: 1.1 } : {}}
              whileTap={input.trim() && !isProcessing ? { scale: 0.95 } : {}}
              title="Send Message"
            >
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Voice Input Component */}
      {isListening && (
        <VoiceInput 
          onResult={handleVoiceInput}
          onStop={() => setIsListening(false)}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className={`p-6 rounded-xl max-w-md w-full mx-4 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      darkMode ? 'bg-[#3B82F6]' : 'bg-gray-300'
                    } relative`}
                    title="Toggle Dark Mode"
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                      animate={{ x: darkMode ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Language</span>
                  <select
                    value={currentLanguage}
                    onChange={e => setCurrentLanguage(e.target.value)}
                    className={`p-2 rounded border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    title="Select Language"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuperficialAssistant />
    </div>
  );
};

export default OptiMailInterface;
