'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon,
  CalendarDaysIcon,
  ClockIcon,
  BookmarkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { buildWhyThis, buildHandoffSummary } from '@/lib/optimail/drafting';
import WhyThisPopover from './WhyThisPopover';

interface ActionChip {
  id: string;
  type: 'reply' | 'schedule' | 'save_template' | 'add_calendar' | 'handoff' | 'auto_send' | 'translate' | 'summarize';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  confidence: number;
  context: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  why?: string;
}

export type { ActionChip };

interface SmartActionChipsProps {
  content: string;
  context?: {
    thread?: Array<Record<string, unknown>>;
    recipients?: string[];
    language?: string;
    emailType?: string;
    hasCalendarContext?: boolean;
    isRepeatPattern?: boolean;
  };
  onActionTrigger: (action: ActionChip, data: Record<string, unknown>) => void;
}

export const SmartActionChips: React.FC<SmartActionChipsProps> = ({
  content,
  context = {},
  onActionTrigger
}) => {
  const [chips, setChips] = useState<ActionChip[]>([]);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [whyOpenFor, setWhyOpenFor] = useState<string | null>(null);
  const [whyPosition, setWhyPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  const analyzeContentAndGenerateChips = useCallback(async () => {
    const newChips: ActionChip[] = [];

    // Content analysis patterns
    const schedulingKeywords = /\b(meeting|call|interview|discussion|appointment|demo)\b/i;
    const questionPattern = /\?/;
    const urgentPattern = /\b(urgent|asap|immediately|quick|fast)\b/i;
    const repeatPattern = /\b(again|also|similar|same)\b/i;
  const timePattern = /\b(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm)|morning|afternoon|evening)\b/i;
  const travelPattern = /\b(travel|flight|hotel|itinerary|trip)\b/i;
  const shopPattern = /\b(buy|purchase|order|quote|pricing|price)\b/i;
  const hirePattern = /\b(job|candidate|resume|cv|interview|hiring)\b/i;

    // Confidence scoring based on content analysis
    const hasSchedulingKeywords = schedulingKeywords.test(content);
    const hasTimeReferences = timePattern.test(content);
    const hasQuestions = questionPattern.test(content);
    const isUrgent = urgentPattern.test(content);
    const hasRepeatPattern = repeatPattern.test(content);

  // Generate contextual chips based on analysis
    if (hasQuestions || content.length > 50) {
      newChips.push({
        id: 'reply',
        type: 'reply',
        label: 'Quick Reply',
        icon: PaperAirplaneIcon,
        confidence: hasQuestions ? 0.9 : 0.7,
  context: { hasQuestions, contentLength: content.length },
  why: buildWhyThis('reply', { hasQuestions }),
        priority: hasQuestions ? 'high' : 'medium'
      });
    }

    if (hasSchedulingKeywords || hasTimeReferences || context?.hasCalendarContext) {
      newChips.push({
        id: 'schedule',
        type: 'schedule',
        label: 'Propose Times',
        icon: CalendarDaysIcon,
        confidence: (hasSchedulingKeywords && hasTimeReferences) ? 0.95 : 0.8,
  context: { hasSchedulingKeywords, hasTimeReferences },
  why: buildWhyThis('schedule', { hasTimeReferences }),
        priority: 'high'
      });
    }

    if (context?.hasCalendarContext || hasSchedulingKeywords) {
      newChips.push({
        id: 'add_calendar',
        type: 'add_calendar',
        label: 'Add to Calendar',
        icon: CalendarDaysIcon,
        confidence: 0.85,
  context: { schedulingContext: true },
  why: buildWhyThis('add_calendar', { hasTimeReferences: true }),
        priority: 'high'
      });
    }

    if (hasRepeatPattern || content.length > 100) {
      newChips.push({
        id: 'save_template',
        type: 'save_template',
        label: 'Save Template',
        icon: BookmarkIcon,
        confidence: hasRepeatPattern ? 0.85 : 0.6,
  context: { hasRepeatPattern, contentLength: content.length },
  why: buildWhyThis('save_template', { hasRepeatPattern }),
        priority: hasRepeatPattern ? 'medium' : 'low'
      });
    }

  // Auto-send for trusted contacts with high confidence
    if ((context?.recipients?.length || 0) > 0 && (hasQuestions || isUrgent)) {
      newChips.push({
        id: 'auto_send',
        type: 'auto_send',
        label: 'Auto-Send (3s)',
        icon: ClockIcon,
        confidence: 0.8,
  context: { isUrgent, hasQuestions, delay: 3, recipients: context?.recipients },
  why: buildWhyThis('auto_send', { isUrgent, hasQuestions, recipients: context?.recipients }),
        priority: isUrgent ? 'high' : 'medium'
      });
    }

    // Cross-module handoff chips
    if (travelPattern.test(content)) {
      newChips.push({
        id: 'handoff_trip',
        type: 'handoff',
        label: 'Open in OptiTrip',
        icon: PaperAirplaneIcon,
        confidence: 0.7,
        context: { module: 'optitrip' },
        why: buildWhyThis('handoff', {}),
        priority: 'medium'
      });
    }
    if (shopPattern.test(content)) {
      newChips.push({
        id: 'handoff_shop',
        type: 'handoff',
        label: 'Open in OptiShop',
        icon: PaperAirplaneIcon,
        confidence: 0.7,
        context: { module: 'optishop' },
        why: buildWhyThis('handoff', {}),
        priority: 'medium'
      });
    }
    if (hirePattern.test(content)) {
      newChips.push({
        id: 'handoff_hire',
        type: 'handoff',
        label: 'Open in OptiHire',
        icon: PaperAirplaneIcon,
        confidence: 0.7,
        context: { module: 'optihire' },
        why: buildWhyThis('handoff', {}),
        priority: 'medium'
      });
    }

    // Sort by priority and confidence
    const sortedChips = newChips.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    setChips(sortedChips.slice(0, 6)); // Limit to 6 chips
  }, [content, context]);

  useEffect(() => {
    analyzeContentAndGenerateChips();
  }, [analyzeContentAndGenerateChips]);

  const handleChipClick = useCallback((chip: ActionChip, event?: React.MouseEvent) => {
    setActiveChip(chip.id);

    // If user Alt-clicks, open WhyThis near cursor
    if (event && (event.altKey || event.metaKey)) {
      setWhyOpenFor(chip.id);
      setWhyPosition({ x: event.clientX, y: event.clientY });
      return;
    }

    // Special handling for auto-send
    if (chip.type === 'auto_send') {
      setAutoSendCountdown(3);
      const countdown = setInterval(() => {
        setAutoSendCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdown);
            onActionTrigger(chip, { email: content, delay: 0 });
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // For cross-module handoff, attach compact summary payload
  if (chip.type === 'handoff' && chip.context?.module) {
    const target = (chip.context.module as 'optitrip' | 'optishop' | 'optihire');
    const summary = buildHandoffSummary(target, {
          intent: 'assist',
          entities: { recipients: context?.recipients, language: context?.language },
          notes: content.slice(0, 280)
        });
        onActionTrigger(chip, { ...chip.context, handoffSummary: summary });
      } else {
        onActionTrigger(chip, chip.context);
      }
    }
  }, [content, onActionTrigger, context?.language, context?.recipients]);

  const cancelAutoSend = useCallback(() => {
    setAutoSendCountdown(null);
    setActiveChip(null);
  }, []);

  const getChipColor = (chip: ActionChip) => {
    switch (chip.priority) {
      case 'high': return 'bg-red-500/20 border-red-400/30 text-red-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300';
      case 'low': return 'bg-blue-500/20 border-blue-400/30 text-blue-300';
      default: return 'bg-gray-500/20 border-gray-400/30 text-gray-300';
    }
  };

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence>
        {chips.map((chip) => {
          const Icon = chip.icon;
          const isActive = activeChip === chip.id;
          const isCountingDown = chip.type === 'auto_send' && autoSendCountdown !== null;

          return (
            <motion.button
              key={chip.id}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleChipClick(chip, e)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm transition-all ${
                isActive ? 'ring-2 ring-blue-400/50' : ''
              } ${getChipColor(chip)}`}
              disabled={isCountingDown}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isCountingDown ? `Auto-Send (${autoSendCountdown})` : chip.label}
              </span>
              
              {isCountingDown && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelAutoSend();
                  }}
                  className="ml-1 p-1 hover:bg-white/10 rounded"
                >
                  <XMarkIcon className="w-3 h-3" />
                </motion.button>
              )}

              <div className="text-xs opacity-60">
                {Math.round(chip.confidence * 100)}%
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>

      <WhyThisPopover
        isOpen={!!whyOpenFor}
        onClose={() => setWhyOpenFor(null)}
        explanation={chips.find(c => c.id === whyOpenFor)?.why}
        sourceCues={[
          context?.emailType ? `Email type: ${context.emailType}` : 'Content cues',
          context?.language ? `Language: ${context.language}` : 'Tone heuristics',
          (context?.recipients?.length || 0) > 0 ? 'Recipient history' : 'Thread length'
        ]}
        position={whyPosition}
      />
    </div>
  );
};
