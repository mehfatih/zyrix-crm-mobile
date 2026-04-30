/**
 * ProfileScreen — merchant account profile surface.
 *
 * Sprint 1 (app) wires the **country picker** separately from the UI
 * language switcher. Changing the language is a pure UI concern and
 * must not change currency, tax rules, or date format. Those are
 * driven by the country chosen on this screen.
 *
 * Layout uses the expanded vibrant palette: lavender-tinted country
 * card for the business context, mint-tinted row for the user identity,
 * and coral-tinted row that surfaces the active language (tap opens
 * the language switcher sheet used by the rest of the app).
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { LanguageSwitcher } from '../../../components/common/LanguageSwitcher';
import { CountryPicker } from '../../../components/forms/CountryPicker';
import { darkColors } from '../../../theme/dark';
import { findCountry } from '../../../constants/countries';
import { getCountryConfig } from '../../../config/countries';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import type { SupportedLanguage } from '../../../i18n';
import { useAuthStore } from '../../../store/authStore';
import { useCountryConfigStore } from '../../../store/countryConfigStore';
import { useToastStore } from '../../../store/toastStore';
import { useUiStore } from '../../../store/uiStore';
import { useUserStore } from '../../../store/userStore';
import type { CountryCode } from '../../../types/country';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
};

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUser = useUserStore((s) => s.currentUser);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const biometricEnabled = useUserStore((s) => s.biometricEnabled);
  const countryCode = useCountryConfigStore((s) => s.countryCode);
  const setCountry = useCountryConfigStore((s) => s.setCountry);
  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const pushToast = useToastStore((s) => s.show);
  const twoFactorEnabled = useAuthStore((s) => s.twoFactorEnabled);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [useUSD, setUseUSD] = useState(false);

  const goToSettingsRoute = (route: string): void => {
    try {
      (navigation as unknown as { navigate: (name: string, params?: unknown) => void })
        .navigate('MoreTab', { screen: 'Settings', params: { screen: route } });
    } catch {
      // ignore — route missing in this build
    }
  };

  const activeCountry = findCountry(countryCode);
  const config = getCountryConfig(activeCountry.code);

  const handleCountrySelect = async (code: CountryCode): Promise<void> => {
    setPickerOpen(false);
    await setCountry(code);
    // Mirror the choice on the user profile so it survives a server-side
    // rehydrate. Language is deliberately untouched here.
    await updateProfile({ country: code });
    pushToast({
      variant: 'success',
      title: t('profile.countryUpdated'),
      description: t('profile.countryUpdatedSubtitle'),
    });
  };

  const openDrawer = (): void => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('navigation.profile')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={openDrawer}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('navigation.menu')}
            style={styles.menuBtn}
          >
            <Icon name="menu-outline" size={24} color={darkColors.textOnPrimary} />
          </Pressable>
        }
        rightSlot={<LanguageSwitcher />}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, styles.cardIdentity]}>
          <View style={[styles.iconBubble, { backgroundColor: darkColors.mintSoft }]}>
            <Icon
              name="person-circle-outline"
              size={28}
              color={darkColors.mint}
            />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.name')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {currentUser?.name || t('common.hello')}
            </Text>
            {currentUser?.email ? (
              <Text style={styles.cardCaption} numberOfLines={1}>
                {currentUser.email}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.card,
            styles.cardCountry,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('profile.changeCountry')}
        >
          <View
            style={[styles.iconBubble, { backgroundColor: darkColors.lavenderSoft }]}
          >
            <Text style={styles.flag}>{activeCountry.flag}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.country')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {activeCountry.name[language]}
            </Text>
            <Text style={styles.cardCaption} numberOfLines={1}>
              {t('profile.countryHint', {
                currency: config.currency,
                tax: config.tax,
              })}
            </Text>
          </View>
          <Icon
            name="chevron-forward"
            size={20}
            color={darkColors.textMuted}
            style={styles.chevron}
          />
        </Pressable>

        <View style={[styles.card, styles.cardLanguage]}>
          <View
            style={[styles.iconBubble, { backgroundColor: darkColors.coralSoft }]}
          >
            <Icon
              name="language-outline"
              size={22}
              color={darkColors.coral}
            />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.language')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {LANG_LABEL[language]}
            </Text>
            <Text style={styles.cardCaption}>
              {t('profile.languageHint')}
            </Text>
          </View>
          <LanguageSwitcher />
        </View>

        {currentUser?.email ? (
          <View style={[styles.card, styles.cardIdentity]}>
            <View style={[styles.iconBubble, { backgroundColor: darkColors.skySoft }]}>
              <Icon name="mail-outline" size={22} color={darkColors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>{t('profile.email')}</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {currentUser.email}
              </Text>
              <Text style={styles.cardCaption}>{t('profile.emailVerified')}</Text>
            </View>
            <Icon name="checkmark-circle" size={22} color={darkColors.success} />
          </View>
        ) : null}

        <View style={[styles.card, styles.cardIdentity]}>
          <View style={[styles.iconBubble, { backgroundColor: darkColors.peachSoft }]}>
            <Icon name="call-outline" size={22} color={darkColors.peach} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.phone')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {currentUser?.phone ?? '—'}
            </Text>
            <Text style={styles.cardCaption}>{t('profile.phoneHint')}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setUseUSD((v) => !v)}
          style={({ pressed }) => [
            styles.card,
            styles.cardIdentity,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="switch"
          accessibilityState={{ checked: useUSD }}
        >
          <View style={[styles.iconBubble, { backgroundColor: darkColors.mintSoft }]}>
            <Icon name="cash-outline" size={22} color={darkColors.mint} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.currencyPreference')}</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {useUSD ? 'USD' : config.currency}
            </Text>
            <Text style={styles.cardCaption}>
              {t('profile.currencyPreferenceHint', { alt: useUSD ? config.currency : 'USD' })}
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              useUSD ? styles.toggleOn : styles.toggleOff,
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                useUSD ? styles.toggleKnobOn : styles.toggleKnobOff,
              ]}
            />
          </View>
        </Pressable>

        <Text style={styles.sectionHeading}>{t('profile.securityTitle')}</Text>

        <Pressable
          onPress={() => goToSettingsRoute('Security')}
          style={({ pressed }) => [
            styles.card,
            styles.cardIdentity,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconBubble, { backgroundColor: darkColors.primarySoft }]}>
            <Icon name="finger-print-outline" size={22} color={darkColors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.biometric')}</Text>
            <Text style={styles.cardValue}>{biometricEnabled ? 'On' : 'Off'}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={darkColors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => goToSettingsRoute('TwoFactor')}
          style={({ pressed }) => [
            styles.card,
            styles.cardIdentity,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconBubble, { backgroundColor: darkColors.lavenderSoft }]}>
            <Icon name="key-outline" size={22} color={darkColors.lavender} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.twoFactor')}</Text>
            <Text style={styles.cardValue}>{twoFactorEnabled ? 'On' : 'Off'}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={darkColors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => goToSettingsRoute('DeviceManagement')}
          style={({ pressed }) => [
            styles.card,
            styles.cardIdentity,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconBubble, { backgroundColor: darkColors.sunshineSoft }]}>
            <Icon name="phone-portrait-outline" size={22} color={darkColors.warning} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.activeSessions')}</Text>
            <Text style={styles.cardValue}>{t('common.edit')}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={darkColors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => goToSettingsRoute('Security')}
          style={({ pressed }) => [
            styles.card,
            styles.cardIdentity,
            pressed ? { opacity: 0.9 } : null,
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconBubble, { backgroundColor: darkColors.roseSoft }]}>
            <Icon name="lock-closed-outline" size={22} color={darkColors.rose} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{t('profile.passwordChange')}</Text>
            <Text style={styles.cardValue}>{t('common.continue')}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={darkColors.textMuted} />
        </Pressable>

        <View style={styles.helpCard}>
          <Icon
            name="information-circle-outline"
            size={20}
            color={darkColors.primary}
          />
          <Text style={styles.helpText}>{t('profile.separationNote')}</Text>
        </View>
      </ScrollView>

      <CountryPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(code) => void handleCountrySelect(code)}
        currentCountry={activeCountry.code}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: darkColors.surface,
    ...shadows.sm,
  },
  cardIdentity: {
    borderLeftWidth: 4,
    borderLeftColor: darkColors.mint,
  },
  cardCountry: {
    borderLeftWidth: 4,
    borderLeftColor: darkColors.lavender,
  },
  cardLanguage: {
    borderLeftWidth: 4,
    borderLeftColor: darkColors.coral,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    ...textStyles.overline,
    color: darkColors.textMuted,
  },
  cardValue: {
    ...textStyles.h4,
    color: darkColors.textHeading,
    marginTop: 2,
  },
  cardCaption: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    marginStart: spacing.xs,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: spacing.sm,
    backgroundColor: darkColors.skySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  helpText: {
    ...textStyles.caption,
    color: darkColors.textHeading,
    flex: 1,
  },
  sectionHeading: {
    ...textStyles.overline,
    color: darkColors.primaryDark,
    marginTop: spacing.base,
    marginHorizontal: spacing.xs,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: darkColors.primary,
  },
  toggleOff: {
    backgroundColor: darkColors.border,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: darkColors.white,
    ...shadows.xs,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
});

export default ProfileScreen;
