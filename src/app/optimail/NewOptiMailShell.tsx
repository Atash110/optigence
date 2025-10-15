'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Moon, Sun, Layers, Calendar, Users, Sparkles, Mic, Copy, ExternalLink } from 'lucide-react';
import EnhancedVoiceInput from '@/components/EnhancedVoiceInput';
import { VoiceResult } from '@/lib/voice';

interface LiveSuggestion {
  id: string;
  type: string;
  position: number;
  original: string;
  suggestion: string;
  confidence: number;
  reason: string;
  auto_apply: boolean;
}

export default function OptiMailShell() {
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showDraft, setShowDraft] = useState(false);
  const [lastVoiceResult, setLastVoiceResult] = useState<VoiceResult | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<LiveSuggestion[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCrossModule, setShowCrossModule] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  // Typing animation effect for draft
  useEffect(() => {
    if (showDraft && typeof draftContent === 'string' && typingIndex < draftContent.length) {
      const timer = setTimeout(() => {
        setTypingIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showDraft, draftContent, typingIndex]);

  // Real AI email generation using the API
  const generateEmail = async (prompt: string) => {
    setIsDrafting(true);
    setShowDraft(true);
    setTypingIndex(0);
    
    try {
      // Call the real draft API
      const response = await fetch('/api/optimail/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: prompt,
          userMemory: {
            tone: 'professional',
            language: 'en',
            name: 'User' // This could come from user settings
          },
          quickMode: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the structured response from the API
      if (result.primary) {
        const emailContent = `Subject: ${result.primary.subject}\n\n${result.primary.body}`;
        setDraftContent(emailContent);
        
        // Set alternatives if available
        if (result.alternatives && result.alternatives.length > 0) {
          setTimeout(() => {
            const alternativeTexts = result.alternatives.map((alt: { subject: string; body: string }) => 
              `Subject: ${alt.subject}\n\n${alt.body}`
            );
            setAlternatives(alternativeTexts);
          }, 1000);
        }
      } else if (result.draft) {
        // Handle quickMode response
        const emailContent = `Subject: ${result.draft.subject}\n\n${result.draft.body}`;
        setDraftContent(emailContent);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Failed to generate email:', error);
      
      // Fallback to enhanced mock generation with better intent detection
      const emailContent = await generateFallbackEmail(prompt);
      setDraftContent(emailContent);
    } finally {
      setIsDrafting(false);
    }
  };

  // Enhanced fallback with better intent detection
  const generateFallbackEmail = async (prompt: string): Promise<string> => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Enhanced intent detection patterns
    const intents = {
      followUp: /follow.?up|check.?in|touching base|circling back/i,
      meeting: /meeting|schedule|call|appointment|discuss|chat/i,
      thank: /thank|grateful|appreciate|thanks/i,
      request: /request|need|could you|would you|asking for/i,
      introduction: /introduce|introduction|meet|connect/i,
      apology: /sorry|apologize|regret|mistake/i,
      reminder: /remind|reminder|deadline|due|urgent/i,
      invitation: /invite|invitation|join|participate/i,
      feedback: /feedback|thoughts|opinion|review/i,
      update: /update|status|progress|report/i,
    };

    let detectedIntent = 'general';
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(lowerPrompt)) {
        detectedIntent = intent;
        break;
      }
    }

    // Generate subject based on intent
    let subject = '';
    let body = '';

    switch (detectedIntent) {
      case 'followUp':
        subject = 'Following up on our discussion';
        body = `Hi [Recipient],\n\nI wanted to follow up on our previous conversation regarding ${prompt.replace(/follow.?up|check.?in|touching base|circling back/gi, '').trim()}.\n\nI hope this email finds you well. Please let me know if you need any additional information from my side or if there are any next steps I should be aware of.\n\nLooking forward to hearing from you.\n\nBest regards`;
        break;
        
      case 'meeting':
        subject = 'Meeting request - ' + prompt.slice(0, 30) + '...';
        body = `Hi [Recipient],\n\nI hope this email finds you well. I would like to schedule a meeting to discuss ${prompt.replace(/meeting|schedule|call|appointment|discuss|chat/gi, '').trim()}.\n\nWould you be available for a call sometime this week or next? I'm flexible with timing and can work around your schedule.\n\nPlease let me know what works best for you.\n\nBest regards`;
        break;
        
      case 'thank':
        subject = 'Thank you';
        body = `Hi [Recipient],\n\nI wanted to take a moment to express my sincere gratitude for ${prompt.replace(/thank|grateful|appreciate|thanks/gi, '').trim()}.\n\nYour support and assistance have been invaluable, and I truly appreciate the time and effort you've invested.\n\nThank you once again for everything.\n\nBest regards`;
        break;
        
      case 'request':
        subject = 'Request - ' + prompt.slice(0, 30) + '...';
        body = `Hi [Recipient],\n\nI hope you're doing well. I'm reaching out to request ${prompt.replace(/request|need|could you|would you|asking for/gi, '').trim()}.\n\nIf this is something you could assist with, I would be very grateful. Please let me know if you need any additional information from me.\n\nThank you for considering my request.\n\nBest regards`;
        break;
        
      case 'introduction':
        subject = 'Introduction - ' + prompt.slice(0, 30) + '...';
        body = `Hi [Recipient],\n\nI hope this email finds you well. I wanted to reach out to introduce ${prompt.replace(/introduce|introduction|meet|connect/gi, '').trim()}.\n\nI thought it would be valuable for both parties to connect, given your shared interests and expertise.\n\nPlease let me know if you'd like me to facilitate an introduction.\n\nBest regards`;
        break;
        
      case 'apology':
        subject = 'My apologies';
        body = `Hi [Recipient],\n\nI want to sincerely apologize for ${prompt.replace(/sorry|apologize|regret|mistake/gi, '').trim()}.\n\nI understand this may have caused inconvenience, and I take full responsibility. I'm committed to ensuring this doesn't happen again.\n\nPlease let me know how I can make this right.\n\nSincerely`;
        break;
        
      case 'reminder':
        subject = 'Friendly reminder - ' + prompt.slice(0, 25) + '...';
        body = `Hi [Recipient],\n\nI wanted to send a friendly reminder about ${prompt.replace(/remind|reminder|deadline|due|urgent/gi, '').trim()}.\n\nIf you need any clarification or assistance with this matter, please don't hesitate to reach out.\n\nThank you for your attention to this.\n\nBest regards`;
        break;
        
      case 'invitation':
        subject = 'Invitation - ' + prompt.slice(0, 30) + '...';
        body = `Hi [Recipient],\n\nI hope this email finds you well. I would like to invite you to ${prompt.replace(/invite|invitation|join|participate/gi, '').trim()}.\n\nI believe this would be a great opportunity, and your participation would be highly valued.\n\nPlease let me know if you're interested and available.\n\nBest regards`;
        break;
        
      case 'feedback':
        subject = 'Seeking your feedback';
        body = `Hi [Recipient],\n\nI hope you're doing well. I'm reaching out to get your feedback on ${prompt.replace(/feedback|thoughts|opinion|review/gi, '').trim()}.\n\nYour insights and expertise would be incredibly valuable in helping me improve and move forward effectively.\n\nI'd be happy to schedule a call if that would be easier than responding via email.\n\nThank you for your time and consideration.\n\nBest regards`;
        break;
        
      case 'update':
        subject = 'Update - ' + prompt.slice(0, 30) + '...';
        body = `Hi [Recipient],\n\nI wanted to provide you with an update on ${prompt.replace(/update|status|progress|report/gi, '').trim()}.\n\nI'll continue to keep you informed as things progress. Please let me know if you have any questions or need additional details.\n\nBest regards`;
        break;
        
      default:
        subject = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
        body = `Hi [Recipient],\n\nI hope this email finds you well. I wanted to reach out regarding ${prompt}.\n\nPlease let me know your thoughts or if you need any additional information from me.\n\nLooking forward to hearing from you.\n\nBest regards`;
    }

    return `Subject: ${subject}\n\n${body}`;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isDrafting) return;
    await generateEmail(input);
  };

  const handleTranscriptSubmit = (transcriptText: string) => {
    setTranscript(transcriptText);
    setInput(transcriptText);
  };

  const clearDraft = () => {
    setShowDraft(false);
    setDraftContent('');
    setAlternatives([]);
    setTypingIndex(0);
  };

  // Enhanced live suggestions based on real intent detection
  useEffect(() => {
    if (input.length > 10) {
      const generateSuggestions = async () => {
        try {
          // Try to use the real intent API
          const response = await fetch('/api/optimail/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input }),
          });
          
          if (response.ok) {
            const intentResult = await response.json();
            
            // Generate suggestions based on detected intent
            const suggestions = generateSuggestionsFromIntent(input, intentResult);
            setLiveSuggestions(suggestions);
          } else {
            // Fallback to local pattern matching
            const suggestions = generateLocalSuggestions(input);
            setLiveSuggestions(suggestions);
          }
        } catch (error) {
          console.error('Intent detection failed:', error);
          // Fallback to local pattern matching
          const suggestions = generateLocalSuggestions(input);
          setLiveSuggestions(suggestions);
        }
      };
      
      // Debounce the suggestions
      const timeoutId = setTimeout(generateSuggestions, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setLiveSuggestions([]);
    }
  }, [input]);

  const generateSuggestionsFromIntent = (text: string, intentResult: { intent?: string; confidence?: number; reasoning?: string }): LiveSuggestion[] => {
    const suggestions: LiveSuggestion[] = [];
    
    if (intentResult.intent) {
      switch (intentResult.intent) {
        case 'reply':
          suggestions.push({
            id: 'reply-formal',
            type: 'enhancement',
            position: 0,
            original: text,
            suggestion: 'Make reply more formal',
            confidence: 0.85,
            reason: 'Professional replies get better responses',
            auto_apply: false
          });
          break;
          
        case 'calendar':
        case 'schedule':
          suggestions.push({
            id: 'calendar-integration',
            type: 'integration',
            position: 0,
            original: text,
            suggestion: 'Add calendar integration',
            confidence: 0.90,
            reason: 'Include meeting availability',
            auto_apply: false
          });
          break;
          
        case 'compose':
          suggestions.push({
            id: 'compose-professional',
            type: 'tone',
            position: 0,
            original: text,
            suggestion: 'Use professional tone',
            confidence: 0.80,
            reason: 'Professional emails have higher response rates',
            auto_apply: false
          });
          break;
          
        default:
          suggestions.push({
            id: 'general-improve',
            type: 'enhancement',
            position: 0,
            original: text,
            suggestion: 'Add more context',
            confidence: 0.70,
            reason: 'More context improves clarity',
            auto_apply: false
          });
      }
    }
    
    return suggestions;
  };

  const generateLocalSuggestions = (text: string): LiveSuggestion[] => {
    const lowerText = text.toLowerCase();
    const suggestions: LiveSuggestion[] = [];
    
    // Pattern-based suggestions
    if (lowerText.includes('meeting') || lowerText.includes('schedule')) {
      suggestions.push({
        id: 'meeting-suggestion',
        type: 'enhancement',
        position: 0,
        original: text,
        suggestion: 'Include specific time slots',
        confidence: 0.85,
        reason: 'Specific times get faster responses',
        auto_apply: false
      });
    }
    
    if (lowerText.includes('follow') || lowerText.includes('check')) {
      suggestions.push({
        id: 'followup-suggestion',
        type: 'enhancement',
        position: 0,
        original: text,
        suggestion: 'Reference previous conversation',
        confidence: 0.80,
        reason: 'Context improves follow-up effectiveness',
        auto_apply: false
      });
    }
    
    if (lowerText.includes('urgent') || lowerText.includes('asap')) {
      suggestions.push({
        id: 'urgency-suggestion',
        type: 'tone',
        position: 0,
        original: text,
        suggestion: 'Explain the urgency reason',
        confidence: 0.75,
        reason: 'Justified urgency gets better responses',
        auto_apply: false
      });
    }
    
    // Always suggest professional tone if not already professional
    if (!lowerText.includes('professional') && !lowerText.includes('formal')) {
      suggestions.push({
        id: 'tone-suggestion',
        type: 'tone',
        position: 0,
        original: text,
        suggestion: 'Use professional tone',
        confidence: 0.70,
        reason: 'Professional tone improves response rates',
        auto_apply: false
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b px-6 py-4`}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              OM
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>OptiMail</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>AI Email Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Calendar Integration Button */}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`p-2 rounded-lg transition-colors ${
                showCalendar
                  ? 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Calendar Integration"
            >
              <Calendar size={20} />
            </button>
            
            {/* Cross-Module Integration Button */}
            <button
              onClick={() => setShowCrossModule(!showCrossModule)}
              className={`p-2 rounded-lg transition-colors ${
                showCrossModule
                  ? 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Cross-Module Integration"
            >
              <Layers size={20} />
            </button>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Email Composer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <div className={`${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl border p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Quick Actions</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setInput('Write a professional follow-up email')}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📧 Follow Up
                </button>
                <button 
                  onClick={() => setInput('Schedule a meeting for next week')}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📅 Schedule
                </button>
                <button 
                  onClick={() => setInput('Write a thank you email')}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🙏 Thank You
                </button>
                <button 
                  onClick={() => setInput('Request information about')}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ℹ️ Request Info
                </button>
              </div>
            </div>

            {/* Voice Transcript Display */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
                } rounded-lg border p-4`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={16} className="text-blue-500" />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>Voice Input</span>
                </div>
                <p className={`${
                  isDarkMode ? 'text-blue-100' : 'text-blue-800'
                }`}>{transcript}</p>
              </motion.div>
            )}

            {/* Main Input Section */}
            <div className={`${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl border p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Compose Email</h2>
              
              <div className="space-y-4">
                {/* Input Field */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Describe the email you need... (e.g., 'Write a follow-up email about the project proposal')"
                    disabled={isDrafting}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                  {isDrafting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Input Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Voice Input */}
                    <EnhancedVoiceInput
                      isRecording={isRecording}
                      onRecordingChange={setIsRecording}
                      onTranscript={handleTranscriptSubmit}
                      onVoiceResult={(result) => setLastVoiceResult(result)}
                      voiceConfig={{ 
                        provider: 'openai',
                        language: 'en-US',
                        enhanced: true 
                      }}
                      showProviderSelection={false}
                      className="flex-shrink-0"
                    />
                    
                    {/* Clear Button */}
                    {input && (
                      <button
                        onClick={() => setInput('')}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          isDarkMode
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isDrafting || !input.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      isDrafting || !input.trim()
                        ? isDarkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {isDrafting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Generate Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Email Display */}
            <AnimatePresence>
              {showDraft && draftContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } rounded-xl border p-6`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Generated Email</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(typeof draftContent === 'string' ? draftContent : '')}
                        className={`text-sm px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                      <button
                        onClick={clearDraft}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className={`${
                    isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
                  } rounded-lg p-4 font-mono text-sm`}>
                    <div 
                      ref={draftRef}
                      className={`whitespace-pre-wrap ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}
                    >
                      {typeof draftContent === 'string' ? draftContent.slice(0, typingIndex) : ''}
                      {typeof draftContent === 'string' && typingIndex < draftContent.length && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-0.5 h-4 bg-blue-500 ml-1"
                        />
                      )}
                    </div>
                  </div>

                  {/* Alternative versions */}
                  {alternatives.length > 0 && typeof draftContent === 'string' && typingIndex >= draftContent.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <p className={`text-sm font-medium mb-3 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Alternative versions:
                      </p>
                      <div className="grid gap-2">
                        {alternatives.slice(0, 3).map((alt, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setDraftContent(alt);
                              setTypingIndex(0);
                            }}
                            className={`text-left text-sm p-3 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="font-medium mb-1">Version {index + 1}</div>
                            <div className="text-xs opacity-70">
                              {alt.slice(0, 100)}...
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Assistant Panel */}
          <div className="space-y-6">
            
            {/* Live Suggestions */}
            <div className={`${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl border p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-yellow-500" />
                <h3 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Smart Suggestions</h3>
              </div>
              
              {liveSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {liveSuggestions.slice(0, 3).map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border-l-4 border-blue-500 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {suggestion.suggestion}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {suggestion.reason}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`text-xs px-2 py-1 rounded ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </div>
                        <button
                          onClick={() => setInput(input + ' ' + suggestion.suggestion)}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Start typing to see AI suggestions...
                </p>
              )}
            </div>

            {/* Status Indicators */}
            <div className={`${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl border p-6`}>
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Voice Recognition</span>
                  <div className={`w-3 h-3 rounded-full ${
                    isRecording ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>AI Processing</span>
                  <div className={`w-3 h-3 rounded-full ${
                    isDrafting ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Calendar</span>
                  <div className={`w-3 h-3 rounded-full ${
                    showCalendar ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className={`${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl border p-6`}>
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Quick Access</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => window.open('/optihire', '_blank')}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink size={16} />
                  OptiHire (Recruiting)
                </button>
                
                <button
                  onClick={() => window.open('/optitrip', '_blank')}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink size={16} />
                  OptiTrip (Travel)
                </button>
                
                <button
                  onClick={() => window.open('/optishop', '_blank')}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink size={16} />
                  OptiShop (E-commerce)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Calendar Integration Modal */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } rounded-xl border p-6 max-w-md w-full`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Calendar Integration</h3>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Calendar integration is coming soon. This will allow you to:
              </p>
              <ul className={`text-sm space-y-2 mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <li>• Schedule meetings directly from emails</li>
                <li>• Check availability while composing</li>
                <li>• Auto-suggest meeting times</li>
                <li>• Sync with Google Calendar</li>
              </ul>
              <button
                onClick={() => setShowCalendar(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross-Module Integration Modal */}
      <AnimatePresence>
        {showCrossModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCrossModule(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } rounded-xl border p-6 max-w-md w-full`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Cross-Module Integration</h3>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Connect OptiMail with other Optigence modules:
              </p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setInput('Schedule interview for the developer position');
                    setShowCrossModule(false);
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">OptiHire Integration</div>
                  <div className="text-xs opacity-70">Send interview invitations</div>
                </button>
                
                <button
                  onClick={() => {
                    setInput('Confirm travel booking details');
                    setShowCrossModule(false);
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">OptiTrip Integration</div>
                  <div className="text-xs opacity-70">Travel confirmations</div>
                </button>
              </div>
              <button
                onClick={() => setShowCrossModule(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
