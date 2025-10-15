'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageStore } from '@/store/language';
import OptigenceLogo from '@/components/OptigenceLogo';
import TypingInput from '@/components/TypingInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { signIn, signUp } = useAuth();
  const { t } = useLanguageStore();

  // Calculate form completion percentage
  const calculateCompletion = () => {
    if (mode === 'signin') {
      const fields = [email, password];
      const filledFields = fields.filter(field => field.trim().length > 0);
      return (filledFields.length / fields.length) * 100;
    } else {
      const fields = [fullName, username, email, password];
      const filledFields = fields.filter(field => field.trim().length > 0);
      return (filledFields.length / fields.length) * 100;
    }
  };

  const completionPercentage = calculateCompletion();

  // Ensure component is mounted before creating portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!username.trim()) {
          throw new Error(t('auth.username_required'));
        }
        await signUp(email, password, username.trim(), fullName.trim() || undefined);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setError('');
    setShowPassword(false);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm backdrop-brightness-50 modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm p-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl mx-4 my-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative"
        >
        {/* Header */}
        <div className="text-center mb-4">
          <Link href="/" className="flex items-center justify-center mb-2 hover:opacity-90 transition">
            <OptigenceLogo 
              size="md" 
              animate={true} 
              completionPercentage={completionPercentage}
            />
          </Link>
          <h2 className="text-lg sm:text-xl font-bold text-foreground-light dark:text-foreground-dark mb-1">
            {mode === 'signin' ? t('auth.welcome_back') : t('auth.join_optigence')}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-light/70 dark:text-foreground-dark/70">
            {mode === 'signin' 
              ? t('auth.sign_in_subtitle')
              : t('auth.sign_up_subtitle')
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
              <TypingInput
                type="email"
                value={email}
                onChange={setEmail}
                required
                placeholder={t('auth.email_placeholder')}
                typingText="hello@optigence.tech"
                typingSpeed={120}
                typingDelay={2500}
                className="auth-input w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
              />
            </div>
          </div>

          {/* Username (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-1">
                {t('auth.username')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
                <TypingInput
                  type="text"
                  value={username}
                  onChange={setUsername}
                  required
                  placeholder={t('auth.username_placeholder')}
                  typingText="johndoe"
                  typingSpeed={100}
                  typingDelay={2000}
                  className="auth-input w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Full Name (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-1">
                {t('auth.full_name')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
                <TypingInput
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder={t('auth.fullname_placeholder')}
                  typingText="John Doe"
                  typingSpeed={110}
                  typingDelay={2200}
                  className="auth-input w-full pl-10 pr-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 z-10" />
              <TypingInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                required
                placeholder={t('auth.password_placeholder')}
                typingText="SecurePass123!"
                typingSpeed={150}
                typingDelay={3000}
                className="auth-input w-full pl-10 pr-12 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 z-10"
                title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 text-sm bg-primary-light dark:bg-primary-dark hover:bg-primary-light/90 dark:hover:bg-primary-dark/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[40px] touch-manipulation"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="truncate">{mode === 'signin' ? t('auth.signing_in') : t('auth.creating_account')}</span>
              </>
            ) : (
              mode === 'signin' ? t('auth.sign_in') : t('auth.create_account')
            )}
          </button>
        </form>

        {/* Mode Switch */}
        <div className="mt-3 text-center">
          <p className="text-sm text-foreground-light/70 dark:text-foreground-dark/70">
            {mode === 'signin' ? t('auth.no_account') : t('auth.have_account')}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="ml-1 text-primary-light dark:text-primary-dark hover:text-primary-light/80 dark:hover:text-primary-dark/80 font-medium underline underline-offset-2 p-1 min-h-[36px] touch-manipulation inline-flex items-center"
            >
              {mode === 'signin' ? t('auth.sign_up') : t('auth.sign_in')}
            </button>
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-2 right-2 text-foreground-light/50 dark:text-foreground-dark/50 hover:text-foreground-light dark:hover:text-foreground-dark p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors min-h-[32px] min-w-[32px] touch-manipulation flex items-center justify-center"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        </motion.div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Fixed Auth Modal
