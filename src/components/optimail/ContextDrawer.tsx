"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import type { EmailTemplate, SmartReplyOption } from '@/types/optimail';
import { SmartActionChips, type ActionChip } from './SmartActionChips';
import { ToastSystem, useToasts } from './ToastSystem';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threadSummary?: string;
  calendarSlots?: Array<{ time: string; available: boolean }>;
  templates?: EmailTemplate[];
  recentReplies?: SmartReplyOption[];
  onTemplateSelect?: (template: EmailTemplate) => void;
  onReplySelect?: (reply: SmartReplyOption) => void;
  onCalendarSlotSelect?: (slot: string) => void;
  // New props for enhanced functionality
  emailContent?: string;
  contactContext?: string;
  onDraftGenerated?: (draft: string) => void;
  onAutoSend?: (email: string, delay: number) => void;
}

const ContextDrawer: React.FC<ContextDrawerProps> = ({
  isOpen,
  onClose,
  threadSummary,
  calendarSlots = [],
  templates = [],
  recentReplies = [],
  onTemplateSelect,
  onReplySelect,
  onCalendarSlotSelect,
  emailContent = '',
  contactContext = '',
  onDraftGenerated,
  onAutoSend,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toasts, dismissToast, showToast } = useToasts();

  const handleChipAction = useCallback((action: ActionChip, data: Record<string, unknown>) => {
    switch (action.type) {
      case 'auto_send':
        if (onAutoSend && typeof data.email === 'string' && typeof data.delay === 'number') {
          onAutoSend(data.email, data.delay);
        }
        break;
      case 'save_template':
        if (typeof data.templateName === 'string' && typeof data.content === 'string') {
          showToast({
            type: 'success',
            title: 'Template Saved',
            message: `"${data.templateName}" saved successfully`,
            duration: 3000
          });
        }
        break;
      case 'add_calendar':
        if (typeof data.eventTitle === 'string' && typeof data.timeSlot === 'string') {
          showToast({
            type: 'success',
            title: 'Calendar Event Created',
            message: `Meeting "${data.eventTitle}" scheduled`,
            duration: 3000
          });
        }
        break;
      default:
        console.log('Action:', action.type, 'Data:', data);
    }
  }, [onAutoSend, showToast]);

  if (!isOpen) return (
    <>
      <ToastSystem toasts={toasts} onDismiss={dismissToast} />
      {null}
    </>
  );

  return (
    <>
      <ToastSystem toasts={toasts} onDismiss={dismissToast} />
      <AnimatePresence>
        {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-[#0D1B2A]/95 backdrop-blur-2xl border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0D1B2A]/90 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Context</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="p-6 space-y-8">
              {/* Smart Action Chips */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <SparklesIcon className="w-4 h-4" />
                  Smart Actions
                </div>
                <SmartActionChips
                  content={emailContent}
                  context={{
                    thread: [],
                    recipients: contactContext ? [contactContext] : [],
                    hasCalendarContext: (calendarSlots?.length || 0) > 0,
                  }}
                  onActionTrigger={handleChipAction}
                />
              </div>

              {/* Thread Summary */}
              {threadSummary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Thread Summary
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-200 leading-relaxed">{threadSummary}</p>
                  </div>
                </div>
              )}

              {/* Calendar Slots */}
              {calendarSlots.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <CalendarDaysIcon className="w-4 h-4" />
                    Available Times
                  </div>
                  <div className="space-y-2">
                    {calendarSlots.slice(0, 5).map((slot, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCalendarSlotSelect?.(slot.time)}
                        disabled={!slot.available}
                        className={`w-full p-3 rounded-xl border text-left transition-colors ${
                          slot.available
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200'
                            : 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{slot.time}</span>
                          {slot.available ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                          ) : (
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates */}
              {templates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <DocumentTextIcon className="w-4 h-4" />
                    Templates
                  </div>
                  <div className="space-y-2">
                    {templates.slice(0, 4).map((template) => (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onTemplateSelect?.(template)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {template.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {template.content.substring(0, 80)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <TagIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500 capitalize">
                              {template.tone}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Replies */}
              {recentReplies.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <ClipboardDocumentCheckIcon className="w-4 h-4" />
                    Smart Replies
                  </div>
                  <div className="space-y-2">
                    {recentReplies.slice(0, 3).map((reply) => (
                      <motion.button
                        key={reply.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onReplySelect?.(reply)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200">
                              {reply.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {reply.body.substring(0, 60)}...
                            </p>
                          </div>
                          <div className="flex items-center ml-2">
                            <div className={`w-2 h-2 rounded-full ${
                              reply.score >= 0.8 ? 'bg-green-400' : 
                              reply.score >= 0.6 ? 'bg-yellow-400' : 'bg-orange-400'
                            }`} />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!threadSummary && calendarSlots.length === 0 && templates.length === 0 && recentReplies.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Context will appear here when you start working with emails
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};

export default ContextDrawer;
