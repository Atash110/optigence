'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

export default function TermsPage() {
  const { t } = useLanguageStore();
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="py-16 px-4 sm:px-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-primary-light dark:text-primary-dark mr-3" />
              <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark">
                {t('terms.title')}
              </h1>
            </div>
            <p className="text-lg text-foreground-light/70 dark:text-foreground-dark/70 max-w-2xl mx-auto">
              {t('terms.description')}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark"
          >
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8 text-foreground-light dark:text-foreground-dark">
                {/* Introduction */}
                <div>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed mb-6">
                    {t('terms.introduction')}
                  </p>
                </div>

                {/* Use of Services */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('terms.use_of_services.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('terms.use_of_services.description')}
                  </p>
                </div>

                {/* User Data */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('terms.user_data.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('terms.user_data.description')}{' '}
                    <Link 
                      href="/privacy-policy" 
                      className="text-primary-light dark:text-primary-dark hover:underline font-medium"
                    >
                      {t('terms.user_data.privacy_policy')}
                    </Link>
                    .
                  </p>
                </div>

                {/* Limitations */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('terms.limitations.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('terms.limitations.description')}
                  </p>
                </div>

                {/* Account Termination */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('terms.account_termination.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('terms.account_termination.description')}
                  </p>
                </div>

                {/* Changes */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('terms.changes.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('terms.changes.description')}
                  </p>
                </div>

                {/* Contact */}
                <div className="pt-8 border-t border-border-light dark:border-border-dark">
                  <div className="bg-primary-light/5 dark:bg-primary-dark/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-2">
                      {t('terms.contact.title')}
                    </h3>
                    <p className="text-foreground-light/80 dark:text-foreground-dark/80">
                      {t('terms.contact.description')}{' '}
                      <a 
                        href="mailto:hello@optigence.tech" 
                        className="text-primary-light dark:text-primary-dark hover:underline font-medium"
                      >
                        hello@optigence.tech
                      </a>
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-center pt-8">
                  <p className="text-sm text-foreground-light/60 dark:text-foreground-dark/60">
                    {t('terms.last_updated')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
