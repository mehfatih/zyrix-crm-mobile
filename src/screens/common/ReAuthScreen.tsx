/**
 * ReAuthScreen — modal-style re-authentication shown when the session
 * times out mid-flow. Offers password or biometric re-entry; cancel
 * triggers a full logout.
 */

import React, { useState } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useBiometric } from '../../hooks/useBiometric';
import { useToast } from '../../hooks/useToast';

export interface ReAuthScreenProps {
  onResume: () => void;
}

export const ReAuthScreen: React.FC<ReAuthScreenProps> = ({ onResume }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const biometric = useBiometric();
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity);
  const triggerLogout = useAuthStore((state) => state.triggerLogout);

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submitPassword = (): void => {
    if (password.length < 4) {
      toast.error(t('forms.required'));
      return;
    }
    setBusy(true);
    setTimeout(() => {
      updateLastActivity();
      setBusy(false);
      setPassword('');
      onResume();
    }, 300);
  };

  const useBiometricPath = async (): Promise<void> => {
    setBusy(true);
    const ok = await biometric.promptOnly(t('reAuth.useBiometric'));
    setBusy(false);
    if (ok) {
      updateLastActivity();
      onResume();
    } else {
      toast.error(t('common.error'));
    }
  };

  const cancel = async (): Promise<void> => {
    await triggerLogout('reauth_cancelled');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon name="lock-closed-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('reAuth.title')}</Text>
        <Text style={styles.subtitle}>{t('reAuth.sessionExpired')}</Text>

        <Text style={styles.fieldLabel}>{t('reAuth.enterPassword')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('forms.password')}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[
            styles.input,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <Button
          label={t('common.confirm')}
          onPress={submitPassword}
          loading={busy}
          fullWidth
        />

        {biometric.isEnabled ? (
          <Pressable
            onPress={() => void useBiometricPath()}
            style={styles.biometricBtn}
          >
            <Icon name="finger-print-outline" size={20} color={colors.primary} />
            <Text style={styles.biometricText}>
              {t('reAuth.useBiometric')}
            </Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => void cancel()} hitSlop={8}>
          <Text style={styles.logoutText}>{t('common.signOut')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    rowGap: spacing.sm,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  input: {
    width: '100%',
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  biometricText: {
    ...textStyles.button,
    color: colors.primary,
  },
  logoutText: {
    ...textStyles.label,
    color: colors.error,
    paddingVertical: spacing.sm,
  },
});

export default ReAuthScreen;
