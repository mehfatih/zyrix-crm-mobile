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
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { logSecurityEvent } from '../../utils/securityEvents';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

const COOLDOWN_SECONDS = 30;

export const TwoFactorPromptScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const verifyTwoFactor = useAuthStore((state) => state.verifyTwoFactor);
  const markTrustedDevice = useAuthStore((state) => state.markTrustedDevice);

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
      // Mock verification: accept any code.
      verifyTwoFactor();
      if (trustDevice) markTrustedDevice();
      await logSecurityEvent('two_factor_success', {
        method: useRecovery ? 'recovery' : 'totp',
      });
      navigation.goBack();
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
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Icon name="shield-checkmark-outline" size={32} color={colors.primary} />
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
          placeholderTextColor={colors.textMuted}
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
                cooldown > 0 ? { color: colors.textMuted } : null,
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
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
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
  safe: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  title: { ...textStyles.h2, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...textStyles.body, color: colors.textMuted, textAlign: 'center' },
  codeInput: {
    ...textStyles.h1,
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
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
  toggleLink: { ...textStyles.label, color: colors.primary },
  resendLink: { ...textStyles.label, color: colors.primary },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  trustLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default TwoFactorPromptScreen;
