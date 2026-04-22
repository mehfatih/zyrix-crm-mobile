/**
 * i18next configuration for Zyrix CRM.
 * Detects the device language on first launch, falls back to English,
 * and exposes a small helper for switching language at runtime.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

import ar from './locales/ar.json';
import en from './locales/en.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: readonly SupportedLanguage[] = ['ar'];

export const isRTLLanguage = (lang: string): boolean =>
  RTL_LANGUAGES.includes(lang as SupportedLanguage);

const detectDeviceLanguage = (): SupportedLanguage => {
  try {
    const locales = Localization.getLocales?.() ?? [];
    const first = locales[0];
    const code = (first?.languageCode ?? 'en').toLowerCase();
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
      return code as SupportedLanguage;
    }
  } catch {
    // ignore — fallback to English
  }
  return 'en';
};

const initialLanguage = detectDeviceLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    tr: { translation: tr },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
  react: { useSuspense: false },
});

// Align the native layout direction with the starting language so the very
// first render is correct. Persistent switching happens in the UI store.
const shouldBeRTL = isRTLLanguage(initialLanguage);
if (I18nManager.isRTL !== shouldBeRTL) {
  try {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  } catch {
    // no-op on unsupported platforms
  }
}

export default i18n;
