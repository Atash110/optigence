'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypingInputProps {
  type?: string;
  placeholder?: string;
  typingText?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  typingSpeed?: number;
  typingDelay?: number;
  id?: string;
  name?: string;
}

const TypingInput: React.FC<TypingInputProps> = ({
  type = 'text',
  placeholder = '',
  typingText,
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled = false,
  required = false,
  typingSpeed = 150,
  typingDelay = 1000,
  id,
  name
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [typingPlaceholder, setTypingPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers when component unmounts or dependencies change
  const clearAllTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Clear any existing timers first
    clearAllTimers();
    
    if (!typingText || isFocused || value) {
      setIsTyping(false);
      setTypingPlaceholder('');
      return;
    }

    setIsTyping(true);
    setTypingPlaceholder('');

    const startTyping = () => {
      let index = 0;
      
      const typeNextChar = () => {
        if (index < typingText.length) {
          setTypingPlaceholder(typingText.substring(0, index + 1));
          index++;
          timeoutRef.current = setTimeout(typeNextChar, typingSpeed);
        } else {
          setIsTyping(false);
          // After completing typing, pause longer to let users read the full text
          timeoutRef.current = setTimeout(() => {
            if (!isFocused && !value) {
              setTypingPlaceholder('');
              intervalRef.current = setTimeout(startTyping, 1000);
            }
          }, 4000); // Increased from 2000ms to 4000ms
        }
      };
      
      typeNextChar();
    };

    timeoutRef.current = setTimeout(startTyping, typingDelay);

    return clearAllTimers;
  }, [typingText, isFocused, value, typingSpeed, typingDelay]);

  const handleFocus = () => {
    clearAllTimers();
    setIsFocused(true);
    setIsTyping(false);
    setTypingPlaceholder('');
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const displayPlaceholder = isFocused || value ? placeholder : (typingPlaceholder || placeholder);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={displayPlaceholder}
        disabled={disabled}
        required={required}
        className={`${className} transition-all duration-200 ${isFocused ? 'ring-2 ring-blue-500/20' : ''}`}
      />
      {isTyping && !isFocused && !value && (
        <motion.span
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-pulse"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </div>
  );
};

export default TypingInput;
