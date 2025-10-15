'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

export default function WaitlistConfirmationPage() {
  const { t } = useLanguageStore();
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="py-32 px-4 sm:px-6"
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <h1 className="text-3xl font-bold text-primary-light dark:text-primary-dark text-center mb-6">
              {t('waitlist.confirmation.title')}
            </h1>
            
            <p className="text-lg text-foreground-light dark:text-foreground-dark text-center mt-4 mb-4">
              {t('waitlist.confirmation.email_ready')}
            </p>
            
            <p className="text-lg text-foreground-light dark:text-foreground-dark text-center">
              {t('waitlist.confirmation.surprise_perks')}
            </p>
          </motion.div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="mt-8"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-primary-light dark:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors flex items-center gap-2 mx-auto"
              >
                <HomeIcon className="w-5 h-5" />
                {t('waitlist.confirmation.back_home')}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
