'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/language';

export default function Footer() {
  const { t } = useLanguageStore();
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        background: [
          'linear-gradient(135deg, rgba(59, 130, 246, 0.02), rgba(99, 102, 241, 0.01))',
          'linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.02))',
          'linear-gradient(135deg, rgba(59, 130, 246, 0.02), rgba(99, 102, 241, 0.01))'
        ]
      }}
      transition={{ 
        duration: 0.6,
        background: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className="bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark relative overflow-hidden"
    >
      {/* Breathing ambient effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary-light/10 dark:bg-primary-dark/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-secondary-light/10 dark:bg-secondary-dark/10 rounded-full blur-3xl" />
      </motion.div>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-light dark:text-primary-dark">
              Optigence
            </span>
            <span className="text-foreground-light/60 dark:text-foreground-dark/60">
              {t('footer.ai_platform')}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              href="/features" 
              className="text-foreground-light/70 dark:text-foreground-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {t('footer.features')}
            </Link>
            <Link 
              href="/pricing" 
              className="text-foreground-light/70 dark:text-foreground-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {t('footer.pricing')}
            </Link>
            <Link 
              href="/about" 
              className="text-foreground-light/70 dark:text-foreground-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {t('footer.about')}
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-foreground-light/70 dark:text-foreground-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {t('footer.privacy_policy')}
            </Link>
            <Link 
              href="/terms" 
              className="text-foreground-light/70 dark:text-foreground-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {t('footer.terms_of_service')}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-foreground-light/50 dark:text-foreground-dark/50">
            © 2025 Optigence. {t('footer.all_rights_reserved')}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
