'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'info' | 'countdown';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  countdown?: number;
}

interface ToastSystemProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, onDismiss }) => {
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};

    toasts.forEach((toast) => {
      if (toast.type === 'countdown' && toast.countdown) {
        setCountdowns(prev => ({ ...prev, [toast.id]: toast.countdown! }));
        
        intervals[toast.id] = setInterval(() => {
          setCountdowns(prev => {
            const newCount = prev[toast.id] - 1;
            if (newCount <= 0) {
              clearInterval(intervals[toast.id]);
              onDismiss(toast.id);
              return { ...prev, [toast.id]: 0 };
            }
            return { ...prev, [toast.id]: newCount };
          });
        }, 1000);
      }

      // Auto-dismiss non-countdown toasts
      if (toast.type !== 'countdown' && toast.duration) {
        setTimeout(() => {
          onDismiss(toast.id);
        }, toast.duration);
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [toasts, onDismiss]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'countdown': return ClockIcon;
      default: return InformationCircleIcon;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 border-green-400/30 text-green-300';
      case 'warning': return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300';
      case 'countdown': return 'bg-orange-500/20 border-orange-400/30 text-orange-300';
      default: return 'bg-blue-500/20 border-blue-400/30 text-blue-300';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = getIcon(toast.type);
          const currentCountdown = countdowns[toast.id];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${getColors(toast.type)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {toast.type === 'countdown' && currentCountdown !== undefined
                        ? `${toast.title} (${currentCountdown}s)`
                        : toast.title
                      }
                    </h4>
                    <button
                      onClick={() => onDismiss(toast.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                  
                  {toast.action && (
                    <button
                      onClick={toast.action.onClick}
                      className="mt-2 text-sm font-medium hover:underline"
                    >
                      {toast.action.label}
                    </button>
                  )}

                  {toast.type === 'countdown' && currentCountdown !== undefined && (
                    <div className="mt-2 w-full bg-white/10 rounded-full h-1">
                      <div 
                        className="bg-current h-1 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${((toast.countdown! - currentCountdown) / toast.countdown!) * 100}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook for managing toasts
export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const newToast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      duration: 5000, // Default 5 seconds
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
    return newToast.id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showAutoSendCountdown = (seconds: number, onCancel: () => void) => {
    return showToast({
      type: 'countdown',
      title: 'Auto-Send',
      message: 'Email will be sent automatically',
      countdown: seconds,
      action: {
        label: 'Cancel',
        onClick: onCancel
      }
    });
  };

  const showTemplateSaved = (templateName: string) => {
    return showToast({
      type: 'success',
      title: 'Template Saved',
      message: `"${templateName}" has been saved to your templates`,
      duration: 3000
    });
  };

  const showCalendarCreated = (eventLink: string) => {
    return showToast({
      type: 'success',
      title: 'Calendar Event Created',
      message: 'Meeting has been added to your calendar',
      action: {
        label: 'View Event',
        onClick: () => window.open(eventLink, '_blank')
      }
    });
  };

  const showHandoffReady = (teamMember: string) => {
    return showToast({
      type: 'info',
      title: 'Handoff Ready',
      message: `Context prepared for ${teamMember}`,
      duration: 4000
    });
  };

  return {
    toasts,
    showToast,
    dismissToast,
    showAutoSendCountdown,
    showTemplateSaved,
    showCalendarCreated,
    showHandoffReady,
  };
};
