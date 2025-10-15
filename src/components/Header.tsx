'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAppStore } from '@/store/app';
import { useLanguageStore } from '@/store/language';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import OptigenceLogo from '@/components/OptigenceLogo';
import type { SupportedLanguage } from '@/types';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
] as const;

export default function Header() {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useAppStore();
  const { currentLanguage, setLanguage, t } = useLanguageStore();
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const currentLang = languages.find(lang => lang.code === currentLanguage);

  // Track scroll direction and stop
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);
          
          // Only trigger changes if scroll difference is significant (more than 5px)
          if (scrollDifference > 5) {
            // Always show header when at top
            if (currentScrollY <= 50) {
              setIsHeaderVisible(true);
            } else if (currentScrollY < lastScrollY - 10) {
              // Scrolling up with more threshold
              setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY + 10) {
              // Scrolling down with more threshold
              setIsHeaderVisible(false);
            }
            
            setLastScrollY(currentScrollY);
          }
          
          // Clear previous timeout
          if (scrollTimeout) {
            clearTimeout(scrollTimeout);
          }
          
          // Set new timeout to show header when scrolling stops
          const newTimeout = setTimeout(() => {
            if (currentScrollY > 50) {
              setIsHeaderVisible(true);
            }
          }, 500); // Increase timeout to 500ms for more stable behavior
          
          setScrollTimeout(newTimeout);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [lastScrollY, scrollTimeout]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark shadow-sm transition-all duration-500 ease-out ${
      isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Mobile: Sidebar Toggle, Desktop: Sidebar Toggle + Logo */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors"
            aria-label="Toggle sidebar"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bars3Icon className="w-5 h-5 text-foreground-light dark:text-foreground-dark" />
            </motion.div>
          </button>
          
          {/* Logo - Hidden on mobile, visible on desktop */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {/* Optigence Logo */}
            <OptigenceLogo 
              size="md" 
              animate={false}
              className="text-primary-light dark:text-primary-dark"
            />
            
            {/* Brand Name */}
            <span className="text-lg sm:text-xl font-bold tracking-wide text-foreground-light dark:text-foreground-dark">
              Optigence
            </span>
          </Link>
        </div>

        {/* Center Section - Mobile: Logo only */}
        <Link 
          href="/" 
          className="flex md:hidden items-center gap-2 hover:opacity-90 transition-opacity"
        >
          {/* Optigence Logo */}
          <OptigenceLogo 
            size="md" 
            animate={false}
            className=""
          />
          
          {/* Brand Name */}
          <span className="text-lg font-bold tracking-wide text-foreground-light dark:text-foreground-dark">
            Optigence
          </span>
        </Link>
        
        {/* Right Section - Hidden on mobile, visible on desktop */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {/* Authentication */}
          {user ? (
            /* User Menu */
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors">
                <div className="w-8 h-8 bg-primary-light dark:bg-primary-dark rounded-full flex items-center justify-center">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username || user.email}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground-light dark:text-foreground-dark hidden sm:block">
                  {user.username || user.email}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-foreground-light/60 dark:text-foreground-dark/60 hidden sm:block" />
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark z-50">
                  <Menu.Item>
                    {({ active }) => (
                      <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
                        <p className="text-sm font-medium text-foreground-light dark:text-foreground-dark">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-foreground-light/60 dark:text-foreground-dark/60">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={`${
                          active ? 'bg-accent-light dark:bg-accent-dark/20' : ''
                        } group flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground-light dark:text-foreground-dark rounded-b-lg transition-colors`}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>{t('auth.sign_out')}</span>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            /* Sign In Button - Mobile Responsive */
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowAuthModal(true)}
                disabled={loading}
                className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-primary-light hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light text-white rounded-md font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? t('common.loading') : t('auth.sign_in')}
              </button>
            </div>
          )}

          {/* Language Selector */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors">
              <span className="text-sm font-medium hidden sm:block text-foreground-light dark:text-foreground-dark">
                {currentLang?.code.toUpperCase()}
              </span>
              <span className="text-sm font-medium sm:hidden">
                {currentLang?.flag}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-foreground-light dark:text-foreground-dark" />
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark z-50 max-h-64 overflow-y-auto">
                {languages.map((language) => (
                  <Menu.Item key={language.code}>
                    {({ active }) => (
                      <button
                        onClick={() => setLanguage(language.code as SupportedLanguage)}
                        className={`${
                          active ? 'bg-accent-light dark:bg-accent-dark/20' : ''
                        } ${
                          currentLanguage === language.code ? 'bg-accent-light dark:bg-accent-dark/30 text-primary-light dark:text-primary-dark' : 'text-foreground-light dark:text-foreground-dark'
                        } group flex items-center space-x-3 w-full px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors`}
                      >
                        <span className="text-lg">{language.flag}</span>
                        <span>{language.name}</span>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors"
            aria-label={t('theme.toggle')}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-foreground-light dark:text-foreground-dark" />
              ) : (
                <SunIcon className="w-5 h-5 text-foreground-light dark:text-foreground-dark" />
              )}
            </motion.div>
          </button>
        </div>
        
        {/* Mobile: Theme Toggle */}
        <div className="md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors"
            aria-label={t('theme.toggle')}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-foreground-light dark:text-foreground-dark" />
              ) : (
                <SunIcon className="w-5 h-5 text-foreground-light dark:text-foreground-dark" />
              )}
            </motion.div>
          </button>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </header>
  );
}
