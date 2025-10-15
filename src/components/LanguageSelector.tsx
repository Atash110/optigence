'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguageStore } from '@/store/language';
import { locales, localeNames, type Locale } from '@/lib/i18n-config';

export default function LanguageSelector() {
  const { currentLanguage, setLanguage, t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setLanguage(newLocale); // Update language store (primary system)
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-foreground-light dark:text-foreground-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
        aria-label={t('language.select_language')}
      >
        <GlobeAltIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{localeNames[currentLanguage]}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-20">
            <div className="py-1">
              {locales.map((localeOption) => (
                <button
                  key={localeOption}
                  onClick={() => handleLocaleChange(localeOption)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-background-light dark:hover:bg-background-dark transition-colors ${
                    currentLanguage === localeOption
                      ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark'
                      : 'text-foreground-light dark:text-foreground-dark'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{localeNames[localeOption]}</span>
                    {currentLanguage === localeOption && (
                      <div className="w-2 h-2 bg-primary-light dark:bg-primary-dark rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
