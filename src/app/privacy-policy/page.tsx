'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

export default function PrivacyPolicyPage() {
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
              <ShieldCheckIcon className="w-8 h-8 text-primary-light dark:text-primary-dark mr-3" />
              <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark">
                {t('privacy.title')}
              </h1>
            </div>
            <p className="text-lg text-foreground-light/70 dark:text-foreground-dark/70 max-w-2xl mx-auto">
              {t('privacy.description')}
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
                {/* Data Collection */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.data_collection.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.data_collection.description')}
                  </p>
                </div>

                {/* Data Sharing */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.data_sharing.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.data_sharing.description')}
                  </p>
                </div>

                {/* Data Security */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.data_security.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.data_security.description')}
                  </p>
                </div>

                {/* Data Rights */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.data_rights.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.data_rights.description')}{' '}
                    <a 
                      href="mailto:hello@optigence.tech" 
                      className="text-primary-light dark:text-primary-dark hover:underline font-medium"
                    >
                      hello@optigence.tech
                    </a>
                  </p>
                </div>

                {/* Analytics */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.analytics.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.analytics.description')}
                  </p>
                </div>

                {/* Policy Updates */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-4">
                    {t('privacy.policy_updates.title')}
                  </h2>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                    {t('privacy.policy_updates.description')}
                  </p>
                </div>

                {/* Contact */}
                <div className="pt-8 border-t border-border-light dark:border-border-dark">
                  <div className="bg-primary-light/5 dark:bg-primary-dark/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-2">
                      {t('privacy.contact.title')}
                    </h3>
                    <p className="text-foreground-light/80 dark:text-foreground-dark/80">
                      {t('privacy.contact.description')}{' '}
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
                    {t('privacy.last_updated')}
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
