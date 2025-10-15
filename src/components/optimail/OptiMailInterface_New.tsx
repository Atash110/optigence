'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  CalendarIcon,
  LanguageIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import SuggestionPopup from '../SuggestionPopup';
import VoiceInput from '../VoiceInput';
import SuperficialAssistant from '../SuperficialAssistant';
import cohereUtils, { IntentClassificationResult } from '../../../lib/cohere';

interface Message {
  id: string;
  type: 'user' | 'system' | 'suggestion';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  actions?: string[];
}

const OptiMailInterface: React.FC = () => {
  // State management
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<IntentClassificationResult | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSettings, setShowSettings] = useState(false);
  
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

  const addMessage = (content: string, type: 'user' | 'system' | 'suggestion', intent?: string, confidence?: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      intent,
      confidence,
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

    // Analyze input for intent detection
    if (value.length > 10) {
      setIsProcessing(true);
      try {
        const result = await cohereUtils.classifyIntent(value);
        setDetectedIntent(result);
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Intent detection error:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    addMessage(input, 'user');
    
    try {
      const result = await cohereUtils.classifyIntent(input);
      
      let response = '';
      switch (result.intent) {
        case 'reply':
          response = '✨ AI-powered reply generated! Ready to send with your personal style.';
          break;
        case 'calendar':
          response = '📅 Calendar integration activated. Finding your available time slots...';
          break;
        case 'translation':
          response = '🌍 Translation service ready. Which language would you like?';
          break;
        case 'travel':
          response = '✈️ Connecting to OptiTrip for your travel planning needs...';
          break;
        case 'shopping':
          response = '🛍️ OptiShop integration activated for product recommendations...';
          break;
        default:
          response = '🎯 I understand your request. How can I assist you further?';
      }
      
      addMessage(response, 'system', result.intent, result.confidence);
    } catch (error) {
      addMessage('❌ Error processing your request. Please try again.', 'system');
    }

    setInput('');
    setShowSuggestions(false);
    setIsProcessing(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    await handleSend();
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

  return (
    <div className={`min-h-screen font-['Geist',sans-serif] transition-colors duration-300 ${
      darkMode ? 'bg-[#0D1B2A] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Top Navigation */}
      <motion.div 
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-lg border-b ${
          darkMode ? 'bg-[#0D1B2A]/90 border-gray-800' : 'bg-white/90 border-gray-200'
        }`}
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
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LanguageIcon className="h-5 w-5" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
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
                      : darkMode 
                        ? 'bg-gray-800 border border-gray-700' 
                        : 'bg-white border border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.intent && (
                    <div className="mt-2 text-xs opacity-75">
                      Intent: {message.intent} ({Math.round((message.confidence || 0) * 100)}%)
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
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                className={`mb-4 p-3 rounded-xl border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SparklesIcon className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-sm font-medium">Smart Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
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
                className={`w-full p-4 rounded-xl resize-none transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                }`}
                rows={1}
                style={{ minHeight: '60px', maxHeight: '120px' }}
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
