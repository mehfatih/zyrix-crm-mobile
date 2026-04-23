/**
 * MerchantSettingsStack — settings home + gateway/security sub-screens.
 * Sprint 9 extends the stack with the security suite: biometric +
 * session config (SecurityScreen), trusted devices, IP allowlist, 2FA,
 * and the per-user security log.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { DeviceManagementScreen } from '../screens/merchant/settings/DeviceManagementScreen';
import { Header } from '../components/common/Header';
import { Icon, type AnyIconName } from '../components/common/Icon';
import { IPAllowlistScreen } from '../screens/merchant/settings/IPAllowlistScreen';
import { PaymentGatewaysScreen } from '../screens/merchant/settings/PaymentGatewaysScreen';
import { SecurityLogScreen } from '../screens/merchant/settings/SecurityLogScreen';
import { SecurityScreen } from '../screens/merchant/settings/SecurityScreen';
import { TwoFactorScreen } from '../screens/merchant/settings/TwoFactorScreen';
import { colors } from '../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import type { MerchantSettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantSettingsStackParamList>();

interface HomeItem {
  route: keyof MerchantSettingsStackParamList;
  icon: AnyIconName;
  titleKey: string;
  subtitleKey: string;
}

const ITEMS: readonly HomeItem[] = [
  {
    route: 'Security',
    icon: 'shield-checkmark-outline',
    titleKey: 'security.title',
    subtitleKey: 'security.biometricLogin',
  },
  {
    route: 'DeviceManagement',
    icon: 'phone-portrait-outline',
    titleKey: 'deviceManagement.title',
    subtitleKey: 'security.trustedDevices',
  },
  {
    route: 'IPAllowlist',
    icon: 'globe-outline',
    titleKey: 'admin.ipAllowlist',
    subtitleKey: 'ipAllowlistAdmin.addRule',
  },
  {
    route: 'TwoFactor',
    icon: 'key-outline',
    titleKey: 'security.twoFactorAuth',
    subtitleKey: 'security.enable2FA',
  },
  {
    route: 'SecurityLog',
    icon: 'document-lock-outline',
    titleKey: 'securityLog.title',
    subtitleKey: 'securityLog.recentEvents',
  },
  {
    route: 'PaymentGateways',
    icon: 'wallet-outline',
    titleKey: 'paymentGateways.title',
    subtitleKey: 'paymentGateways.configure',
  },
];

const SettingsHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('navigation.settings')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() =>
              (navigation as unknown as {
                navigate: (route: string) => void;
              }).navigate(item.route)
            }
            style={({ pressed }) => [
              styles.card,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Icon name={item.icon} size={22} color={colors.primary} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {t(item.subtitleKey)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export const MerchantSettingsStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="SettingsHome"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
    <Stack.Screen name="PaymentGateways" component={PaymentGatewaysScreen} />
    <Stack.Screen name="Security" component={SecurityScreen} />
    <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
    <Stack.Screen name="IPAllowlist" component={IPAllowlistScreen} />
    <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
    <Stack.Screen name="SecurityLog" component={SecurityLogScreen} />
  </Stack.Navigator>
);

export default MerchantSettingsStack;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.xs,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...textStyles.bodyMedium, color: colors.textPrimary },
  cardSubtitle: { ...textStyles.caption, color: colors.textMuted },
});
