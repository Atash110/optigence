import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PaperAirplaneIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useLiveSuggestions, buildSuggestionContext } from '@/hooks/useLiveSuggestions';
import { ActionSuggestion } from '@/lib/optimail/live-suggestions';

interface MatrixChatBarProps {
  onSendMessage: (message: string, confidence: number, isAutoSend?: boolean) => Promise<void>;
  onVoiceInput: (transcript: string, confidence: number) => void;
  className?: string;
  placeholder?: string;
  autoSendThreshold?: number; // 0-100
  animationSpeed?: number; // Characters per minute
  disabled?: boolean;
}

export function MatrixChatBar({
  onSendMessage,
  onVoiceInput,
  className = '',
  placeholder = 'Type your message or hold Space to speak...',
  autoSendThreshold = 85,
  animationSpeed = 300,
  disabled = false
}: MatrixChatBarProps) {
  // Core state
  const [message, setMessage] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Auto-send state
  const [showAutoSendCountdown, setShowAutoSendCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  
  // Typing animation state
  const [typingTarget, setTypingTarget] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spaceHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live suggestions hook
  const {
    suggestions,
    primaryAction,
    contextualHints,
    isLoading: suggestionsLoading,
    generateSuggestionsDebounced,
    executeSuggestion
  } = useLiveSuggestions({
    enabled: true,
    debounceMs: 400
  });

  /**
   * Humanized typing animation at 300 CPM
   */
  const startTypingAnimation = useCallback((targetText: string) => {
    if (!targetText || isTyping) return;
    
    setIsTyping(true);
    setTypingTarget(targetText);
    setTypingIndex(0);
    setMessage('');
    
    const millisecondsPerChar = (60 * 1000) / animationSpeed;
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < targetText.length) {
        const newText = targetText.slice(0, currentIndex + 1);
        setMessage(newText);
        setTypingIndex(currentIndex + 1);
        currentIndex++;
        
        // Add human-like variance (±30% of base speed)
        const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        const delay = millisecondsPerChar * variance;
        
        // Slower typing for punctuation and spaces
        const char = targetText[currentIndex - 1];
        const punctuationDelay = ['.', ',', '!', '?', ':', ';'].includes(char) ? 1.5 : 1;
        const spaceDelay = char === ' ' ? 1.2 : 1;
        
        const finalDelay = delay * punctuationDelay * spaceDelay;
        
        typingTimeoutRef.current = setTimeout(typeNextChar, finalDelay);
      } else {
        setIsTyping(false);
        setTypingTarget('');
        inputRef.current?.focus();
      }
    };
    
    typeNextChar();
  }, [animationSpeed, isTyping]);

  /**
   * Handle voice input with confidence
   */
  const handleVoiceInput = useCallback((transcript: string, confidence: number) => {
    if (!transcript.trim()) return;
    
    // Start typing animation for voice input
    startTypingAnimation(transcript);
    setCurrentConfidence(confidence);
    onVoiceInput(transcript, confidence);
    
    // Generate suggestions for voice input
    if (transcript.trim().length > 3) {
      const context = buildSuggestionContext(transcript, 'voice_input', confidence / 100);
      generateSuggestionsDebounced(context);
    }
    
    // Trigger auto-send if confidence is high enough
    if (confidence >= autoSendThreshold && transcript.trim().length > 8) {
      setTimeout(() => {
        startAutoSendCountdown(transcript, confidence);
      }, 1000); // Wait for typing to start
    }
  }, [startTypingAnimation, onVoiceInput, generateSuggestionsDebounced, autoSendThreshold, startAutoSendCountdown]);

  /**
   * Start auto-send countdown
   */
  const startAutoSendCountdown = useCallback((text: string, confidence: number) => {
    if (isTyping || showAutoSendCountdown) return;
    
    setShowAutoSendCountdown(true);
    setCountdownSeconds(3);
    
    let remainingSeconds = 3;
    countdownIntervalRef.current = setInterval(() => {
      remainingSeconds--;
      setCountdownSeconds(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        clearInterval(countdownIntervalRef.current!);
        setShowAutoSendCountdown(false);
        handleSend(text, confidence, true);
      }
    }, 1000);
    
    autoSendTimeoutRef.current = setTimeout(() => {
      setShowAutoSendCountdown(false);
      handleSend(text, confidence, true);
    }, 3000);
  }, [isTyping, showAutoSendCountdown]);

  /**
   * Cancel auto-send
   */
  const cancelAutoSend = useCallback(() => {
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setShowAutoSendCountdown(false);
    setCountdownSeconds(3);
  }, []);

  /**
   * Handle sending message
   */
  const handleSend = useCallback(async (
    text = message,
    confidence = currentConfidence,
    isAutoSend = false
  ) => {
    if (!text.trim() || isProcessing || isTyping) return;
    
    setIsProcessing(true);
    cancelAutoSend();
    
    try {
      await onSendMessage(text, confidence, isAutoSend);
      
      // Clear state after successful send
      setMessage('');
      setCurrentConfidence(0);
      setTypingTarget('');
      setTypingIndex(0);
      
      // Focus input for next message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [message, currentConfidence, isProcessing, isTyping, onSendMessage, cancelAutoSend]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isTyping && !showAutoSendCountdown) {
        handleSend();
      }
    } else if (event.key === 'Escape') {
      cancelAutoSend();
    } else if (event.key === ' ' && !message.trim()) {
      event.preventDefault();
      if (!isVoiceActive) {
        setIsVoiceActive(true);
        // Start space-hold detection
        spaceHoldTimeoutRef.current = setTimeout(() => {
          // Trigger voice input after 200ms of holding space
          console.log('Space hold detected - start voice input');
        }, 200);
      }
    }
  }, [message, isTyping, showAutoSendCountdown, isVoiceActive, handleSend, cancelAutoSend]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === ' ') {
      if (spaceHoldTimeoutRef.current) {
        clearTimeout(spaceHoldTimeoutRef.current);
        spaceHoldTimeoutRef.current = null;
      }
      setIsVoiceActive(false);
    }
  }, []);

  /**
   * Handle suggestion execution
   */
  const handleSuggestionClick = useCallback(async (suggestion: ActionSuggestion) => {
    try {
      await executeSuggestion(suggestion);
      
      // For text generation suggestions, start typing animation
      if (suggestion.action.includes('generate') || suggestion.action.includes('draft')) {
        const mockGeneratedText = `AI generated response for: ${suggestion.label}`;
        startTypingAnimation(mockGeneratedText);
      }
      
    } catch (error) {
      console.error('Failed to execute suggestion:', error);
    }
  }, [executeSuggestion, startTypingAnimation]);

  /**
   * Generate suggestions when message changes
   */
  useEffect(() => {
    if (message.trim().length > 3 && !isTyping) {
      // Simple intent classification
      let intent = 'compose';
      let confidence = 0.7;
      
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('reply') || lowerMessage.includes('respond')) {
        intent = 'reply';
        confidence = 0.85;
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('calendar')) {
        intent = 'calendar';
        confidence = 0.8;
      } else if (lowerMessage.includes('translate')) {
        intent = 'translate';
        confidence = 0.9;
      } else if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
        intent = 'summarize';
        confidence = 0.85;
      }
      
      const context = buildSuggestionContext(message, intent, confidence);
      generateSuggestionsDebounced(context);
    }
  }, [message, isTyping, generateSuggestionsDebounced]);

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSendTimeoutRef.current) clearTimeout(autoSendTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (spaceHoldTimeoutRef.current) clearTimeout(spaceHoldTimeoutRef.current);
    };
  }, []);

  return (
    <div className={`matrix-chat-bar relative ${className}`}>
      {/* Auto-send countdown overlay */}
      <AnimatePresence>
        {showAutoSendCountdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl p-6 shadow-2xl border-2 border-blue-500 max-w-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {countdownSeconds}
                </div>
                <div className="text-gray-700 font-medium mb-1">
                  Auto-sending in {countdownSeconds}s
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  High confidence message detected ({currentConfidence}%)
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelAutoSend}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live suggestions bar */}
      <AnimatePresence>
        {suggestions.length > 0 && !isTyping && !showAutoSendCountdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex items-center gap-2 overflow-x-auto p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
          >
            {primaryAction && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(primaryAction)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors whitespace-nowrap text-sm font-medium"
              >
                <span className="text-base">{primaryAction.icon}</span>
                <span>{primaryAction.label}</span>
                <span className="text-xs opacity-75">
                  {Math.round(primaryAction.confidence * 100)}%
                </span>
              </motion.button>
            )}
            
            {suggestions.slice(0, 3).map((suggestion) => (
              <motion.button
                key={suggestion.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap text-sm"
                title={suggestion.tooltip}
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat input */}
      <motion.div
        layout
        className="relative flex items-end gap-3 p-4 bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl"
        whileHover={{ scale: 1.002 }}
        animate={disabled ? { opacity: 0.6 } : { opacity: 1 }}
      >
        {/* Voice button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          disabled={disabled || isTyping || showAutoSendCountdown}
          className={`p-3 rounded-xl transition-all ${
            isVoiceActive
              ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/25'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-gray-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Click to toggle voice input, or hold Space to speak"
        >
          {isVoiceActive ? (
            <StopIcon className="w-5 h-5" />
          ) : (
            <MicrophoneIcon className="w-5 h-5" />
          )}
        </motion.button>

        {/* Text input area */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => !isTyping && setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={placeholder}
            disabled={disabled || isTyping || showAutoSendCountdown}
            rows={1}
            className="w-full bg-transparent resize-none focus:outline-none text-base text-gray-100 placeholder-gray-500 leading-relaxed scrollbar-thin max-h-[120px] min-h-[24px]"
          />
          
          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1"
              >
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse animate-delay-200"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse animate-delay-400"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confidence indicator */}
        <AnimatePresence>
          {currentConfidence > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="text-xs text-gray-400">
                {Math.round(currentConfidence)}%
              </div>
              <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentConfidence}%` }}
                  className={`h-full transition-colors ${
                    currentConfidence >= autoSendThreshold ? 'bg-green-400' :
                    currentConfidence >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send button */}
        <motion.button
          whileHover={message.trim() && !disabled && !isTyping && !showAutoSendCountdown ? { scale: 1.1 } : {}}
          whileTap={message.trim() && !disabled && !isTyping && !showAutoSendCountdown ? { scale: 0.9 } : {}}
          onClick={() => handleSend()}
          disabled={!message.trim() || disabled || isTyping || showAutoSendCountdown || isProcessing}
          className={`p-3 rounded-xl transition-all ${
            message.trim() && !disabled && !isTyping && !showAutoSendCountdown && !isProcessing
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25'
              : 'bg-white/10 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </motion.button>
      </motion.div>

      {/* Status indicators */}
      <AnimatePresence>
        {(isVoiceActive || suggestionsLoading || contextualHints.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-2 flex items-center justify-between text-xs text-gray-400"
          >
            <div className="flex items-center gap-4">
              {isVoiceActive && (
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-red-400 rounded-full"
                  />
                  <span>Listening...</span>
                </div>
              )}
              
              {suggestionsLoading && (
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full"
                  />
                  <span>Analyzing...</span>
                </div>
              )}
              
              {contextualHints.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>💡</span>
                  <span>{contextualHints[0]}</span>
                </div>
              )}
            </div>
            
            <div className="text-gray-500">
              Hold Space to speak • Enter to send • Esc to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MatrixChatBar;
