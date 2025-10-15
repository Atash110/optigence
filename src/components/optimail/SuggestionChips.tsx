"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActionSuggestion } from '@/types/optimail';
import WhyThisPopover from './WhyThisPopover';

interface SuggestionChipsProps {
  suggestions: ActionSuggestion[];
  onSuggestionClick: (suggestion: ActionSuggestion) => void;
  className?: string;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSuggestionClick,
  className = "fixed bottom-56 left-0 right-0 flex justify-center"
}) => {
  const [whyOpen, setWhyOpen] = useState<{ id: string; x: number; y: number } | null>(null);
  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className={className}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div className="flex gap-2 flex-wrap max-w-3xl px-6">
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              whileHover={{ 
                scale: 1.06, 
                y: -2,
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.25)"
              }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                if (e.altKey || e.metaKey) {
                  setWhyOpen({ id: suggestion.id, x: e.clientX, y: e.clientY });
                } else {
                  onSuggestionClick(suggestion);
                }
              }}
              className="bg-white/8 hover:bg-white/12 text-gray-200 text-xs px-3 py-2 rounded-full border border-white/15 backdrop-blur-md transition-colors relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.05 }
              }}
            >
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              
              <div className="relative flex items-center gap-1.5">
                {suggestion.icon && (
                  <span className="text-[10px]" role="img" aria-hidden="true">
                    {suggestion.icon}
                  </span>
                )}
                <span className="font-medium">{suggestion.text}</span>
              </div>
              
              {/* Priority indicator (subtle) */}
              {suggestion.priority >= 90 && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
              )}
            </motion.button>
          ))}
        </div>

        {/* "More" indicator if we have more suggestions */}
        {suggestions.length > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500"
          >
            +{suggestions.length - 6} more actions
          </motion.div>
        )}
        <WhyThisPopover
          isOpen={!!whyOpen}
          onClose={() => setWhyOpen(null)}
          explanation={suggestions.find(s => s.id === whyOpen?.id)?.why}
          sourceCues={[ 'Intent heuristics', 'Thread cues', 'Tone preference' ]}
          position={whyOpen ? { x: whyOpen.x, y: whyOpen.y } : undefined}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default SuggestionChips;
