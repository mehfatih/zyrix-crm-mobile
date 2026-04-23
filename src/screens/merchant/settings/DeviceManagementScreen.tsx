/**
 * DeviceManagementScreen — list of devices logged in for this account
 * with revoke per device + bulk revoke all-other-devices.
 */

import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useToast } from '../../../hooks/useToast';

interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  ip: string;
  location: string;
  lastActive: string;
  osVersion: string;
  appVersion: string;
  current: boolean;
}

const DEVICES: readonly Device[] = [
  {
    id: 'dev_1',
    name: 'iPhone 13 Pro',
    platform: 'ios',
    ip: '212.118.45.12',
    location: 'Riyadh, SA',
    lastActive: '2026-04-23T08:00:00Z',
    osVersion: 'iOS 17.4',
    appVersion: '1.0.0',
    current: true,
  },
  {
    id: 'dev_2',
    name: 'Pixel 8',
    platform: 'android',
    ip: '85.140.23.99',
    location: 'Istanbul, TR',
    lastActive: '2026-04-22T17:10:00Z',
    osVersion: 'Android 14',
    appVersion: '1.0.0',
    current: false,
  },
  {
    id: 'dev_3',
    name: 'Galaxy Tab S9',
    platform: 'android',
    ip: '37.123.55.21',
    location: 'Dubai, AE',
    lastActive: '2026-04-20T11:00:00Z',
    osVersion: 'Android 14',
    appVersion: '1.0.0',
    current: false,
  },
];

const ICON: Record<Device['platform'], AnyIconName> = {
  ios: 'logo-apple',
  android: 'logo-android',
};

export const DeviceManagementScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { formatDate } = useCountryConfig();

  const revoke = (device: Device): void => {
    Alert.alert(t('deviceManagement.confirmRevoke'), device.name, [
      { text: t('common.cancel') },
      {
        text: t('deviceManagement.revokeAccess'),
        style: 'destructive',
        onPress: async () => {
          await logSecurityEvent('device_revoked', { device: device.name });
          toast.success(t('common.success'));
        },
      },
    ]);
  };

  const revokeAllOthers = (): void => {
    Alert.alert(
      t('security.logoutAllOtherDevices'),
      undefined,
      [
        { text: t('common.cancel') },
        {
          text: t('deviceManagement.revokeAccess'),
          style: 'destructive',
          onPress: async () => {
            await logSecurityEvent('device_revoked', { all: 'true' });
            toast.success(t('common.success'));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('deviceManagement.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {DEVICES.map((device) => (
          <View
            key={device.id}
            style={[
              styles.card,
              device.current ? styles.currentCard : null,
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.iconCircle}>
                <Icon name={ICON[device.platform]} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{device.name}</Text>
                <Text style={styles.meta}>
                  {`${device.osVersion} · v${device.appVersion}`}
                </Text>
              </View>
              {device.current ? (
                <View style={styles.currentPill}>
                  <Text style={styles.currentText}>
                    {t('deviceManagement.currentDevice')}
                  </Text>
                </View>
              ) : null}
            </View>

            <Row
              icon="time-outline"
              label={t('deviceManagement.lastActive')}
              value={formatDate(device.lastActive)}
            />
            <Row
              icon="globe-outline"
              label={t('deviceManagement.ipAddress')}
              value={`${device.ip} · ${device.location}`}
            />

            {!device.current ? (
              <Pressable
                onPress={() => revoke(device)}
                style={({ pressed }) => [
                  styles.revokeBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon
                  name="trash-outline"
                  size={16}
                  color={colors.error}
                />
                <Text style={styles.revokeText}>
                  {t('deviceManagement.revokeAccess')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        <Button
          label={t('security.logoutAllOtherDevices')}
          variant="outline"
          onPress={revokeAllOthers}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const Row: React.FC<{ icon: AnyIconName; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.row}>
    <Icon name={icon} size={16} color={colors.primary} />
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  currentCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...textStyles.bodyMedium, color: colors.textPrimary },
  meta: { ...textStyles.caption, color: colors.textMuted },
  currentPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  currentText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowLabel: { ...textStyles.caption, color: colors.textMuted },
  rowValue: { ...textStyles.body, color: colors.textPrimary },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.errorSoft,
    marginTop: spacing.xs,
  },
  revokeText: {
    ...textStyles.button,
    color: colors.error,
  },
});

export default DeviceManagementScreen;
