/**
 * SecurityScreen — security hub with tappable cards leading into the
 * sub-screens (IP allowlist, network rules, SCIM, retention,
 * compliance exports).
 */

import React from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { AdminSecurityStackParamList } from '../../navigation/types';

type Navigation = NativeStackNavigationProp<
  AdminSecurityStackParamList,
  'SecurityHome'
>;

interface SecurityCard {
  key: 'IPAllowlist' | 'NetworkRules' | 'SCIMTokens' | 'RetentionPolicies' | 'ComplianceExports';
  icon: AnyIconName;
  titleKey: string;
  descriptionKey: string;
}

const CARDS: readonly SecurityCard[] = [
  {
    key: 'IPAllowlist',
    icon: 'shield-checkmark-outline',
    titleKey: 'admin.ipAllowlist',
    descriptionKey: 'ipAllowlistAdmin.addRule',
  },
  {
    key: 'NetworkRules',
    icon: 'globe-outline',
    titleKey: 'admin.networkRules',
    descriptionKey: 'networkRules.title',
  },
  {
    key: 'SCIMTokens',
    icon: 'key-outline',
    titleKey: 'admin.scimTokens',
    descriptionKey: 'scim.title',
  },
  {
    key: 'RetentionPolicies',
    icon: 'time-outline',
    titleKey: 'admin.retention',
    descriptionKey: 'retention.title',
  },
  {
    key: 'ComplianceExports',
    icon: 'cloud-download-outline',
    titleKey: 'admin.compliance',
    descriptionKey: 'complianceAdmin.title',
  },
];

export const SecurityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.security')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={darkColors.textOnPrimary} />
          </Pressable>
        }
      />

      <View style={styles.alertCard}>
        <Icon name="information-circle-outline" size={20} color={darkColors.primary} />
        <View style={styles.alertBody}>
          <Text style={styles.alertTitle}>
            {t('admin.security')}
          </Text>
          <Text style={styles.alertSub}>
            {`${0} security events in the last 24h`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {CARDS.map((card) => (
          <Pressable
            key={card.key}
            onPress={() => navigation.navigate(card.key)}
            style={({ pressed }) => [
              styles.card,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View style={styles.iconCircle}>
              <Icon name={card.icon} size={20} color={darkColors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t(card.titleKey)}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {t(card.descriptionKey)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={darkColors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.primarySoft,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
  },
  alertBody: { flex: 1 },
  alertTitle: { ...textStyles.bodyMedium, color: darkColors.primaryDark },
  alertSub: { ...textStyles.caption, color: darkColors.primary },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { ...textStyles.bodyMedium, color: darkColors.textPrimary },
  cardSub: { ...textStyles.caption, color: darkColors.textMuted },
});

export default SecurityScreen;
