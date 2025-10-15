'use client';

import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
  loop?: boolean;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 100,
  delay = 0,
  className = '',
  onComplete,
  cursor = true,
  loop = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const startTyping = () => {
      setIsTyping(true);
      setCurrentIndex(0);
      setDisplayedText('');
    };

    const timeout = setTimeout(startTyping, delay);
    return () => clearTimeout(timeout);
  }, [delay, text]);

  useEffect(() => {
    if (!isTyping) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      // Typing complete
      setIsTyping(false);
      onComplete?.();

      if (loop) {
        // If looping, start over after a pause
        const resetTimeout = setTimeout(() => {
          setIsTyping(true);
          setCurrentIndex(0);
          setDisplayedText('');
        }, 2000);
        return () => clearTimeout(resetTimeout);
      }
    }
  }, [currentIndex, text, speed, isTyping, onComplete, loop]);

  // Cursor blinking effect
  useEffect(() => {
    if (!cursor) return;

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [cursor]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && <span className={`transition-opacity duration-100 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>|</span>}
    </span>
  );
};

export default TypingEffect;
