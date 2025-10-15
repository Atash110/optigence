'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app';
import { useLanguageStore } from '@/store/language';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import SuperficialAssistant from '@/components/SuperficialAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, sidebarOpen } = useAppStore();
  const { currentLanguage } = useLanguageStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
  }, [theme]);

  // Apply RTL for Arabic language
  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [currentLanguage]);

  return (
    <motion.div 
      className="min-h-screen bg-background-light dark:bg-background-dark text-foreground-light dark:text-foreground-dark transition-colors duration-300 flex flex-col w-full overflow-x-hidden relative"
      animate={{
        background: [
          'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08), transparent 50%)',
          'radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.06), transparent 50%)',
          'radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.07), transparent 50%)',
          'radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.09), transparent 50%)',
          'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08), transparent 50%)'
        ]
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Breathing ambient particles */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary-light/30 dark:bg-primary-dark/30 rounded-full"
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${8 + (i * 11)}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.8, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </motion.div>

      <div className="max-w-screen-2xl mx-auto w-full relative z-10">
        {/* Header */}
        <Header />
        
        <div className="flex flex-1 pt-16">
          {/* Sidebar */}
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-16 bottom-0 left-0 z-40 w-80 bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark shadow-lg overflow-y-auto md:relative md:top-0"
              >
                <Sidebar />
              </motion.aside>
            )}
          </AnimatePresence>
        
          {/* Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-30 bg-black/50 md:bg-transparent md:left-80"
                onClick={() => useAppStore.getState().setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>
        
          {/* Main Content */}
          <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Superficial Assistant */}
      <SuperficialAssistant />
    </motion.div>
  );
}

// Fixed Layout
