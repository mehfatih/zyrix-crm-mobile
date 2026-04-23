/**
 * SecurityScreen — merchant-side security settings: biometric login,
 * sensitive-action gating, session management, trusted devices,
 * password, and 2FA entry-point.
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { setSessionTimeoutMinutes } from '../../../utils/sessionManager';
import { textStyles } from '../../../constants/typography';
import { useAuthStore } from '../../../store/authStore';
import { useBiometric } from '../../../hooks/useBiometric';
import { useToast } from '../../../hooks/useToast';

const TIMEOUT_OPTIONS: readonly { minutes: number; labelKey: string }[] = [
  { minutes: 5, labelKey: 'security.fiveMinutes' },
  { minutes: 15, labelKey: 'security.fifteenMinutes' },
  { minutes: 30, labelKey: 'security.thirtyMinutes' },
  { minutes: 60, labelKey: 'security.oneHour' },
  { minutes: 240, labelKey: 'security.fourHours' },
];

const SENSITIVE_KEYS: readonly { key: string; labelKey: string }[] = [
  { key: 'delete', labelKey: 'security.deleteRecords' },
  { key: 'export', labelKey: 'security.exportData' },
  { key: 'paymentMethod', labelKey: 'security.changePaymentMethod' },
  { key: 'password', labelKey: 'security.changePassword' },
  { key: 'reports', labelKey: 'security.viewSensitiveReports' },
];

export const SecurityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const biometric = useBiometric();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const twoFactorEnabled = useAuthStore((state) => state.twoFactorEnabled);

  const [sessionMinutes, setSessionMinutes] = useState(15);
  const [logoutOnBackground, setLogoutOnBackground] = useState(true);
  const [sensitiveFlags, setSensitiveFlags] = useState<Record<string, boolean>>({
    delete: true,
    export: true,
    paymentMethod: true,
    password: true,
    reports: false,
  });

  const toggleBiometric = async (next: boolean): Promise<void> => {
    if (next) {
      if (!token || !user) {
        toast.error(t('common.error'));
        return;
      }
      const ok = await biometric.enable(token, user.id);
      if (!ok) toast.error(t('common.error'));
    } else {
      await biometric.disable();
    }
  };

  const toggleSensitive = (key: string): void => {
    setSensitiveFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSessionMinutes = (minutes: number): void => {
    setSessionMinutes(minutes);
    setSessionTimeoutMinutes(minutes);
  };

  const goTo = (screen: string): void => {
    (navigation as unknown as {
      navigate: (route: string) => void;
    }).navigate(screen);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('security.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title={t('security.biometricLogin')}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t('security.enableBiometric')}</Text>
              {biometric.isAvailable ? (
                <Text style={styles.rowSub}>
                  {biometric.type === 'FaceID'
                    ? t('security.useFaceID')
                    : biometric.type === 'TouchID'
                      ? t('security.useTouchID')
                      : biometric.type === 'Fingerprint'
                        ? t('security.useFingerprint')
                        : t('security.biometricLogin')}
                </Text>
              ) : (
                <Text style={styles.rowSub}>
                  {t('security.biometricNotAvailable')}
                </Text>
              )}
            </View>
            <Switch
              value={biometric.isEnabled}
              disabled={!biometric.isAvailable}
              onValueChange={(next) => void toggleBiometric(next)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Section>

        <Section title={t('security.sensitiveActions')}>
          <Text style={styles.sectionHint}>
            {t('security.requireBiometricFor')}
          </Text>
          {SENSITIVE_KEYS.map((entry) => (
            <View key={entry.key} style={styles.toggleRow}>
              <Text style={styles.rowLabel}>{t(entry.labelKey)}</Text>
              <Switch
                value={sensitiveFlags[entry.key] ?? false}
                onValueChange={() => toggleSensitive(entry.key)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </Section>

        <Section title={t('security.sessionManagement')}>
          <Text style={styles.rowLabel}>{t('security.sessionTimeout')}</Text>
          <View style={styles.timeoutRow}>
            {TIMEOUT_OPTIONS.map((option) => (
              <Pressable
                key={option.minutes}
                onPress={() => updateSessionMinutes(option.minutes)}
                style={[
                  styles.timeoutChip,
                  sessionMinutes === option.minutes
                    ? styles.timeoutChipActive
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.timeoutText,
                    sessionMinutes === option.minutes
                      ? { color: colors.textInverse }
                      : null,
                  ]}
                >
                  {`${option.minutes < 60 ? option.minutes : option.minutes / 60}${option.minutes < 60 ? 'm' : 'h'}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.rowLabel}>
              {t('security.autoLogoutOnBackground')}
            </Text>
            <Switch
              value={logoutOnBackground}
              onValueChange={setLogoutOnBackground}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Section>

        <Section title={t('security.trustedDevices')}>
          <SettingsRow
            icon="phone-portrait-outline"
            label={t('security.thisDevice')}
            value={t('common.welcome')}
            onPress={() => goTo('DeviceManagement')}
          />
          <SettingsRow
            icon="laptop-outline"
            label={t('security.logoutAllOtherDevices')}
            tone="error"
            onPress={() =>
              Alert.alert(t('security.logoutAllOtherDevices'), undefined, [
                { text: t('common.cancel') },
                {
                  text: t('security.revokeDevice'),
                  style: 'destructive',
                  onPress: () => toast.info(t('common.success')),
                },
              ])
            }
          />
        </Section>

        <Section title={t('security.changePassword')}>
          <SettingsRow
            icon="lock-closed-outline"
            label={t('security.changePassword')}
            value={t('security.lastChanged')}
            onPress={() => Alert.alert(t('security.changePassword'))}
          />
        </Section>

        <Section title={t('security.twoFactorAuth')}>
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t('security.enable2FA')}
            value={twoFactorEnabled ? t('common.success') : t('common.skip')}
            onPress={() => goTo('TwoFactor')}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t('security.recoveryCodes')}
            onPress={() => Alert.alert(t('security.recoveryCodes'))}
          />
        </Section>

        <SettingsRow
          icon="document-lock-outline"
          label={t('securityLog.title')}
          onPress={() => goTo('SecurityLog')}
        />
        <SettingsRow
          icon="globe-outline"
          label={t('admin.ipAllowlist')}
          onPress={() => goTo('IPAllowlist')}
        />
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
  value?: string;
  tone?: 'primary' | 'error';
  onPress?: () => void;
}> = ({ icon, label, value, tone = 'primary', onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingsRow,
      pressed && onPress ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      color={tone === 'error' ? colors.error : colors.primary}
    />
    <View style={{ flex: 1 }}>
      <Text
        style={[
          styles.rowLabel,
          tone === 'error' ? { color: colors.error } : null,
        ]}
      >
        {label}
      </Text>
      {value ? <Text style={styles.rowSub}>{value}</Text> : null}
    </View>
    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  sectionHint: { ...textStyles.caption, color: colors.textMuted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowLabel: { ...textStyles.body, color: colors.textPrimary },
  rowSub: { ...textStyles.caption, color: colors.textMuted },
  timeoutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeoutChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  timeoutChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeoutText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.xs,
  },
});

export default SecurityScreen;
