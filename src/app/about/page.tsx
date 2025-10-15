'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/language';

export default function AboutPage() {
  const { t } = useLanguageStore();
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl font-bold text-primary-light dark:text-primary-dark mb-8 text-center"
          >
            {t('about.title')}
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="prose prose-lg max-w-none"
          >
            <div className="text-base sm:text-lg text-foreground-light dark:text-foreground-dark leading-relaxed space-y-6">
              <p>
                {t('about.intro')}
              </p>
              
              <p>
                {t('about.vision')}
              </p>
              
              <p>
                {t('about.experience')} <span className="font-semibold text-accent-light dark:text-accent-dark">{t('about.super_assistant')}</span> {t('about.experience_continued')}
              </p>
              
              <p className="text-xl font-semibold text-foreground-light dark:text-foreground-dark border-l-4 border-primary-light dark:border-primary-dark pl-6 py-4 bg-accent-light/10 dark:bg-accent-dark/10 rounded-r-lg">
                <span className="font-bold text-primary-light dark:text-primary-dark">{t('about.goal_intro')}</span>{t('about.goal_description')}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
