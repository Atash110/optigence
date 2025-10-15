'use client';

import { motion } from 'framer-motion';
import { ActionSuggestion } from '@/types/optimail';

interface ActionChipsProps {
  actions: ActionSuggestion[];
  onActionSelect: (action: ActionSuggestion) => void;
  selectedChip: string | null;
}

export default function ActionChips({ actions, onActionSelect, selectedChip }: ActionChipsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
        {actions.slice(0, 5).map((action) => (
          <motion.button
            key={action.id}
            onClick={() => onActionSelect(action)}
            className={`
              px-3 py-1.5 rounded-xl text-sm font-medium transition-all
              ${selectedChip === action.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.text}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
