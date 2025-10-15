'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface OptigenceLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  variant?: 'default' | 'white';
  completionPercentage?: number; // 0-100 for form completion
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export default function OptigenceLogo({ 
  size = 'md', 
  className = '', 
  animate = true,
  variant = 'default',
  completionPercentage = 0
}: OptigenceLogoProps) {
  const sizeClass = sizeClasses[size];
  
  // Create unique IDs to avoid conflicts
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const modernGradientId = `modernGradient-${uniqueId}`;
  const whiteGradientId = `whiteGradient-${uniqueId}`;
  
  // Calculate stroke dash array based on completion
  const circumference = 2 * Math.PI * 12; // radius = 12
  const completedLength = (completionPercentage / 100) * circumference;

  return (
    <div 
      className={`${sizeClass} ${className} relative flex items-center justify-center`}
      aria-label="Optigence"
      role="img"
    >
      <motion.svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        animate={animate ? {
          rotate: [0, 360],
        } : {}}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <defs>
          <linearGradient id={modernGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={whiteGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>
        
        {/* Simple "O" ring */}
        <motion.circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke={variant === 'white' ? `url(#${whiteGradientId})` : `url(#${modernGradientId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={animate && completionPercentage === 0 ? {
            strokeDasharray: ['0 75', '37.5 37.5', '75 0', '37.5 37.5', '0 75'],
            opacity: [0.8, 1, 1, 1, 0.8],
          } : completionPercentage > 0 ? {
            strokeDasharray: `${completedLength} ${circumference - completedLength}`,
            opacity: completionPercentage === 100 ? 1 : [0.8, 1, 0.8],
          } : {}}
          transition={animate && completionPercentage === 0 ? {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          } : completionPercentage > 0 ? {
            duration: 0.5,
            ease: "easeInOut",
            opacity: {
              duration: 2,
              repeat: completionPercentage === 100 ? 0 : Infinity,
              ease: "easeInOut"
            }
          } : {}}
        />
      </motion.svg>
    </div>
  );
}

// Export variants for common use cases
export const OptigenceLogoSmall = (props: Omit<OptigenceLogoProps, 'size'>) => (
  <OptigenceLogo size="sm" {...props} />
);

export const OptigenceLogoLarge = (props: Omit<OptigenceLogoProps, 'size'>) => (
  <OptigenceLogo size="lg" {...props} />
);

export const OptigenceLogoXL = (props: Omit<OptigenceLogoProps, 'size'>) => (
  <OptigenceLogo size="xl" {...props} />
);

export const OptigenceLogoStatic = (props: Omit<OptigenceLogoProps, 'animate'>) => (
  <OptigenceLogo animate={false} {...props} />
);
