'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';

interface ProtectedModuleProps {
  children: React.ReactNode;
  moduleName: string;
}

const EARLY_ACCESS_PASSWORD = process.env.NEXT_PUBLIC_EARLY_ACCESS_PASSWORD || 'optigence2025';

export default function ProtectedModule({ children, moduleName }: ProtectedModuleProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguageStore();

  // Check if user is already authenticated for this session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('moduleAccess') === 'granted';
    setIsAuthenticated(isAuth);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === EARLY_ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('moduleAccess', 'granted');
    } else {
      setError(t('module.locked.invalid_code'));
    }

    setLoading(false);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-dark via-primary-dark to-accent-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card-light/10 dark:bg-card-dark/10 backdrop-blur-lg rounded-2xl p-8 border border-border-light/20 dark:border-border-dark/20"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-primary-light to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <LockClosedIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-foreground-dark mb-2">
            {t('module.locked.title')}
          </h1>
          
          <p className="text-foreground-dark/70 text-sm">
            {moduleName} {t('module.locked.message')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              {t('module.locked.access_code')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('module.locked.access_code_placeholder')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                title={showPassword ? t('module.locked.hide_password') : t('module.locked.show_password')}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading || !password.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                {t('module.locked.verifying')}
              </div>
            ) : (
              t('module.locked.access_module')
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            {t('module.locked.no_code')}{' '}
            <a 
              href="mailto:support@optigence.ai?subject=Early Access Request&body=I would like to request early access to Optigence modules."
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {t('module.locked.request_access')}
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
