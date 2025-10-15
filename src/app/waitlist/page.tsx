'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';
import TypingInput from '@/components/TypingInput';

// Declare global grecaptcha Enterprise
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

function WaitlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguageStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill email from URL parameter (coming from homepage)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    // Wait for reCAPTCHA to load
    const checkRecaptcha = () => {
      if (typeof window !== 'undefined' && window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          console.log("reCAPTCHA is ready");
        });
      } else {
        // If not ready, check again in 100ms
        setTimeout(checkRecaptcha, 100);
      }
    };
    
    checkRecaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if reCAPTCHA is loaded and ready
      if (!window.grecaptcha || !window.grecaptcha.ready) {
        throw new Error('reCAPTCHA not loaded. Please refresh the page and try again.');
      }

      // Use reCAPTCHA ready callback to ensure it's initialized
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
            { action: 'waitlist_submit' }
          ).then(resolve).catch(reject);
        });
      });

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          referralSource: 'website',
          subscribed: subscribed,
          token: token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      // Success - redirect to confirmation page
      setSuccess(t('waitlist.success_message'));
      setTimeout(() => {
        router.push('/waitlist-confirmation');
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      // Check if it's an API error code that we can translate
      const translationKey = `waitlist.errors.${errorMessage}`;
      const translatedError = t(translationKey);
      
      // If translation key exists (not the same as the key), use translated version
      const finalError = translatedError !== translationKey ? translatedError : errorMessage;
      
      setError(finalError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="py-16 px-4 sm:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark mb-4">
              {t('waitlist.title')}
            </h1>
            <p className="text-lg text-foreground-light dark:text-foreground-dark max-w-2xl mx-auto leading-relaxed">
              {t('waitlist.description')}
            </p>
          </motion.div>

          {/* Email Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark max-w-md mx-auto mb-12"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                  </div>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-2">
                  {t('waitlist.email_label')}
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
                  <TypingInput
                    type="email"
                    id="email"
                    value={email}
                    onChange={setEmail}
                    required
                    placeholder={t('waitlist.email_placeholder')}
                    typingText="hello@optigence.tech"
                    typingSpeed={120}
                    typingDelay={2000}
                    className="w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Newsletter Subscription Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="subscribed"
                  checked={subscribed}
                  onChange={(e) => setSubscribed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary-light dark:accent-primary-dark focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark rounded"
                />
                <label htmlFor="subscribed" className="text-sm text-foreground-light dark:text-foreground-dark leading-relaxed">
                  {t('waitlist.subscribe_label')}
                </label>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || isLoading}
                className="w-full py-3 bg-primary-light dark:bg-primary-dark hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('waitlist.submitting')}
                  </>
                ) : (
                  t('waitlist.submit_button')
                )}
              </button>
            </form>
          </motion.div>

          {/* Benefits Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-foreground-light dark:text-foreground-dark mb-6">
              {t('waitlist.benefits.title')}
            </h2>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground-light dark:text-foreground-dark mb-1">
                    {t('waitlist.benefits.early_access.title')}
                  </h3>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 text-sm">
                    {t('waitlist.benefits.early_access.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground-light dark:text-foreground-dark mb-1">
                    {t('waitlist.benefits.founder_pricing.title')}
                  </h3>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 text-sm">
                    {t('waitlist.benefits.founder_pricing.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground-light dark:text-foreground-dark mb-1">
                    {t('waitlist.benefits.shape_future.title')}
                  </h3>
                  <p className="text-foreground-light/80 dark:text-foreground-dark/80 text-sm">
                    {t('waitlist.benefits.shape_future.description')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="mt-12"
          >
            <p className="text-foreground-light/60 dark:text-foreground-dark/60">
              {t('waitlist.questions_prefix')}{' '}
              <a
                href="/features"
                className="text-primary-light dark:text-primary-dark hover:underline font-medium"
              >
                {t('waitlist.questions_features')}
              </a>
              {' '}{t('waitlist.questions_or')}{' '}
              <a
                href="/pricing"
                className="text-primary-light dark:text-primary-dark hover:underline font-medium"
              >
                {t('waitlist.questions_pricing')}
              </a>
              .
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <WaitlistContent />
    </Suspense>
  );
}
