'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  MicrophoneIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  BookmarkIcon,
  ClockIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import VoiceInput from './VoiceInput';
import SmartReply from './SmartReply';
// import TemplateSaver from './TemplateSaver';
import MultiLLMRouter, { EmailGeneration } from '@/lib/optimail/multiLLM';

interface OptiMailAgentProps {
  userPlan?: 'free' | 'pro' | 'elite';
}

type ActiveMode = 'voice' | 'compose' | 'reply' | 'templates' | 'settings';

export default function OptiMailAgent({ userPlan = 'free' }: OptiMailAgentProps) {
  const [activeMode, setActiveMode] = useState<ActiveMode>('voice');
  const [emailThread, setEmailThread] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<EmailGeneration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentEmails, setRecentEmails] = useState<EmailGeneration[]>([]);
  
  const llmRouter = useRef(new MultiLLMRouter());

  const handleVoiceTranscription = useCallback((text: string, intent: string) => {
    console.log('Voice transcription:', text, 'Intent:', intent);
    
    // Auto-switch to compose mode if voice input detected composition intent
    if (intent.includes('compose') || intent.includes('write') || intent.includes('send')) {
      setActiveMode('compose');
    }
  }, []);

  const handleVoiceEmailGenerated = useCallback((email: EmailGeneration) => {
    setGeneratedEmail(email);
    setRecentEmails(prev => [email, ...prev.slice(0, 4)]);
    setActiveMode('compose');
  }, []);

  const handleReplyGenerated = useCallback((reply: EmailGeneration) => {
    setGeneratedEmail(reply);
    setRecentEmails(prev => [reply, ...prev.slice(0, 4)]);
  }, []);

  const handleTextCompose = async (input: string) => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const email = await llmRouter.current.generateEmail({
        purpose: input,
        tone: 'professional'
      });
      
      setGeneratedEmail(email);
      setRecentEmails(prev => [email, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Failed to generate email:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const modeButtons = [
    {
      id: 'voice' as ActiveMode,
      icon: MicrophoneIcon,
      label: 'Voice Input',
      description: 'Speak your email intent',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'compose' as ActiveMode,
      icon: PencilSquareIcon,
      label: 'Compose',
      description: 'Write new email',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'reply' as ActiveMode,
      icon: ChatBubbleLeftRightIcon,
      label: 'Smart Reply',
      description: 'Generate replies',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'templates' as ActiveMode,
      icon: BookmarkIcon,
      label: 'Templates',
      description: 'Saved templates',
      color: 'from-orange-500 to-amber-600'
    },
    {
      id: 'settings' as ActiveMode,
      icon: CogIcon,
      label: 'Settings',
      description: 'Preferences',
      color: 'from-gray-500 to-slate-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <RocketLaunchIcon className="w-12 h-12 text-blue-500 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OptiMail Agent
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Revolutionary AI email assistant with voice input, smart replies, and agentive automation
          </p>
          
          {/* Plan Badge */}
          <div className="mt-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              userPlan === 'elite' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
              userPlan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
            }`}>
              {userPlan.toUpperCase()} Plan
            </span>
          </div>
        </motion.div>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {modeButtons.map((mode) => (
              <motion.button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                  activeMode === mode.id
                    ? `bg-gradient-to-r ${mode.color} text-white shadow-lg shadow-${mode.color.split('-')[1]}-500/30 scale-105`
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
                whileHover={{ scale: activeMode === mode.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center space-y-2 min-w-[100px]">
                  <mode.icon className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium text-sm">{mode.label}</p>
                    <p className="text-xs opacity-80">{mode.description}</p>
                  </div>
                </div>
                
                {activeMode === mode.id && (
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Primary Interface */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* Voice Input Mode */}
              {activeMode === 'voice' && (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <div className="flex items-center mb-6">
                    <MicrophoneIcon className="w-8 h-8 text-blue-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Voice Email Assistant
                    </h2>
                  </div>
                  
                  <VoiceInput
                    onTranscription={handleVoiceTranscription}
                    onEmailGenerated={handleVoiceEmailGenerated}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              )}

              {/* Compose Mode */}
              {activeMode === 'compose' && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <div className="flex items-center mb-6">
                    <PencilSquareIcon className="w-8 h-8 text-green-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Compose Email
                    </h2>
                  </div>
                  
                  <ComposeInterface 
                    onGenerate={handleTextCompose}
                    isProcessing={isProcessing}
                    generatedEmail={generatedEmail}
                  />
                </motion.div>
              )}

              {/* Smart Reply Mode */}
              {activeMode === 'reply' && (
                <motion.div
                  key="reply"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <div className="flex items-center mb-6">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Smart Reply
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Thread to Reply To:
                      </label>
                      <textarea
                        value={emailThread}
                        onChange={(e) => setEmailThread(e.target.value)}
                        placeholder="Paste the email thread you want to reply to..."
                        className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {emailThread.trim() && (
                      <SmartReply
                        originalEmail={emailThread}
                        onReplyGenerated={handleReplyGenerated}
                        userPlan={userPlan}
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Templates Mode */}
              {activeMode === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <div className="flex items-center mb-6">
                    <BookmarkIcon className="w-8 h-8 text-orange-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Email Templates
                    </h2>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      Template saving feature - Coming soon
                    </p>
                    {generatedEmail && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Current email ready to save as template
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Settings Mode */}
              {activeMode === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
                >
                  <div className="flex items-center mb-6">
                    <CogIcon className="w-8 h-8 text-gray-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Settings & Preferences
                    </h2>
                  </div>
                  
                  <SettingsPanel userPlan={userPlan} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Recent Emails */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center mb-4">
                <ClockIcon className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Emails</h3>
              </div>
              
              {recentEmails.length > 0 ? (
                <div className="space-y-3">
                  {recentEmails.map((email, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {email.tone} • {Math.round((email.confidence || 0.85) * 100)}% confidence
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No recent emails generated
                </p>
              )}
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl p-6 border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center mb-4">
                <LightBulbIcon className="w-6 h-6 text-purple-500 mr-2" />
                <h3 className="font-bold text-purple-900 dark:text-purple-100">AI Insights</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <SparklesIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-purple-700 dark:text-purple-300">
                    Voice input increases productivity by 3x compared to typing
                  </p>
                </div>
                
                <div className="flex items-start">
                  <SparklesIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-purple-700 dark:text-purple-300">
                    Professional tone has 94% better response rates
                  </p>
                </div>
                
                <div className="flex items-start">
                  <SparklesIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-purple-700 dark:text-purple-300">
                    Best sending time for your emails: 10:00 AM
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Upgrade Prompt for Free Users */}
            {userPlan === 'free' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-3xl p-6 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center mb-4">
                  <RocketLaunchIcon className="w-6 h-6 text-yellow-500 mr-2" />
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Upgrade to Pro</h3>
                </div>
                
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Unlock unlimited voice input, advanced AI models, and priority processing
                </p>
                
                <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                  Upgrade Now
                </button>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// Compose Interface Component
function ComposeInterface({ 
  onGenerate, 
  isProcessing, 
  generatedEmail 
}: { 
  onGenerate: (input: string) => void; 
  isProcessing: boolean; 
  generatedEmail: EmailGeneration | null; 
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onGenerate(input);
      setInput('');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Describe your email intent:
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., 'Write a follow-up email to Sarah about the project proposal we discussed yesterday'"
            className="w-full h-24 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isProcessing}
          />
        </div>
        
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
        >
          {isProcessing ? (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate Email
            </>
          )}
        </button>
      </form>

      {generatedEmail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Generated Email:</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject:
              </label>
              <p className="text-gray-900 dark:text-white">{generatedEmail.subject}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Body:
              </label>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-gray-900 dark:text-white whitespace-pre-line">
                  {generatedEmail.content}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Tone: <strong>{generatedEmail.tone}</strong>
              </span>
              <span className="text-green-600 dark:text-green-400">
                Confidence: <strong>{Math.round((generatedEmail.confidence || 0.85) * 100)}%</strong>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ userPlan }: { userPlan: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Email Preferences</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Auto-save generated emails as templates</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Enable voice input by default</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Show confidence scores</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">AI Model Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Tone:
              </label>
              <select 
                title="Select default email tone"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="diplomatic">Diplomatic</option>
                <option value="enthusiastic">Enthusiastic</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Response Length:
              </label>
              <select 
                title="Select response length preference"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="concise">Concise</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Plan Information</h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-gray-900 dark:text-white">
              Current Plan: <strong className="capitalize">{userPlan}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {userPlan === 'free' ? 'Limited to 2 reply options' : 
               userPlan === 'pro' ? 'Up to 4 reply options with advanced features' :
               'Unlimited features with priority processing'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
