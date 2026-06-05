/**
 * TwoFactorPromptScreen — surfaced after a successful password login
 * when the account has 2FA enabled. Auto-submits when 6 digits are
 * entered; falls back to a recovery code link.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import { getPageAccent } from '../../theme/dark/accents';
import { logSecurityEvent } from '../../utils/securityEvents';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { twoFactorChallengeApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useToast } from '../../hooks/useToast';
import type { ApiError } from '../../api/types';
import type { AuthStackParamList } from '../../navigation/types';

const COOLDOWN_SECONDS = 30;

const PAGE_ACCENT = getPageAccent('twoFactor');

export const TwoFactorPromptScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'TwoFactorPrompt'>>();
  const challengeToken = route.params?.challengeToken ?? '';
  const toast = useToast();
  const verifyTwoFactor = useAuthStore((state) => state.verifyTwoFactor);
  const markTrustedDevice = useAuthStore((state) => state.markTrustedDevice);
  const loginAuth = useAuthStore((state) => state.login);
  const setUser = useUserStore((state) => state.setUser);

  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = async (): Promise<void> => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const expectedLength = useRecovery ? 8 : 6;
      if (code.length !== expectedLength) {
        toast.error(t('forms.required'));
        return;
      }
      // Exchange the challenge token + code for a real token pair. A wrong
      // code throws (backend 401/400) and is surfaced; login only completes
      // once the backend returns a session.
      const { authUser, user, tokens } = await twoFactorChallengeApi(
        challengeToken,
        code
      );
      if (trustDevice) markTrustedDevice();
      verifyTwoFactor();
      await logSecurityEvent('two_factor_success', {
        method: useRecovery ? 'recovery' : 'totp',
      });
      await setUser(user);
      await loginAuth({
        user: authUser,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresInSec: tokens.expiresIn,
      });
      // No navigation needed: completing login flips isAuthenticated and the
      // root navigator swaps the auth stack for the app.
    } catch (err) {
      const message = (err as ApiError)?.message;
      toast.error(message || t('twoFactor.verifyCode'));
      setCode('');
    } finally {
      submitting.current = false;
    }
  };

  const onChange = (next: string): void => {
    const cleaned = next.replace(/[^0-9A-Z]/gi, '').toUpperCase();
    const limit = useRecovery ? 8 : 6;
    setCode(cleaned.slice(0, limit));
  };

  const resend = (): void => {
    setCooldown(COOLDOWN_SECONDS);
    toast.info(t('twoFactor.verifyCode'));
  };

  useEffect(() => {
    if ((useRecovery && code.length === 8) || (!useRecovery && code.length === 6)) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('twoFactor.title')}
        accent={PAGE_ACCENT}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Icon name="shield-checkmark-outline" size={32} color={darkColors.primary} />
        </View>
        <Text style={styles.title}>{t('twoFactor.verifyCode')}</Text>
        <Text style={styles.subtitle}>{t('twoFactor.enterSixDigits')}</Text>

        <TextInput
          value={code}
          onChangeText={onChange}
          keyboardType={useRecovery ? 'default' : 'number-pad'}
          autoFocus
          autoCapitalize="characters"
          style={styles.codeInput}
          placeholder={useRecovery ? 'XXXXXXXX' : '••••••'}
          placeholderTextColor={darkColors.textMuted}
          maxLength={useRecovery ? 8 : 6}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => {
              setUseRecovery((prev) => !prev);
              setCode('');
            }}
          >
            <Text style={styles.toggleLink}>
              {useRecovery
                ? t('twoFactor.verifyCode')
                : t('twoFactor.useRecoveryCode')}
            </Text>
          </Pressable>
          <Pressable disabled={cooldown > 0} onPress={resend}>
            <Text
              style={[
                styles.resendLink,
                cooldown > 0 ? { color: darkColors.textMuted } : null,
              ]}
            >
              {cooldown > 0
                ? `${t('common.tryAgain')} (${cooldown}s)`
                : t('common.tryAgain')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>
            {t('twoFactor.dontAskFor30Days')}
          </Text>
          <Switch
            value={trustDevice}
            onValueChange={setTrustDevice}
            trackColor={{ false: darkColors.border, true: darkColors.primary }}
            thumbColor={darkColors.white}
          />
        </View>

        <Button
          label={t('common.confirm')}
          onPress={() => void submit()}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  body: {
    flex: 1,
    padding: spacing.xl,
    rowGap: spacing.sm,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  title: { ...textStyles.h2, color: darkColors.textPrimary, textAlign: 'center' },
  subtitle: { ...textStyles.body, color: darkColors.textMuted, textAlign: 'center' },
  codeInput: {
    ...textStyles.h1,
    color: darkColors.primaryDark,
    backgroundColor: darkColors.surface,
    borderWidth: 1.5,
    borderColor: darkColors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    letterSpacing: 8,
    width: 240,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  toggleLink: { ...textStyles.label, color: darkColors.primary },
  resendLink: { ...textStyles.label, color: darkColors.primary },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  trustLabel: {
    ...textStyles.body,
    color: darkColors.textSecondary,
    flex: 1,
  },
});

export default TwoFactorPromptScreen;
