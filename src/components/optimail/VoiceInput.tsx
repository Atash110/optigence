'use client';

import { useCallback } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export default function VoiceInput({ onResult, isListening, setIsListening }: VoiceInputProps) {
  const startListening = useCallback(() => {
    setIsListening(true);
    
    // Simulate listening for demo
    setTimeout(() => {
      const mockTranscript = 'Write an email to John about the meeting tomorrow';
      onResult(mockTranscript);
      setIsListening(false);
    }, 3000);
  }, [onResult, setIsListening]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, [setIsListening]);

  return (
    <motion.button
      onClick={isListening ? stopListening : startListening}
      className={`p-3 rounded-2xl transition-all ${
        isListening 
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isListening ? { scale: [1, 1.1, 1] } : {}}
      transition={isListening ? { duration: 1, repeat: Infinity } : {}}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <StopIcon className="w-5 h-5" />
      ) : (
        <MicrophoneIcon className="w-5 h-5" />
      )}
    </motion.button>
  );
}