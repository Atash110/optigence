'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import VoiceInput from './VoiceInput';
import ContextDrawer from './ContextDrawer';
import ActionChips from './ActionChips';
import SendCountdownToast from './SendCountdownToast';
import WhyThisPopover from './WhyThisPopover';
import { 
  AgentResponse, 
  ActionSuggestion, 
  SmartReplyOption,
  AgentRequestBody 
} from '@/types/optimail';

const TYPING_SPEED_CPM = 300;
const TYPING_SPEED_MS_PER_CHAR = 60000 / TYPING_SPEED_CPM;

export default function OptiMailHyperAgent() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContextDrawer, setShowContextDrawer] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [currentDraft, setCurrentDraft] = useState('');
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [showWhyThis, setShowWhyThis] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Simulate typing effect for agent responses
  const simulateTyping = (text: string) => {
    setIsTyping(true);
    setTypingText('');
    
    let index = 0;
    const typeChar = () => {
      if (index < text.length) {
        setTypingText(prev => prev + text[index]);
        index++;
        typingTimeoutRef.current = setTimeout(typeChar, TYPING_SPEED_MS_PER_CHAR);
      } else {
        setIsTyping(false);
      }
    };
    
    typeChar();
  };

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const userInput = input.trim();
    setInput('');

    try {
      const requestBody: AgentRequestBody = {
        input: userInput,
        mode: 'auto',
        preferences: {
          tone: 'professional',
          language: 'en',
          autoIncludeSignature: true,
          trust_level: 0.95
        }
      };

      const response = await fetch('/api/optimail/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('Agent request failed');

      const data: AgentResponse = await response.json();
      setAgentResponse(data);

      // If we have a final draft, start typing it
      if (data.finalText) {
        simulateTyping(data.finalText);
        setCurrentDraft(data.finalText);
      }

      // If confidence is high enough, show auto-send countdown
      if (data.autoSend && data.autoSend.confidence >= 0.95) {
        setShowCountdown(true);
      }

    } catch (error) {
      console.error('Agent processing failed:', error);
      // Show error state
      setAgentResponse({
        steps: [{
          id: 'error',
          state: 'error',
          label: 'Processing failed',
          error: 'Unable to process your request. Please try again.'
        }],
        intent: {
          intent: 'unknown',
          confidence: 0
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript);
  };

  const handleActionChip = (action: ActionSuggestion) => {
    setSelectedChip(action.id);
    setInput(action.text);
    
    // Auto-submit if it's a high-confidence action
    if (action.priority > 80) {
      setTimeout(() => handleSubmit(), 100);
    }
  };

  const handleReplyOption = (reply: SmartReplyOption) => {
    setCurrentDraft(reply.body);
    simulateTyping(reply.body);
  };

  const handleSend = async () => {
    if (!currentDraft) return;
    
    setShowCountdown(false);
    
    try {
      // Send the email via API
      const response = await fetch('/api/optimail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentDraft,
          recipient: agentResponse?.autoSend?.recipientHint
        })
      });

      if (response.ok) {
        // Show success and reset
        setCurrentDraft('');
        setAgentResponse(null);
        setTypingText('');
      }
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleCancel = () => {
    setShowCountdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#0D1B2A] to-[#1B263B] text-white font-['Geist'] relative overflow-hidden">
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-sm font-bold">OM</span>
          </div>
          <span className="text-lg font-semibold text-blue-100">OptiMail</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowContextDrawer(!showContextDrawer)}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        
        {/* Draft Display Area */}
        <div className="p-6">
          <AnimatePresence>
            {(typingText || currentDraft) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Draft Email</span>
                    {agentResponse?.intent && (
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg">
                        {Math.round(agentResponse.intent.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                  
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {typingText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </div>

                  {/* Action Buttons */}
                  {currentDraft && !isTyping && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSend}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center space-x-2"
                        >
                          <PaperAirplaneIcon className="w-4 h-4" />
                          <span>Send</span>
                        </button>
                        
                        <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-colors">
                          Adjust
                        </button>
                        
                        <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl font-medium transition-colors">
                          Save Template
                        </button>
                      </div>

                      {agentResponse?.autoSend && (
                        <button
                          onClick={() => setShowWhyThis(currentDraft)}
                          className="text-slate-400 hover:text-slate-300 text-sm flex items-center space-x-1"
                        >
                          <InformationCircleIcon className="w-4 h-4" />
                          <span>Why this?</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reply Options */}
          <AnimatePresence>
            {agentResponse?.replyOptions && agentResponse.replyOptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm text-slate-400 mb-3">Alternative Drafts</h3>
                <div className="space-y-2">
                  {agentResponse.replyOptions.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleReplyOption(reply)}
                      className="w-full text-left p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-colors border border-slate-700/30 hover:border-slate-600/50"
                    >
                      <div className="font-medium text-slate-200 mb-1">{reply.label}</div>
                      <div className="text-sm text-slate-400 line-clamp-2">{reply.body}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Chips */}
      <AnimatePresence>
        {agentResponse?.actionSuggestions && agentResponse.actionSuggestions.length > 0 && (
          <ActionChips
            actions={agentResponse.actionSuggestions}
            onActionSelect={handleActionChip}
            selectedChip={selectedChip}
          />
        )}
      </AnimatePresence>

      {/* Super Chat Bar */}
      <div className="relative z-20 p-4 border-t border-slate-800/50 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center space-x-3">
            
            {/* Voice Input */}
            <VoiceInput
              onResult={handleVoiceInput}
              isListening={isListening}
              setIsListening={setIsListening}
            />

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your email in 2-5 words..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/70 transition-all"
                disabled={isProcessing}
              />
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed rounded-2xl transition-colors"
              title="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Drawer */}
      <ContextDrawer 
        isOpen={showContextDrawer}
        onClose={() => setShowContextDrawer(false)}
      />

      {/* Auto-Send Countdown Toast */}
      <AnimatePresence>
        {showCountdown && agentResponse?.autoSend && (
          <SendCountdownToast
            countdown={agentResponse.autoSend.countdownSeconds}
            recipientName={agentResponse.autoSend.recipientHint}
            onSend={handleSend}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      {/* Why This Popover */}
      <WhyThisPopover
        isOpen={!!showWhyThis}
        onClose={() => setShowWhyThis(null)}
        explanation={agentResponse?.autoSend ? "High confidence match based on your previous email patterns and current context." : ""}
      />

    </div>
  );
}
