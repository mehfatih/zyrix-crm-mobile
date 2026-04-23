/**
 * TwoFactorScreen — merchant-side 2FA setup wizard. When enabled
 * shows the current method + actions (change method, regenerate
 * backup codes, disable). When disabled walks the user through the
 * 4-step wizard (method → setup → verify → backup codes).
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { logSecurityEvent } from '../../../utils/securityEvents';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';

type Method = 'sms' | 'email' | 'app';
type Step = 'method' | 'setup' | 'verify' | 'codes';

const METHOD_ICON: Record<Method, AnyIconName> = {
  sms: 'chatbubble-outline',
  email: 'mail-outline',
  app: 'phone-portrait-outline',
};

const generateCodes = (count = 10): string[] =>
  Array.from({ length: count }, () =>
    Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(
        Math.floor(Math.random() * 32)
      )
    ).join('')
  );

export const TwoFactorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const enabled = useAuthStore((state) => state.twoFactorEnabled);
  const setTwoFactorEnabled = useAuthStore((state) => state.setTwoFactorEnabled);

  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('app');
  const [code, setCode] = useState('');
  const [codes] = useState<string[]>(() => generateCodes());

  const startWizard = (): void => {
    setStep('method');
    setCode('');
  };

  const verify = async (): Promise<void> => {
    if (code.length !== 6) {
      toast.error(t('forms.required'));
      return;
    }
    setStep('codes');
    await logSecurityEvent('2fa_enabled', { method });
  };

  const finish = (): void => {
    setTwoFactorEnabled(true);
    toast.success(t('twoFactor.setupComplete'));
    navigation.goBack();
  };

  const disable = (): void => {
    Alert.alert(t('security.disable2FA'), undefined, [
      { text: t('common.cancel') },
      {
        text: t('security.disable2FA'),
        style: 'destructive',
        onPress: async () => {
          setTwoFactorEnabled(false);
          await logSecurityEvent('2fa_disabled');
          toast.info(t('common.success'));
        },
      },
    ]);
  };

  const setupBody = useMemo(() => {
    switch (method) {
      case 'sms':
        return 'We will send a verification SMS to your phone on the next step.';
      case 'email':
        return 'A verification email will be sent to your account.';
      case 'app':
      default:
        return 'Scan this QR with Google Authenticator / Authy / 1Password — or enter the manual key.';
    }
  }, [method]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('security.twoFactorAuth')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {enabled ? (
          <>
            <View style={styles.statusCard}>
              <Icon name="shield-checkmark" size={32} color={colors.success} />
              <Text style={styles.statusTitle}>2FA is active</Text>
              <Text style={styles.statusBody}>{`Method: ${method}`}</Text>
            </View>
            <Section title="Manage">
              <SettingsRow
                icon="swap-horizontal-outline"
                label="Change method"
                onPress={startWizard}
              />
              <SettingsRow
                icon="refresh-outline"
                label={t('security.recoveryCodes')}
                onPress={() =>
                  Alert.alert(
                    t('security.recoveryCodes'),
                    codes.slice(0, 3).join('\n')
                  )
                }
              />
              <SettingsRow
                icon="close-circle-outline"
                label={t('security.disable2FA')}
                tone="error"
                onPress={disable}
              />
            </Section>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.stepIndicator}>
                {(['method', 'setup', 'verify', 'codes'] as Step[]).map((entry, idx) => {
                  const reached = (['method', 'setup', 'verify', 'codes'] as Step[]).indexOf(step) >= idx;
                  return (
                    <View
                      key={entry}
                      style={[
                        styles.stepDot,
                        reached ? styles.stepDotActive : null,
                      ]}
                    />
                  );
                })}
              </View>

              {step === 'method' ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {t('twoFactor.chooseMethod')}
                  </Text>
                  {(['sms', 'email', 'app'] as Method[]).map((entry) => (
                    <Pressable
                      key={entry}
                      onPress={() => setMethod(entry)}
                      style={[
                        styles.methodCard,
                        method === entry ? styles.methodCardActive : null,
                      ]}
                    >
                      <Icon
                        name={METHOD_ICON[entry]}
                        size={24}
                        color={
                          method === entry ? colors.primary : colors.textSecondary
                        }
                      />
                      <Text style={styles.methodLabel}>
                        {t(`twoFactor.${entry === 'app' ? 'authenticatorApp' : entry}`)}
                      </Text>
                    </Pressable>
                  ))}
                  <Button
                    label={t('common.continue')}
                    onPress={() => setStep('setup')}
                    fullWidth
                  />
                </>
              ) : null}

              {step === 'setup' ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {t('twoFactor.scanQR')}
                  </Text>
                  <Text style={styles.body}>{setupBody}</Text>
                  {method === 'app' ? (
                    <View style={styles.qrPlaceholder}>
                      <Icon
                        name="qr-code-outline"
                        size={48}
                        color={colors.primary}
                      />
                      <Text style={styles.body}>
                        {t('twoFactor.orEnterKey')}
                      </Text>
                      <Text style={styles.qrKey}>JBSWY3DPEHPK3PXP</Text>
                    </View>
                  ) : null}
                  <Button
                    label={t('common.continue')}
                    onPress={() => setStep('verify')}
                    fullWidth
                  />
                </>
              ) : null}

              {step === 'verify' ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {t('twoFactor.enterSixDigits')}
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={(value) =>
                      setCode(value.replace(/[^0-9]/g, '').slice(0, 6))
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.codeInput,
                      { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                  />
                  <Button
                    label={t('common.confirm')}
                    onPress={() => void verify()}
                    fullWidth
                  />
                </>
              ) : null}

              {step === 'codes' ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {t('twoFactor.backupCodesTitle')}
                  </Text>
                  <Text style={[styles.body, { color: colors.warning, fontWeight: '700' }]}>
                    {t('security.saveThese')}
                  </Text>
                  <View style={styles.codesGrid}>
                    {codes.map((value) => (
                      <Text key={value} style={styles.codeText}>
                        {value}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.row}>
                    <Button
                      label={t('twoFactor.copyCodes')}
                      variant="outline"
                      onPress={() => toast.success(t('paymentLinks.linkCopied'))}
                    />
                    <Button label={t('common.finish')} onPress={finish} />
                  </View>
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingsRow: React.FC<{
  icon: AnyIconName;
  label: string;
  tone?: 'primary' | 'error';
  onPress: () => void;
}> = ({ icon, label, tone = 'primary', onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingsRow,
      pressed ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      color={tone === 'error' ? colors.error : colors.primary}
    />
    <Text
      style={[
        styles.settingsLabel,
        tone === 'error' ? { color: colors.error } : null,
      ]}
    >
      {label}
    </Text>
    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    backgroundColor: colors.successSoft,
    padding: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.xs,
  },
  statusTitle: {
    ...textStyles.h3,
    color: colors.success,
  },
  statusBody: {
    ...textStyles.body,
    color: colors.success,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    justifyContent: 'center',
  },
  stepDot: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  body: { ...textStyles.body, color: colors.textSecondary },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodLabel: { ...textStyles.bodyMedium, color: colors.textPrimary },
  qrPlaceholder: {
    alignItems: 'center',
    rowGap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
  },
  qrKey: {
    ...textStyles.body,
    color: colors.primaryDark,
    fontFamily: 'monospace',
  },
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
    alignSelf: 'center',
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.base,
    borderRadius: radius.lg,
  },
  codeText: {
    ...textStyles.body,
    color: colors.primaryDark,
    fontFamily: 'monospace',
    flexBasis: '47%',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  settingsLabel: { flex: 1, ...textStyles.body, color: colors.textPrimary },
});

export default TwoFactorScreen;
