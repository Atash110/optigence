'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckIcon, 
  SparklesIcon, 
  RocketLaunchIcon,
  UserIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

export default function PricingPage() {
  const { t } = useLanguageStore();
  
  const pricingPlans = [
    {
      name: 'pricing.free.name',
      price: 'pricing.free.price',
      period: 'pricing.free.period',
      icon: UserIcon,
      description: 'pricing.free.description',
      features: [
        'pricing.free.feature1',
        'pricing.free.feature2',
        'pricing.free.feature3',
        'pricing.free.feature4'
      ],
      highlighted: false,
      available: true
    },
    {
      name: 'pricing.pro.name',
      price: 'pricing.pro.price',
      period: 'pricing.pro.period',
      icon: StarIcon,
      description: 'pricing.pro.description',
      features: [
        'pricing.pro.feature1',
        'pricing.pro.feature2',
        'pricing.pro.feature3',
        'pricing.pro.feature4',
        'pricing.pro.feature5'
      ],
      highlighted: true,
      available: true
    },
    {
      name: 'pricing.elite.name',
      price: 'pricing.elite.price',
      period: 'pricing.elite.period',
      icon: BoltIcon,
      description: 'pricing.elite.description',
      features: [
        'pricing.elite.feature1',
        'pricing.elite.feature2',
        'pricing.elite.feature3',
        'pricing.elite.feature4',
        'pricing.elite.feature5'
      ],
      highlighted: false,
      available: false,
      comingSoon: true
    }
  ];
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="px-4 sm:px-6 lg:px-8 py-16"
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
              {t('pricing.title')}
            </h1>
            <p className="text-lg text-foreground-light dark:text-foreground-dark max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                whileHover={{ y: -5 }}
                className={`relative bg-card-light dark:bg-card-dark rounded-2xl p-8 border-2 transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-primary-light dark:border-primary-dark ring-2 ring-primary-light/20 dark:ring-primary-dark/20 shadow-lg shadow-primary-light/10 dark:shadow-primary-dark/10'
                    : 'border-border-light dark:border-border-dark hover:border-primary-light/50 dark:hover:border-primary-dark/50'
                } ${
                  !plan.available ? 'opacity-75' : ''
                }`}
              >
                {/* Coming Soon Badge */}
                {plan.comingSoon && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent-light dark:bg-accent-dark text-white px-3 py-1 rounded-full text-sm font-medium">
                      {t('pricing.coming_later')}
                    </span>
                  </div>
                )}

                {/* Highlighted Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-light dark:bg-primary-dark text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <SparklesIcon className="w-4 h-4" />
                      {t('pricing.most_popular')}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-card-light dark:bg-card-dark border-2 border-border-light dark:border-border-dark flex items-center justify-center">
                    <plan.icon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground-light dark:text-foreground-dark mb-2">
                    {t(plan.name)}
                  </h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-primary-light dark:text-primary-dark">
                      {t(plan.price)}
                    </span>
                    <span className="text-foreground-light/60 dark:text-foreground-dark/60">
                      {t(plan.period)}
                    </span>
                  </div>
                  <p className="text-foreground-light/70 dark:text-foreground-dark/70 text-sm">
                    {t(plan.description)}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground-light dark:text-foreground-dark text-sm">
                        {t(feature)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled={!plan.available}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-light/90 dark:hover:bg-primary-dark/90'
                      : plan.available
                      ? 'bg-card-light dark:bg-card-dark border-2 border-border-light dark:border-border-dark text-foreground-light dark:text-foreground-dark hover:border-primary-light dark:hover:border-primary-dark'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {plan.comingSoon ? t('pricing.coming_soon') : plan.available ? t('pricing.get_started') : t('pricing.unavailable')}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark"
          >
            <div className="space-y-6 text-center">
              <div className="text-lg font-semibold text-foreground-light dark:text-foreground-dark flex items-center justify-center gap-2">
                🛠 <span>{t('pricing.modular_approach.title')}</span>
              </div>
              <p className="text-foreground-light dark:text-foreground-dark">
                {t('pricing.modular_approach.description')}
              </p>

              <div className="border-t border-border-light dark:border-border-dark pt-6">
                <div className="text-lg font-semibold text-foreground-light dark:text-foreground-dark flex items-center justify-center gap-2 mb-3">
                  📝 <span>{t('pricing.early_access.title')}</span>
                </div>
                <p className="text-foreground-light dark:text-foreground-dark mb-4">
                  {t('pricing.early_access.description')}
                </p>
              </div>

              <div className="border-t border-border-light dark:border-border-dark pt-6">
                <div className="text-lg font-semibold text-foreground-light dark:text-foreground-dark flex items-center justify-center gap-2 mb-3">
                  💎 <span>{t('pricing.founder_bonus.title')}</span>
                </div>
                <p className="text-primary-light dark:text-primary-dark font-medium">
                  {t('pricing.founder_bonus.description')}
                </p>
              </div>

              <Link href="/waitlist">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 bg-primary-light dark:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RocketLaunchIcon className="w-5 h-5" />
                  {t('pricing.cta.button')}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
