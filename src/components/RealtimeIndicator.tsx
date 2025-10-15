'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  collaborators: string[];
  typingUsers: string[];
  isDarkMode: boolean;
}

export default function RealtimeIndicator({
  isConnected,
  collaborators,
  typingUsers,
  isDarkMode
}: RealtimeIndicatorProps) {
  if (!isConnected && collaborators.length === 0 && typingUsers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${
        isDarkMode 
          ? 'bg-optimail-navy-light/40 backdrop-blur-sm border border-optimail-bright-blue/20' 
          : 'bg-white/80 backdrop-blur-sm border border-gray-200'
      }`}
    >
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi size={14} className="text-green-500" />
        ) : (
          <WifiOff size={14} className="text-red-500" />
        )}
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isConnected && (
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full h-full rounded-full bg-green-500"
            />
          )}
        </div>
      </div>

      {/* Collaborators Count */}
      {collaborators.length > 0 && (
        <div className="flex items-center gap-1">
          <Users size={14} className={isDarkMode ? 'text-optimail-light' : 'text-gray-600'} />
          <span className={`text-xs font-medium ${
            isDarkMode ? 'text-optimail-light' : 'text-gray-700'
          }`}>
            {collaborators.length}
          </span>
        </div>
      )}

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [-2, -6, -2],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-1 h-1 rounded-full bg-optimail-bright-blue"
              />
            ))}
          </div>
          <span className={`text-xs ${
            isDarkMode ? 'text-optimail-muted' : 'text-gray-500'
          }`}>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people typing...`
            }
          </span>
        </div>
      )}

      {/* Session Info */}
      {isConnected && (
        <div className={`text-xs px-2 py-1 rounded-full ${
          isDarkMode 
            ? 'bg-optimail-bright-blue/20 text-optimail-bright-blue'
            : 'bg-blue-50 text-blue-600'
        }`}>
          Live
        </div>
      )}
    </motion.div>
  );
}
