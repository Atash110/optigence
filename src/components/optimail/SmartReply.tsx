'use client';

import { useState, useCallback } from 'react';
import { ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { EmailGeneration } from '@/lib/optimail/multiLLM';

interface SmartReplyProps {
  originalEmail: string;
  onReplyGenerated: (reply: EmailGeneration) => void;
  userPlan?: 'free' | 'pro' | 'elite';
}

export default function SmartReply({ 
  originalEmail, 
  onReplyGenerated, 
  userPlan = 'free' 
}: SmartReplyProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateReplySuggestions = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Mock implementation - in real version would call API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSuggestions = [
        'Thank you for your email. I will review the details and get back to you shortly.',
        'I appreciate you bringing this to my attention. Let me look into this matter further.',
        'Thanks for reaching out. I\'ll need some additional information to proceed.'
      ];
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error generating reply suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const selectSuggestion = useCallback((suggestion: string) => {
    const mockReply: EmailGeneration = {
      id: 'reply_' + Date.now(),
      subject: 'Re: Email Reply',
      content: suggestion,
      tone: 'professional',
      timestamp: new Date(),
      confidence: 0.88
    };
    
    onReplyGenerated(mockReply);
  }, [onReplyGenerated]);

  return (
    <div className="smart-reply-container">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">Smart Reply</h3>
          {userPlan !== 'free' && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
              {userPlan.toUpperCase()}
            </span>
          )}
        </div>

        {originalEmail && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-1">Original email:</p>
            <p className="text-gray-800 dark:text-gray-200 line-clamp-3">
              {originalEmail.substring(0, 150)}...
            </p>
          </div>
        )}

        {suggestions.length === 0 && !isGenerating && (
          <motion.button
            onClick={generateReplySuggestions}
            className="w-full p-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SparklesIcon className="w-5 h-5" />
            <span>Generate Smart Replies</span>
          </motion.button>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center p-6">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <motion.div
                className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm">Generating smart replies...</span>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggested replies:
            </p>
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-sm text-gray-800 dark:text-gray-200">{suggestion}</p>
              </motion.button>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <button
            onClick={() => setSuggestions([])}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Generate new suggestions
          </button>
        )}
      </div>
    </div>
  );
}