"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SendCountdownToastProps {
  countdown: number | null;
  onSend: () => void;
  onCancel: () => void;
  recipientName?: string;
}

const SendCountdownToast: React.FC<SendCountdownToastProps> = ({
  countdown,
  onSend,
  onCancel,
  recipientName
}) => {
  useEffect(() => {
    if (countdown === 0) {
      onSend();
    }
  }, [countdown, onSend]);

  if (countdown === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-[60]"
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl min-w-[320px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  {countdown > 0 ? (
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-blue-300 font-mono font-bold text-lg"
                    >
                      {countdown}
                    </motion.div>
                  ) : (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  )}
                </div>
                {/* Circular progress */}
                <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-white/10"
                    strokeWidth="2"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className="stroke-current text-blue-400"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray="100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ 
                      strokeDashoffset: countdown !== null ? (countdown / 3) * 100 : 0 
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {countdown > 0 ? 'Auto-sending in' : 'Sending now...'}
                </p>
                {recipientName && (
                  <p className="text-xs text-gray-400">
                    to {recipientName}
                  </p>
                )}
              </div>
            </div>

            {countdown > 0 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-colors"
                title="Cancel auto-send"
              >
                <XMarkIcon className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Confidence indicator */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Confidence</span>
              <span className="text-green-300 font-medium">95%+</span>
            </div>
            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: '95%' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SendCountdownToast;
