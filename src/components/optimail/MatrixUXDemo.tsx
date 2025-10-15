'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MatrixChatBar from '@/components/optimail/MatrixChatBar2';
import LiveSuggestions from '@/components/optimail/LiveSuggestions';
import { ActionSuggestion } from '@/lib/optimail/live-suggestions';

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  mockInput: string;
  confidence: number;
  intent: string;
}

const MatrixUXDemo: React.FC = () => {
  const [demoMessage, setDemoMessage] = useState('');
  const [demoConfidence, setDemoConfidence] = useState(0);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('');

  const demoScenarios = [
    {
      id: 'high_confidence_reply',
      name: 'High Confidence Reply',
      description: 'Voice input with 88% confidence triggering auto-send countdown',
      mockInput: 'Thanks for the detailed report Sarah. I reviewed everything and approve the budget allocation for Q2.',
      confidence: 88,
      intent: 'reply'
    },
    {
      id: 'meeting_schedule',
      name: 'Meeting Scheduling',
      description: 'Calendar integration with live suggestions',
      mockInput: 'Can we schedule a team meeting for next Tuesday at 2 PM to discuss the product roadmap?',
      confidence: 82,
      intent: 'calendar'
    },
    {
      id: 'urgent_response',
      name: 'Urgent Response',
      description: 'High urgency detection with priority suggestions',
      mockInput: 'URGENT: Server is down and customers are unable to access their accounts. Need immediate action.',
      confidence: 94,
      intent: 'reply'
    },
    {
      id: 'travel_planning',
      name: 'Cross-Module Travel',
      description: 'Cross-module routing to OptiTrip',
      mockInput: 'I need to book a flight to San Francisco for the conference next month and find a hotel near the venue.',
      confidence: 76,
      intent: 'template'
    },
    {
      id: 'multilingual',
      name: 'Multilingual Translation',
      description: 'Language detection with translation suggestions',
      mockInput: 'Bonjour, j\'aimerais discuter du projet avec votre équipe. Pouvons-nous organiser une réunion?',
      confidence: 91,
      intent: 'translate'
    }
  ];

  const handleSendMessage = async (message: string, confidence: number, isAutoSend = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${isAutoSend ? '🤖 AUTO-SENT' : '👤 SENT'}: "${message}" (${confidence}% confidence)`;
    
    setDemoLogs(prev => [...prev, logEntry]);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Promise.resolve();
  };

  const handleVoiceInput = (transcript: string, confidence: number) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] 🎤 VOICE: "${transcript}" (${confidence}% confidence)`;
    setDemoLogs(prev => [...prev, logEntry]);
  };

  const handleSuggestionClick = (suggestion: ActionSuggestion) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] 💡 SUGGESTION: Executed "${suggestion.label}"`;
    setDemoLogs(prev => [...prev, logEntry]);
  };

  const runScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario.id);
    setDemoMessage(scenario.mockInput);
    setDemoConfidence(scenario.confidence);
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] 🎬 SCENARIO: Running "${scenario.name}"`;
    setDemoLogs(prev => [...prev, logEntry]);
  };

  const clearLogs = () => {
    setDemoLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Matrix background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="matrix-rain"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🔮 Phase 5: Matrix-Level UX
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Super Chat Bar with AI-driven suggestions, confidence-based auto-send & humanized animations
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-white">Auto-Send at 85%+</h3>
              <p className="text-sm text-gray-300">3-second countdown with cancel option</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-semibold text-white">300 CPM Typing</h3>
              <p className="text-sm text-gray-300">Humanized animation with variance</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="font-semibold text-white">Live Suggestions</h3>
              <p className="text-sm text-gray-300">Context-aware AI recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Demo scenarios */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">🎬 Demo Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoScenarios.map((scenario) => (
              <motion.button
                key={scenario.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => runScenario(scenario)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedScenario === scenario.id
                    ? 'bg-blue-500/30 border-blue-400 text-white'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                <h3 className="font-semibold mb-2">{scenario.name}</h3>
                <p className="text-sm opacity-80 mb-2">{scenario.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    scenario.confidence >= 85 ? 'bg-green-500/20 text-green-300' :
                    scenario.confidence >= 70 ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {scenario.confidence}%
                  </span>
                  <span className="text-gray-400">{scenario.intent}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Live demo area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main chat area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">🚀 Matrix Chat Bar</h3>
              
              {/* Live suggestions demo */}
              {demoMessage && (
                <div className="mb-6">
                  <LiveSuggestions
                    userInput={demoMessage}
                    intent={demoScenarios.find(s => s.id === selectedScenario)?.intent || 'compose'}
                    confidence={demoConfidence / 100}
                    onSuggestionClick={handleSuggestionClick}
                    className="mb-4"
                  />
                </div>
              )}
              
              {/* Matrix Chat Bar */}
              <MatrixChatBar
                onSendMessage={handleSendMessage}
                onVoiceInput={handleVoiceInput}
                autoSendThreshold={85}
                animationSpeed={300}
                placeholder="Type a message or run a scenario..."
              />
              
              {/* Current demo state */}
              {(demoMessage || demoConfidence > 0) && (
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <div className="text-sm text-gray-300">
                    <div><strong>Demo Input:</strong> {demoMessage}</div>
                    <div><strong>Confidence:</strong> {demoConfidence}%</div>
                    {demoConfidence >= 85 && (
                      <div className="text-green-400"><strong>⚡ Auto-Send Ready:</strong> Will trigger countdown</div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Activity log */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">📊 Activity Log</h3>
                <button
                  onClick={clearLogs}
                  className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {demoLogs.length === 0 ? (
                  <div className="text-gray-500 text-sm italic text-center py-8">
                    Run a scenario to see activity...
                  </div>
                ) : (
                  demoLogs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-xs font-mono bg-black/20 p-2 rounded border-l-2 border-blue-400/50 text-gray-300"
                    >
                      {log}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Technical details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">🔧 Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Auto-Send Logic</h4>
              <ul className="space-y-1">
                <li>• Triggers at 85%+ confidence threshold</li>
                <li>• 3-second countdown with visual indicator</li>
                <li>• Cancellable with Escape key or button</li>
                <li>• Trust-level based adjustments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Humanized Typing</h4>
              <ul className="space-y-1">
                <li>• 300 characters per minute base speed</li>
                <li>• ±30% variance for human-like rhythm</li>
                <li>• Slower for punctuation and spaces</li>
                <li>• Visual typing indicators</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Live Suggestions</h4>
              <ul className="space-y-1">
                <li>• Context-aware AI recommendations</li>
                <li>• Intent-based suggestion categories</li>
                <li>• Cross-module routing integration</li>
                <li>• Confidence-based ranking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Voice Integration</h4>
              <ul className="space-y-1">
                <li>• Push-to-talk with space bar</li>
                <li>• Real-time confidence scoring</li>
                <li>• Voice-to-text with animation</li>
                <li>• Audio waveform visualization</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Phase 5: Matrix-Level UX - ACTIVE</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .matrix-rain {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
          );
          animation: matrix-scroll 20s linear infinite;
        }
        
        @keyframes matrix-scroll {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default MatrixUXDemo;
