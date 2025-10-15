'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  BellIcon,
  DocumentTextIcon,
  LanguageIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import Header from '../Header';
import SuggestionPopup from '../SuggestionPopup';
import VoiceInput from '../VoiceInput';
import SuperficialAssistant from '../SuperficialAssistant';
import OptigenceLogo from '../OptigenceLogo';
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

interface NotificationProps {
  message: string;
  type: 'success' | 'info' | 'warning';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-900/20 border-green-600',
    info: 'bg-blue-900/20 border-blue-600',
    warning: 'bg-yellow-900/20 border-yellow-600',
  }[type];

  return (
    <motion.div
      className={`fixed top-20 right-4 p-4 rounded-lg border backdrop-blur-md z-50 ${bgColor}`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className="flex items-center space-x-2">
        <BellIcon className="h-5 w-5 text-blue-400" />
        <span className="text-white text-sm">{message}</span>
      </div>
    </motion.div>
  );
};

const OptiMailInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<IntentClassificationResult | null>(null);
  const [emailContext, setEmailContext] = useState<string[]>([]);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'info' | 'warning'} | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // New state for UI enhancements
  const [darkMode, setDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSettings, setShowSettings] = useState(false);
  const [quickActions, setQuickActions] = useState(['Reply', 'Summarize', 'Translate', 'Calendar']);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Cohere on component mount
  useEffect(() => {
    const cohereApiKey = process.env.NEXT_PUBLIC_COHERE_API_KEY;
    if (cohereApiKey) {
      cohereUtils.initializeCohere();
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'system' | 'suggestion', intent?: string, confidence?: number, actions?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      intent,
      confidence,
      actions,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning') => {
    setNotification({ message, type });
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Analyze input for context and intent
    if (value.length > 15) {
      setIsProcessing(true);
      
      try {
        // Detect email context patterns
        const contexts = cohereUtils.detectEmailContext(value);
        setEmailContext(contexts);

        // Classify intent using Cohere
        const intentResult = await cohereUtils.classifyIntent(value);
        setDetectedIntent(intentResult);
        
        // Generate proactive suggestions
        const contextSuggestions = getProactiveSuggestions(contexts, intentResult);
        setSuggestions(contextSuggestions);
        setShowSuggestions(contextSuggestions.length > 0 && intentResult.confidence > 0.3);

        // Auto-suggest calendar integration if scheduling detected
        if (intentResult.intent === 'calendar' && intentResult.confidence > 0.7) {
          setShowCalendar(true);
          setAvailableTimeSlots(['9:00 AM - 10:00 AM', '2:00 PM - 3:00 PM', '4:00 PM - 5:00 PM']);
        }
      } catch (error) {
        console.error('Error analyzing input:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowSuggestions(false);
      setDetectedIntent(null);
      setEmailContext([]);
      setShowCalendar(false);
    }
  };

  const getProactiveSuggestions = (contexts: string[], intentResult: IntentClassificationResult): string[] => {
    const suggestions: string[] = [...intentResult.suggestions];
    
    // Add proactive suggestions based on context
    if (contexts.includes('email')) {
      suggestions.push('Auto-generate professional reply', 'Schedule follow-up reminder');
    }
    
    if (contexts.includes('meeting')) {
      suggestions.push('Check calendar availability', 'Send meeting agenda template');
    }
    
    if (contexts.includes('travel')) {
      suggestions.push('Connect with OptiTrip', 'Find best travel deals', 'Create travel itinerary');
    }
    
    if (contexts.includes('shopping')) {
      suggestions.push('Connect with OptiShop', 'Compare product prices', 'Find similar products');
    }
    
    if (contexts.includes('urgent')) {
      suggestions.unshift('Priority processing', 'Immediate response template');
    }
    
    // Remove duplicates and limit to 6 suggestions
    return [...new Set(suggestions)].slice(0, 6);
  };

  const handleVoiceInput = async (transcript: string) => {
    setInput(transcript);
    setIsListening(false);
    
    // Add voice input message
    addMessage(transcript, 'user');
    
    // Process voice command immediately
    await processUserInput(transcript);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log('Processing suggestion:', suggestion);
    
    // Add suggestion as system message
    addMessage(`Processing: ${suggestion}`, 'system');
    
    setShowSuggestions(false);
    
    // Route to appropriate module or action
    switch (suggestion) {
      case 'Connect with OptiTrip':
        showNotification('Redirecting to OptiTrip for travel planning...', 'info');
        // Here you would integrate with OptiTrip module
        setTimeout(() => {
          addMessage('OptiTrip integration ready! I can help you plan flights, hotels, and activities.', 'system');
        }, 1500);
        break;
        
      case 'Connect with OptiShop':
        showNotification('Connecting to OptiShop for product recommendations...', 'info');
        setTimeout(() => {
          addMessage('OptiShop connected! I can help you find products and compare prices.', 'system');
        }, 1500);
        break;
        
      case 'Add to Google Calendar':
      case 'Check calendar availability':
        showNotification('Accessing your Google Calendar...', 'info');
        setShowCalendar(true);
        break;
        
      case 'Auto-generate professional reply':
        showNotification('Generating AI-powered reply...', 'info');
        setTimeout(() => {
          addMessage('Professional reply generated! Would you like me to customize the tone or schedule it for later?', 'system');
        }, 2000);
        break;
        
      default:
        addMessage(`Executing: ${suggestion}`, 'system');
    }
  };

  const processUserInput = async (inputText: string) => {
    setIsProcessing(true);
    
    try {
      // Multi-intent classification for complex requests
      const intents = await cohereUtils.classifyMultipleIntents(inputText);
      
      // Process each detected intent
      for (const intent of intents) {
        await executeIntent(intent);
      }
      
    } catch (error) {
      console.error('Error processing input:', error);
      addMessage('Sorry, I encountered an error processing your request. Please try again.', 'system');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIntent = async (intent: IntentClassificationResult) => {
    switch (intent.intent) {
      case 'reply':
        addMessage('I\'ll help you craft the perfect reply. Analyzing tone and context...', 'system');
        break;
        
      case 'calendar':
        addMessage('Checking your calendar and suggesting optimal meeting times...', 'system');
        setShowCalendar(true);
        break;
        
      case 'translation':
        addMessage('Which language would you like me to translate to?', 'system');
        setSuggestions(['French', 'Spanish', 'German', 'Italian', 'Japanese']);
        setShowSuggestions(true);
        break;
        
      case 'summary':
        addMessage('Creating a concise summary with key action items...', 'system');
        break;
        
      case 'travel':
        addMessage('I\'ll connect you with OptiTrip for comprehensive travel planning!', 'system');
        showNotification('OptiTrip integration activated', 'success');
        break;
        
      case 'shopping':
        addMessage('Connecting with OptiShop to find the best deals and recommendations!', 'system');
        showNotification('OptiShop integration activated', 'success');
        break;
        
      default:
        addMessage('I\'m here to help! What would you like me to assist you with?', 'system');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userInput = input.trim();
    
    // Add user message
    addMessage(userInput, 'user');
    
    // Clear input
    setInput('');
    setShowSuggestions(false);
    setDetectedIntent(null);
    setEmailContext([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Process the input
    await processUserInput(userInput);
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
      
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* Main Content - Central Chat Area */}
      <div className="pt-24 pb-8 px-4 max-w-4xl mx-auto flex flex-col min-h-screen">
        
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
        
        {/* Input Area at Bottom */}
        <motion.div
          className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg border-t ${
            darkMode ? 'bg-[#0D1B2A]/90 border-gray-800' : 'bg-white/90 border-gray-200'
          }`}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Quick Action Buttons */}
            <div className="flex justify-center space-x-2 mb-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action}
                  onClick={() => handleSuggestionClick(action)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#3B82F6]' 
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-[#3B82F6]'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {action}
                </motion.button>
              ))}
            </div>

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

        {/* Suggestion Popup */}
        {showSuggestions && (
          <SuggestionPopup
            suggestions={suggestions}
            onSelect={handleSuggestionClick}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </div>

      {/* Settings Modal */}
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

      <SuperficialAssistant />
    </div>
  );
};

        {/* Calendar Integration */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              className="mb-4 p-4 bg-green-900/20 border border-green-600 rounded-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center space-x-2 mb-3">
                <CalendarIcon className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">Available Time Slots</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTimeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      addMessage(`Selected time slot: ${slot}`, 'system');
                      setShowCalendar(false);
                      showNotification('Calendar event created successfully!', 'success');
                    }}
                    className="px-3 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors"
                  >
                    <ClockIcon className="h-4 w-4 inline mr-2" />
                    {slot}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions Popup */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <SuggestionPopup 
              suggestions={suggestions} 
              onSuggestionClick={handleSuggestionClick}
              isProcessing={isProcessing}
            />
          )}
        </AnimatePresence>

        {/* Main Chat Input */}
        <motion.div
          className="relative"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.div 
            className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-700 p-6 shadow-2xl"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-end space-x-4">
              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type or paste your email here, give me voice commands, or simply describe what you need..."
                  className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed min-h-[60px] max-h-[200px]"
                  rows={1}
                  disabled={isProcessing}
                />
                
                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-sm text-blue-400">Analyzing with AI...</span>
                  </div>
                )}
              </div>

              {/* Voice Input Button */}
              <motion.button
                onClick={() => setIsListening(!isListening)}
                disabled={isProcessing}
                className={`p-3 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : isProcessing
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[#3B82F6] hover:bg-blue-600'
                }`}
                whileHover={!isProcessing ? { scale: 1.1 } : {}}
                whileTap={!isProcessing ? { scale: 0.95 } : {}}
              >
                <MicrophoneIcon className="h-5 w-5" />
              </motion.button>

              {/* Send Button */}
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className={`p-3 rounded-full transition-colors ${
                  input.trim() && !isProcessing
                    ? 'bg-[#3B82F6] hover:bg-blue-600'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                whileHover={input.trim() && !isProcessing ? { scale: 1.1 } : {}}
                whileTap={input.trim() && !isProcessing ? { scale: 0.95 } : {}}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Voice Input Component */}
          {isListening && (
            <VoiceInput 
              onResult={handleVoiceInput}
              onStop={() => setIsListening(false)}
            />
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="flex flex-wrap gap-3 mt-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {[
            { label: 'Smart Reply', icon: DocumentTextIcon },
            { label: 'Schedule Meeting', icon: CalendarIcon },
            { label: 'Translate', icon: LanguageIcon },
            { label: 'AI Summary', icon: SparklesIcon }
          ].map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => handleSuggestionClick(action.label)}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-600 transition-all duration-200 hover:border-blue-500"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <action.icon className="h-5 w-5 text-[#3B82F6]" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Superficial Assistant Integration */}
      <SuperficialAssistant />
    </div>
  );
};

export default OptiMailInterface;
