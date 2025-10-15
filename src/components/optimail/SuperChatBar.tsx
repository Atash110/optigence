"use client";
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PaperAirplaneIcon, 
  Cog6ToothIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface PendingWave { id: string; h: number; }

interface SuperChatBarProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  listening: boolean;
  onVoiceToggle: () => void;
  onSettingsOpen: () => void;
  onPasteEmail: () => void;
  disabled?: boolean;
  placeholder?: string;
  waveform?: PendingWave[];
}

const SuperChatBar: React.FC<SuperChatBarProps> = ({
  input,
  setInput,
  onSubmit,
  listening,
  onVoiceToggle,
  onSettingsOpen,
  onPasteEmail,
  disabled = false,
  placeholder = "Paste email or describe action…",
  waveform = []
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    // Auto-detect if it's an email and show quick actions
    if (pastedText.length > 200 && (pastedText.includes('@') || pastedText.toLowerCase().includes('from:') || pastedText.toLowerCase().includes('subject:'))) {
      setTimeout(() => onPasteEmail(), 100);
    }
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-50">
      <motion.div 
        layout 
        className="relative w-full max-w-3xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Waveform visualization */}
        <AnimatePresence>
          {listening && waveform.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-[2px] items-end"
            >
              {waveform.map((bar) => (
                <motion.div
                  key={bar.id}
                  style={{ height: bar.h }}
                  className="w-1 rounded-full bg-blue-400 shadow-lg"
                  animate={{ height: bar.h }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat bar */}
        <motion.div
          className={`rounded-2xl bg-white/8 backdrop-blur-2xl border border-white/15 shadow-2xl px-5 py-4 flex items-end gap-4 transition-all duration-300 ${
            isFocused ? 'bg-white/12 border-white/25' : ''
          } ${disabled ? 'opacity-60' : ''}`}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.998 }}
        >
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="w-full bg-transparent resize-none focus:outline-none text-sm text-gray-100 placeholder-gray-500 leading-relaxed scrollbar-thin max-h-[140px] min-h-[24px]"
              style={{ lineHeight: '1.5' }}
            />
          </div>

          <div className="flex items-center gap-2 pb-1">
            {/* Paste Email Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPasteEmail}
              disabled={disabled}
              className="p-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 hover:text-gray-100 transition-colors disabled:opacity-50"
              title="Paste email for quick actions"
            >
              <DocumentTextIcon className="w-4 h-4" />
            </motion.button>

            {/* Voice button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onVoiceToggle}
              disabled={disabled}
              className={`p-3 rounded-xl transition-all ${
                listening
                  ? 'bg-red-600/80 text-white shadow-lg shadow-red-600/25'
                  : 'bg-white/10 text-gray-200 hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {listening ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
            </motion.button>

            {/* Send button */}
            <motion.button
              whileHover={input.trim() && !disabled ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !disabled ? { scale: 0.95 } : {}}
              disabled={!input.trim() || disabled}
              onClick={onSubmit}
              className={`p-3 rounded-xl transition-all ${
                input.trim() && !disabled
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </motion.button>

            {/* Settings button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsOpen}
              disabled={disabled}
              className="p-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 hover:text-gray-100 transition-colors disabled:opacity-50"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Humanized typing indicator */}
        {disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-8 left-4 text-xs text-blue-300 flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Synthesizing response...</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SuperChatBar;
