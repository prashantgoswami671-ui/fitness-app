import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';

const LANGUAGE_STORAGE_KEY = 'fitness-language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
} as const;

type SupportedLanguage = keyof typeof resources;

async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in resources) {
      return stored as SupportedLanguage;
    }
  } catch {
    // ignore
  }
  return null;
}

async function getInitialLanguage(): Promise<SupportedLanguage> {
  const stored = await getStoredLanguage();
  if (stored) return stored;

  const deviceLocales = Localization.getLocales();
  if (deviceLocales.length > 0) {
    const deviceLanguage = deviceLocales[0].languageCode;
    if (deviceLanguage && deviceLanguage in resources) {
      return deviceLanguage as SupportedLanguage;
    }
  }

  return 'en';
}

export async function initI18n(): Promise<void> {
  const initialLanguage = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || 'en';
}

export function getAvailableLanguages(): Array<{ code: SupportedLanguage; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' },
  ];
}

export default i18n;