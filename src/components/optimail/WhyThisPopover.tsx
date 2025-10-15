"use client";
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WhyThisPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  explanation?: string;
  sourceCues?: string[];
  position?: { x: number; y: number };
}

const WhyThisPopover: React.FC<WhyThisPopoverProps> = ({
  isOpen,
  onClose,
  explanation = "Based on your email history and tone preferences, this suggestion matches your typical communication style.",
  sourceCues = ["Calendar availability", "Previous thread context", "Professional tone setting"],
  position
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popoverStyle = position ? {
    left: position.x,
    top: position.y,
    transform: 'translate(-50%, -100%)'
  } : {};

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="fixed z-[70] max-w-sm"
        style={popoverStyle}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="bg-[#0D1B2A]/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Why this suggestion?</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Explanation */}
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {explanation}
          </p>

          {/* Source cues */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Based on:
            </span>
            <div className="space-y-1">
              {sourceCues.map((cue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <span className="text-xs text-gray-400">{cue}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px">
            <div className="w-3 h-3 bg-[#0D1B2A] border-r border-b border-white/20 rotate-45"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhyThisPopover;
