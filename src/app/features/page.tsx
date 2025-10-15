'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CpuChipIcon,
  LightBulbIcon,
  MicrophoneIcon,
  UserIcon,
  LockClosedIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

export default function FeaturesPage() {
  const { t } = useLanguageStore();
  
  const features = [
    {
      icon: CpuChipIcon,
      titleKey: 'features.modular_intelligence.title',
      descriptionKey: 'features.modular_intelligence.description'
    },
    {
      icon: LightBulbIcon,
      titleKey: 'features.superficial_assistant.title',
      descriptionKey: 'features.superficial_assistant.description'
    },
    {
      icon: MicrophoneIcon,
      titleKey: 'features.voice_text_emotion.title',
      descriptionKey: 'features.voice_text_emotion.description'
    },
    {
      icon: UserIcon,
      titleKey: 'features.personalization_memory.title',
      descriptionKey: 'features.personalization_memory.description'
    },
    {
      icon: LockClosedIcon,
      titleKey: 'features.modular_access.title',
      descriptionKey: 'features.modular_access.description'
    },
    {
      icon: BeakerIcon,
      titleKey: 'features.transparency.title',
      descriptionKey: 'features.transparency.description'
    }
  ];
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="py-16 px-4 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark mb-4">
              {t('features.title')}
            </h1>
            <p className="text-lg text-foreground-light dark:text-foreground-dark max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                whileHover={{ y: -5 }}
                className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-border-light dark:border-border-dark hover:border-primary-light/50 dark:hover:border-primary-dark/50 transition-all duration-300"
              >
                {/* Feature Icon */}
                <div className="flex items-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
                </div>

                {/* Feature Title */}
                <h3 className="text-xl font-bold text-foreground-light dark:text-foreground-dark mb-3">
                  {t(feature.titleKey)}
                </h3>

                {/* Feature Description */}
                <p className="text-foreground-light/80 dark:text-foreground-dark/80 leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
            className="mt-16 text-center"
          >
            <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark">
              <h2 className="text-2xl font-bold text-foreground-light dark:text-foreground-dark mb-4">
                {t('features.cta.title')}
              </h2>
              <p className="text-foreground-light/80 dark:text-foreground-dark/80 mb-6 max-w-2xl mx-auto">
                {t('features.cta.description')}
              </p>
              <Link href="/waitlist">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-primary-light dark:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors"
                >
                  {t('features.cta.button')}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
