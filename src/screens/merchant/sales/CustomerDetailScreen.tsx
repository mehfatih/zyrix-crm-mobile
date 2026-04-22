/**
 * CustomerDetailScreen — overview for a single customer. Other tabs
 * (Deals / Quotes / Invoices / Activities / Notes) are placeholders
 * that light up in subsequent sprints as those data hooks come online.
 */

import React, { useMemo, useState } from 'react';
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { findCountry } from '../../../constants/countries';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCustomer } from '../../../hooks/useCustomers';
import type { SupportedLanguage } from '../../../i18n';
import { useUiStore } from '../../../store/uiStore';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'CustomerDetail'>;

type Tab = 'overview' | 'deals' | 'quotes' | 'invoices' | 'activities' | 'notes';

interface ActionButton {
  key: 'call' | 'email' | 'whatsapp' | 'newDeal';
  icon: AnyIconName;
  background: string;
  color: string;
}

const ACTIONS: readonly ActionButton[] = [
  { key: 'call', icon: 'call-outline', background: colors.successSoft, color: colors.success },
  { key: 'email', icon: 'mail-outline', background: colors.infoSoft, color: colors.info },
  { key: 'whatsapp', icon: 'logo-whatsapp', background: colors.successSoft, color: colors.success },
  { key: 'newDeal', icon: 'briefcase-outline', background: colors.primarySoft, color: colors.primary },
];

const healthBackground = (score: number): string => {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
};

export const CustomerDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const customerId = route.params?.customerId ?? '';

  const language = useUiStore((s) => s.language) as SupportedLanguage;
  const { formatDate } = useCountryConfig();

  const { data: customer, isLoading } = useCustomer(customerId);
  const [tab, setTab] = useState<Tab>('overview');

  const countryName = useMemo(() => {
    if (!customer) return '';
    return findCountry(customer.country).name[language];
  }, [customer, language]);

  const notImplemented = (): void => {
    Alert.alert(t('placeholders.featureNotReady'));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={customer?.name ?? t('navigation.customerDetail')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading || !customer ? (
          <View style={{ padding: spacing.base }}>
            <SkeletonCard height={140} />
            <SkeletonCard height={120} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{customer.avatarInitials}</Text>
              </View>
              <View style={styles.heroBody}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.company}>{customer.company}</Text>
                <Text style={styles.meta}>
                  {`${findCountry(customer.country).flag} ${countryName}`}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              {ACTIONS.map((action) => (
                <Pressable
                  key={action.key}
                  onPress={notImplemented}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: action.background },
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                  accessibilityRole="button"
                >
                  <Icon
                    name={action.icon}
                    size={22}
                    color={action.color}
                  />
                </Pressable>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabBar}
              contentContainerStyle={styles.tabContent}
            >
              {(['overview', 'deals', 'quotes', 'invoices', 'activities', 'notes'] as Tab[]).map(
                (key) => (
                  <Pressable
                    key={key}
                    onPress={() => setTab(key)}
                    style={[
                      styles.tabBtn,
                      tab === key ? styles.tabBtnActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        tab === key ? styles.tabLabelActive : null,
                      ]}
                    >
                      {t(`customerTabs.${key}`)}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            {tab === 'overview' ? (
              <View style={styles.overviewWrap}>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    {t('customers.contactInfo')}
                  </Text>
                  <InfoRow icon="mail-outline" label={customer.email} />
                  <InfoRow icon="call-outline" label={customer.phone} />
                  {customer.address ? (
                    <InfoRow icon="location-outline" label={customer.address} />
                  ) : null}
                  {customer.taxId ? (
                    <InfoRow icon="barcode-outline" label={customer.taxId} />
                  ) : null}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>
                      {t('customers.totalRevenue')}
                    </Text>
                    <CurrencyDisplay
                      amount={customer.totalRevenue}
                      size="large"
                      color={colors.primaryDark}
                    />
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>
                      {t('customers.memberSince')}
                    </Text>
                    <Text style={styles.statValue}>
                      {formatDate(customer.createdAt, 'long')}
                    </Text>
                  </View>
                </View>

                {customer.tags.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                      {t('customers.tags')}
                    </Text>
                    <View style={styles.tagsRow}>
                      {customer.tags.map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    {t('customers.healthScore')}
                  </Text>
                  <View
                    style={[
                      styles.healthGauge,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <View
                      style={[
                        styles.healthFill,
                        {
                          width: `${customer.healthScore}%`,
                          backgroundColor: healthBackground(
                            customer.healthScore
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.healthValue}>
                    {`${customer.healthScore}/100`}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderCard}>
                <Icon
                  name="time-outline"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.placeholderTitle}>
                  {t('placeholders.comingInSprint', { sprint: 5 })}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ icon: AnyIconName; label: string }> = ({
  icon,
  label,
}) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={18} color={colors.primary} />
    <Text style={styles.infoText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
    columnGap: spacing.base,
    ...shadows.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.h3,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  heroBody: { flex: 1, rowGap: 2 },
  name: { ...textStyles.h3, color: colors.textPrimary },
  company: { ...textStyles.body, color: colors.textSecondary },
  meta: { ...textStyles.caption, color: colors.textMuted },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    columnGap: spacing.sm,
    marginBottom: spacing.base,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  tabBar: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  tabContent: {
    columnGap: spacing.sm,
  },
  tabBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabLabelActive: { color: colors.textInverse },
  overviewWrap: {
    paddingHorizontal: spacing.base,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoText: {
    ...textStyles.body,
    color: colors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  statValue: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  healthGauge: {
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  healthFill: {
    height: 10,
    borderRadius: radius.pill,
  },
  healthValue: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  placeholderCard: {
    margin: spacing.base,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  placeholderTitle: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});

export default CustomerDetailScreen;
