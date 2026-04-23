/**
 * MerchantSettingsStack — settings home + payment-gateway management.
 *
 * SettingsHome is still a placeholder pending the full settings build
 * (planned later); Sprint 7 wires the gateway management screen so the
 * country-aware payment provider config is reachable from More → Settings.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../components/common/Header';
import { Icon } from '../components/common/Icon';
import { PaymentGatewaysScreen } from '../screens/merchant/settings/PaymentGatewaysScreen';
import { colors } from '../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import type { MerchantSettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantSettingsStackParamList>();

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
      <View style={styles.scroll}>
        <Pressable
          onPress={() => navigation.navigate('PaymentGateways' as never)}
          style={({ pressed }) => [
            styles.card,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="wallet-outline" size={20} color={colors.primary} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              {t('paymentGateways.title')}
            </Text>
            <Text style={styles.cardSubtitle}>
              {t('paymentGateways.configure')}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
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
