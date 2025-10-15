import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import SuggestionPopup from '../SuggestionPopup';
import VoiceInput from '../VoiceInput';
import cohereUtils, { IntentClassificationResult } from '../../../lib/cohere';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<IntentClassificationResult | null>(null);
  const [emailContext, setEmailContext] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Cohere on component mount
  useEffect(() => {
    const cohereApiKey = process.env.NEXT_PUBLIC_COHERE_API_KEY;
    if (cohereApiKey) {
      cohereUtils.initializeCohere();
    } else {
      console.warn('Cohere API key not found. Using local pattern matching for intent classification.');
    }
  }, []);

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
        
        // Combine context-based and intent-based suggestions
        const contextSuggestions = getContextBasedSuggestions(contexts);
        const allSuggestions = [...new Set([...intentResult.suggestions, ...contextSuggestions])];
        
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0 && intentResult.confidence > 0.3);
      } catch (error) {
        console.error('Error analyzing input:', error);
        // Fallback to basic suggestions
        setSuggestions(getBasicSuggestions(value));
        setShowSuggestions(true);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowSuggestions(false);
      setDetectedIntent(null);
      setEmailContext([]);
    }
  };

  const getContextBasedSuggestions = (contexts: string[]): string[] => {
    const suggestions: string[] = [];
    
    if (contexts.includes('email')) {
      suggestions.push('Reply with AI assistance', 'Summarize email content');
    }
    
    if (contexts.includes('meeting')) {
      suggestions.push('Add to calendar', 'Suggest meeting times');
    }
    
    if (contexts.includes('travel')) {
      suggestions.push('Connect with OptiTrip', 'Plan travel itinerary');
    }
    
    if (contexts.includes('shopping')) {
      suggestions.push('Connect with OptiShop', 'Find product deals');
    }
    
    if (contexts.includes('question')) {
      suggestions.push('Generate AI response', 'Provide detailed answer');
    }
    
    if (contexts.includes('urgent')) {
      suggestions.push('Priority reply', 'Quick response template');
    }
    
    return suggestions;
  };

  const getBasicSuggestions = (text: string): string[] => {
    const suggestions = [];
    
    if (text.includes('@') || text.toLowerCase().includes('email')) {
      suggestions.push('Reply with AI assistance');
      suggestions.push('Summarize email content');
    }
    
    if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('schedule')) {
      suggestions.push('Add to calendar');
      suggestions.push('Suggest meeting times');
    }
    
    suggestions.push('Save as template');
    suggestions.push('Translate message');
    
    return suggestions;
  };

  const handleVoiceInput = async (transcript: string) => {
    setInput(transcript);
    setIsListening(false);
    
    // Immediately process voice input for intent
    if (transcript.length > 10) {
      setIsProcessing(true);
      try {
        const intentResult = await cohereUtils.classifyIntent(transcript);
        setDetectedIntent(intentResult);
        setSuggestions(intentResult.suggestions);
        setShowSuggestions(intentResult.confidence > 0.3);
      } catch (error) {
        console.error('Error processing voice input:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log('Processing suggestion:', suggestion);
    console.log('Detected intent:', detectedIntent?.intent);
    console.log('Email context:', emailContext);
    
    // Here you would integrate with your AI processing logic
    // For now, we'll just log the action
    
    setShowSuggestions(false);
    
    // Example of how to handle different suggestion types
    switch (suggestion) {
      case 'Connect with OptiTrip':
        // Redirect to OptiTrip module
        console.log('Redirecting to OptiTrip with context:', input);
        break;
      case 'Connect with OptiShop':
        // Redirect to OptiShop module
        console.log('Redirecting to OptiShop with context:', input);
        break;
      case 'Add to calendar':
        // Process calendar integration
        console.log('Processing calendar integration');
        break;
      default:
        console.log('Processing general AI assistance');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Perform final intent classification before processing
      const finalIntent = await cohereUtils.classifyIntent(input);
      console.log('Final intent classification:', finalIntent);
      
      // Process the input with AI based on intent
      console.log('Processing with intent:', finalIntent.intent);
      console.log('Input:', input);
      
      // Here you would call your AI processing functions based on intent
      
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsProcessing(false);
      
      // Clear input after sending
      setInput('');
      setShowSuggestions(false);
      setDetectedIntent(null);
      setEmailContext([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <motion.div 
      className="relative w-full max-w-4xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      {/* Intent Detection Display */}
      <AnimatePresence>
        {detectedIntent && detectedIntent.confidence > 0.5 && (
          <motion.div
            className="mb-4 p-3 bg-blue-900/30 border border-blue-600 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Detected intent: <strong>{detectedIntent.intent}</strong> 
                <span className="text-blue-400 ml-2">
                  ({Math.round(detectedIntent.confidence * 100)}% confidence)
                </span>
              </span>
            </div>
            {emailContext.length > 0 && (
              <div className="mt-2 text-xs text-blue-400">
                Context: {emailContext.join(', ')}
              </div>
            )}
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
      <div className="relative">
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
                placeholder="Type or paste your email here, or give me a brief instruction..."
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed min-h-[60px] max-h-[200px]"
                rows={1}
                disabled={isProcessing}
              />
              
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm text-blue-400">Analyzing intent...</span>
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
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="flex flex-wrap gap-2 mt-4 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {['Reply Assistance', 'Email Summary', 'Schedule Meeting', 'Save Template'].map((action, index) => (
          <motion.button
            key={action}
            onClick={() => handleSuggestionClick(action)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm border border-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            {action}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ChatInterface;
