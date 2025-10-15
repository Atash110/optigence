'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  MapIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useLanguageStore } from '@/store/language';
import { useAppStore } from '@/store/app';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
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

const navigationItems = [
  {
    name: 'nav.dashboard',
    href: '/',
    icon: HomeIcon,
    public: true,
  },
  {
    name: 'nav.optimail',
    href: '/optimail',
    icon: EnvelopeIcon,
    descriptionKey: 'nav.optimail_description',
    public: false,
  },
  {
    name: 'nav.optishop',
    href: '/optishop',
    icon: ShoppingBagIcon,
    descriptionKey: 'nav.optishop_description',
    public: false,
  },
  {
    name: 'nav.optihire',
    href: '/optihire',
    icon: BriefcaseIcon,
    descriptionKey: 'nav.optihire_description',
    public: false,
  },
  {
    name: 'nav.optitrip',
    href: '/optitrip',
    icon: MapIcon,
    descriptionKey: 'nav.optitrip_description',
    public: false,
  },
];

const publicPages = [
  {
    name: 'nav.about',
    href: '/about',
    icon: InformationCircleIcon,
  },
  {
    name: 'nav.pricing',
    href: '/pricing',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'nav.features',
    href: '/features',
    icon: SparklesIcon,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { t, currentLanguage, setLanguage } = useLanguageStore();
  const { setSidebarOpen } = useAppStore();
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const currentLang = languages.find(lang => lang.code === currentLanguage);

  const handleLinkClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <motion.div 
      className="h-full flex flex-col bg-background-light dark:bg-background-dark border-r border-border-light dark:border-border-dark relative overflow-hidden"
      animate={{
        background: [
          'linear-gradient(180deg, rgba(59, 130, 246, 0.01), transparent)',
          'linear-gradient(180deg, rgba(99, 102, 241, 0.02), transparent)',
          'linear-gradient(180deg, rgba(59, 130, 246, 0.01), transparent)'
        ]
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Subtle breathing overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute top-1/4 right-0 w-16 h-16 bg-primary-light/10 dark:bg-primary-dark/10 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-0 w-12 h-12 bg-secondary-light/10 dark:bg-secondary-dark/10 rounded-full blur-2xl" />
      </motion.div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <motion.nav
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 space-y-6"
        >
        {/* Main Modules */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t('sidebar.modules')}
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark border-r-2 border-primary-light dark:border-primary-dark'
                        : 'text-foreground-light dark:text-foreground-dark hover:bg-accent-light dark:hover:bg-accent-dark/20 hover:text-primary-light dark:hover:text-primary-dark'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-colors ${
                        isActive
                          ? 'text-primary-light dark:text-primary-dark'
                          : 'text-gray-400 group-hover:text-primary-light dark:group-hover:text-primary-dark'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{t(item.name)}</span>
                        {!item.public && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                            {t('sidebar.mvp_badge')}
                          </span>
                        )}
                      </div>
                      {item.descriptionKey && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t(item.descriptionKey)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <motion.div
            variants={itemVariants}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg"
          >
            <EllipsisHorizontalIcon className="w-5 h-5 mr-3" />
            <span>{t('nav.more_coming')}</span>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light dark:border-border-dark" />

        {/* Public Pages */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t('sidebar.information')}
          </h2>
          <div className="space-y-1">
            {publicPages.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark'
                        : 'text-foreground-light dark:text-foreground-dark hover:bg-accent-light dark:hover:bg-accent-dark/20 hover:text-primary-light dark:hover:text-primary-dark'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-colors ${
                        isActive
                          ? 'text-primary-light dark:text-primary-dark'
                          : 'text-gray-400 group-hover:text-primary-light dark:group-hover:text-primary-dark'
                      }`}
                    />
                    <span>{t(item.name)}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
        </motion.nav>
      </div>

      {/* Mobile Controls Section - Always visible at bottom */}
      <div className="md:hidden border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
        <div className="p-4 space-y-3">
          {/* Authentication */}
          {user ? (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center w-full p-3 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark">
                <div className="w-8 h-8 bg-primary-light dark:bg-primary-dark rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-foreground-light dark:text-foreground-dark truncate">
                    {user.username || user.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-foreground-light/60 dark:text-foreground-dark/60 flex-shrink-0" />
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
                <Menu.Items className="absolute bottom-full left-0 right-0 mb-2 bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark z-50">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={`${
                          active ? 'bg-accent-light dark:bg-accent-dark/20' : ''
                        } group flex items-center space-x-3 w-full px-4 py-3 text-sm text-foreground-light dark:text-foreground-dark rounded-lg transition-colors`}
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
            <button
              onClick={() => setShowAuthModal(true)}
              disabled={loading}
              className="flex items-center w-full p-3 bg-primary-light hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <UserIcon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">{loading ? t('common.loading') : t('auth.sign_in')}</span>
            </button>
          )}

          {/* Language Selector */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center w-full p-3 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark/20 transition-colors bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark">
              <GlobeAltIcon className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground-light dark:text-foreground-dark truncate">
                {currentLang?.name}
              </span>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-base">{currentLang?.flag}</span>
                <ChevronDownIcon className="w-4 h-4 text-foreground-light/60 dark:text-foreground-dark/60" />
              </div>
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
              <Menu.Items className="absolute bottom-full left-0 right-0 mb-2 bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark z-50 max-h-48 overflow-y-auto">
                {languages.map((language) => (
                  <Menu.Item key={language.code}>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          setLanguage(language.code as SupportedLanguage);
                          setSidebarOpen(false);
                        }}
                        className={`${
                          active ? 'bg-accent-light dark:bg-accent-dark/20' : ''
                        } ${
                          currentLanguage === language.code ? 'bg-accent-light dark:bg-accent-dark/30 text-primary-light dark:text-primary-dark' : 'text-foreground-light dark:text-foreground-dark'
                        } group flex items-center space-x-3 w-full px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors`}
                      >
                        <span className="text-lg flex-shrink-0">{language.flag}</span>
                        <span className="truncate">{language.name}</span>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Footer - Only on desktop */}
      <div className="hidden md:block p-4 border-t border-border-light dark:border-border-dark">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>Optigence v1.0</p>
          <p className="mt-1">{t('sidebar.platform_subtitle')}</p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </motion.div>
  );
}
