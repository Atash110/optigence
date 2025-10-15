'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Locale, defaultLocale, locales } from '@/lib/i18n-config';

type Translations = Record<string, Record<string, unknown>>;

interface TranslationContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations
  const loadTranslations = useCallback(async (newLocale: Locale) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/locales/${newLocale}/common.json`);
      const commonTranslations = await response.json();
      
      // Try to load other translation files
      const otherTranslations = await Promise.allSettled([
        fetch(`/locales/${newLocale}/homepage.json`).then(res => res.json()),
        fetch(`/locales/${newLocale}/waitlist.json`).then(res => res.json()),
        fetch(`/locales/${newLocale}/about.json`).then(res => res.json()),
        fetch(`/locales/${newLocale}/features.json`).then(res => res.json()),
        fetch(`/locales/${newLocale}/pricing.json`).then(res => res.json()),
      ]);

      const [homepage, waitlist, about, features, pricing] = otherTranslations.map(result => 
        result.status === 'fulfilled' ? result.value : {}
      );

      setTranslations({
        common: commonTranslations,
        homepage,
        waitlist,
        about,
        features,
        pricing,
      });
    } catch (error) {
      console.warn(`Failed to load translations for ${newLocale}:`, error);
      // Fallback to English if available
      if (newLocale !== 'en') {
        await loadTranslations('en');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set locale and persist to localStorage (sync with language store format)
  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        // Update both storage keys for compatibility
        localStorage.setItem('preferred-locale', newLocale);
        
        // Also update the language store's localStorage to keep them in sync
        try {
          const existingStore = localStorage.getItem('optigence-language');
          if (existingStore) {
            const parsed = JSON.parse(existingStore);
            parsed.state.currentLanguage = newLocale;
            localStorage.setItem('optigence-language', JSON.stringify(parsed));
          }
        } catch {
          // If language store doesn't exist or is malformed, create basic structure
          localStorage.setItem('optigence-language', JSON.stringify({
            state: { currentLanguage: newLocale },
            version: 0
          }));
        }
      }
      loadTranslations(newLocale);
    }
  }, [loadTranslations]);

  // Translation function
  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = translations;
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  }, [translations]);

  // Initialize locale from localStorage (sync with language store)
  useEffect(() => {
    const savedLanguageStore = typeof window !== 'undefined' ? localStorage.getItem('optigence-language') : null;
    let savedLocale: Locale | null = null;
    
    if (savedLanguageStore) {
      try {
        const parsed = JSON.parse(savedLanguageStore);
        savedLocale = parsed.state?.currentLanguage as Locale;
      } catch {
        console.warn('Failed to parse language store from localStorage');
      }
    }
    
    // Fallback to preferred-locale if language store doesn't have it
    if (!savedLocale) {
      savedLocale = (typeof window !== 'undefined' ? localStorage.getItem('preferred-locale') : null) as Locale;
    }
    
    const initialLocale = savedLocale && locales.includes(savedLocale) ? savedLocale : defaultLocale;
    setLocaleState(initialLocale);
    loadTranslations(initialLocale);
  }, [loadTranslations]);

  return (
    <TranslationContext.Provider value={{ locale, translations, setLocale, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
