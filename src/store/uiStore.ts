/**
 * UI store — language selection, RTL handling, and first-launch flag.
 *
 * Language preference is persisted via expo-secure-store so it survives
 * restarts. Switching to/from an RTL language calls `Updates.reloadAsync()`
 * so that React Native picks up the new layout direction.
 */

import { create } from 'zustand';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

import i18n, {
  SUPPORTED_LANGUAGES,
  isRTLLanguage,
  type SupportedLanguage,
} from '../i18n';

const LANGUAGE_KEY = 'zyrix.ui.language';
const ONBOARDED_KEY = 'zyrix.ui.hasSelectedLanguage';

type SetState = (
  partial: Partial<UiStoreState> | ((state: UiStoreState) => Partial<UiStoreState>)
) => void;

const persist = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn('[uiStore] failed to persist', key, err);
  }
};

const read = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn('[uiStore] failed to read', key, err);
    return null;
  }
};

const isSupported = (value: string | null): value is SupportedLanguage =>
  !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export interface UiStoreState {
  language: SupportedLanguage;
  isRTL: boolean;
  hasSelectedLanguage: boolean;
  hasHydrated: boolean;

  setLanguage: (language: SupportedLanguage) => Promise<void>;
  markLanguageSelected: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const applySetLanguage =
  (set: SetState) =>
  async (language: SupportedLanguage): Promise<void> => {
    await persist(LANGUAGE_KEY, language);
    await persist(ONBOARDED_KEY, 'true');
    await i18n.changeLanguage(language);

    const shouldBeRTL = isRTLLanguage(language);
    const directionChanged = I18nManager.isRTL !== shouldBeRTL;

    set({
      language,
      isRTL: shouldBeRTL,
      hasSelectedLanguage: true,
    });

    if (directionChanged) {
      try {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
      } catch (err) {
        console.warn('[uiStore] unable to toggle RTL', err);
      }
      // Reload to apply layout direction natively.
      try {
        await Updates.reloadAsync();
      } catch (err) {
        console.warn('[uiStore] reloadAsync failed (dev mode is expected)', err);
      }
    }
  };

const applyMarkLanguageSelected =
  (set: SetState) => async (): Promise<void> => {
    await persist(ONBOARDED_KEY, 'true');
    set({ hasSelectedLanguage: true });
  };

const applyHydrate = (set: SetState) => async (): Promise<void> => {
  const [storedLanguage, storedOnboarded] = await Promise.all([
    read(LANGUAGE_KEY),
    read(ONBOARDED_KEY),
  ]);

  const language: SupportedLanguage = isSupported(storedLanguage)
    ? storedLanguage
    : ((i18n.language as SupportedLanguage) ?? 'en');

  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }

  set({
    language,
    isRTL: isRTLLanguage(language),
    hasSelectedLanguage: storedOnboarded === 'true',
    hasHydrated: true,
  });
};

export const useUiStore = create<UiStoreState>((set) => ({
  language: (i18n.language as SupportedLanguage) ?? 'en',
  isRTL: I18nManager.isRTL,
  hasSelectedLanguage: false,
  hasHydrated: false,

  setLanguage: applySetLanguage(set),
  markLanguageSelected: applyMarkLanguageSelected(set),
  hydrate: applyHydrate(set),
}));

export const UI_LANGUAGE_STORAGE_KEY = LANGUAGE_KEY;
export const UI_ONBOARDED_STORAGE_KEY = ONBOARDED_KEY;
