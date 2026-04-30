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

import { AttachedFilesSection } from '../../../components/files/AttachedFilesSection';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import {
  AICustomerInsightsCard,
  type AICustomerInsights,
  type BehaviourPattern,
  type OpportunityLevel,
} from '../../../components/customer/AICustomerInsightsCard';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { findCountry } from '../../../constants/countries';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useCustomer } from '../../../hooks/useCustomers';
import type { SupportedLanguage } from '../../../i18n';
import { useUiStore } from '../../../store/uiStore';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'CustomerDetail'>;

type Tab =
  | 'overview'
  | 'deals'
  | 'quotes'
  | 'invoices'
  | 'activities'
  | 'notes'
  | 'files';

interface ActionButton {
  key: 'call' | 'email' | 'whatsapp' | 'newDeal';
  icon: AnyIconName;
  background: string;
  color: string;
}

const ACTIONS: readonly ActionButton[] = [
  { key: 'call', icon: 'call-outline', background: darkColors.successSoft, color: darkColors.success },
  { key: 'email', icon: 'mail-outline', background: darkColors.infoSoft, color: darkColors.info },
  { key: 'whatsapp', icon: 'logo-whatsapp', background: darkColors.successSoft, color: darkColors.success },
  { key: 'newDeal', icon: 'briefcase-outline', background: darkColors.primarySoft, color: darkColors.primary },
];

const healthBackground = (score: number): string => {
  if (score >= 70) return darkColors.success;
  if (score >= 40) return darkColors.warning;
  return darkColors.error;
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

  const aiInsights = useMemo<AICustomerInsights | null>(() => {
    if (!customer) return null;
    return buildCustomerInsights(customer, t);
  }, [customer, t]);

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
              {(['overview', 'deals', 'quotes', 'invoices', 'activities', 'notes', 'files'] as Tab[]).map(
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
                {aiInsights ? (
                  <AICustomerInsightsCard
                    insights={aiInsights}
                    onAction={notImplemented}
                  />
                ) : null}

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
                      color={darkColors.primaryDark}
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
                      { backgroundColor: darkColors.surfaceAlt },
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
            ) : tab === 'files' ? (
              <AttachedFilesSection
                recordType="customer"
                recordId={customer.id}
                recordName={customer.name}
              />
            ) : (
              <View style={styles.placeholderCard}>
                <Icon
                  name="time-outline"
                  size={32}
                  color={darkColors.primary}
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
    <Icon name={icon} size={18} color={darkColors.primary} />
    <Text style={styles.infoText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
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
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.h3,
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  heroBody: { flex: 1, rowGap: 2 },
  name: { ...textStyles.h3, color: darkColors.textPrimary },
  company: { ...textStyles.body, color: darkColors.textSecondary },
  meta: { ...textStyles.caption, color: darkColors.textMuted },
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
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  tabBtnActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  tabLabel: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  tabLabelActive: { color: darkColors.textOnPrimary },
  overviewWrap: {
    paddingHorizontal: spacing.base,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.label,
    color: darkColors.textSecondary,
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
    color: darkColors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statValue: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    backgroundColor: darkColors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
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
    color: darkColors.textPrimary,
  },
  placeholderCard: {
    margin: spacing.base,
    padding: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  placeholderTitle: {
    ...textStyles.body,
    color: darkColors.textMuted,
  },
});

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface CustomerLike {
  name: string;
  company: string;
  totalRevenue: number;
  healthScore: number;
  tags: string[];
  lastContactAt: string;
}

const opportunityFromHealth = (
  health: number
): { level: OpportunityLevel; confidence: number } => {
  if (health >= 75) return { level: 'high', confidence: 88 };
  if (health >= 50) return { level: 'medium', confidence: 70 };
  return { level: 'low', confidence: 60 };
};

const daysSinceContact = (iso: string): number => {
  const last = new Date(iso).getTime();
  if (Number.isNaN(last)) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24))
  );
};

const buildCustomerInsights = (
  customer: CustomerLike,
  t: TranslateFn
): AICustomerInsights => {
  const opp = opportunityFromHealth(customer.healthScore);
  const idle = daysSinceContact(customer.lastContactAt);

  const behaviour: BehaviourPattern[] = [];
  if (idle <= 3) {
    behaviour.push({
      id: 'fast-replies',
      icon: 'flash-outline',
      label: t('customer.ai.behaviour.repliesFast'),
    });
  }
  if (customer.totalRevenue >= 10_000) {
    behaviour.push({
      id: 'high-value',
      icon: 'star-outline',
      label: t('customer.ai.behaviour.highValue'),
    });
  }
  if (customer.tags.some((tag) => tag.toLowerCase().includes('whatsapp'))) {
    behaviour.push({
      id: 'prefers-whatsapp',
      icon: 'logo-whatsapp',
      label: t('customer.ai.behaviour.prefersWhatsapp'),
    });
  }
  if (idle > 30) {
    behaviour.push({
      id: 'going-quiet',
      icon: 'time-outline',
      label: t('customer.ai.behaviour.goingQuiet', { days: idle }),
    });
  }
  if (behaviour.length === 0) {
    behaviour.push({
      id: 'baseline',
      icon: 'people-outline',
      label: t('customer.ai.behaviour.steady'),
    });
  }

  const summary = t('customer.ai.summaryTemplate', {
    name: customer.name,
    company: customer.company,
    health: customer.healthScore,
    revenue: customer.totalRevenue.toLocaleString(),
    idle,
  });

  const oppLabel = t(`customer.ai.opportunity.${opp.level}`);
  const oppReason = t('customer.ai.opportunityReason', {
    health: customer.healthScore,
    revenue: customer.totalRevenue.toLocaleString(),
  });

  return {
    summary,
    behaviour,
    opportunity: {
      level: opp.level,
      label: oppLabel,
      confidence: opp.confidence,
      reason: oppReason,
      signals: [
        t('customer.ai.signal.health', { health: customer.healthScore }),
        t('customer.ai.signal.revenue', {
          revenue: customer.totalRevenue.toLocaleString(),
        }),
        t('customer.ai.signal.idle', { days: idle }),
      ],
    },
    nextBestAction:
      opp.level === 'high'
        ? {
            type: 'opportunity',
            title: t('customer.ai.nextAction.proposeUpgrade'),
            reason: t('customer.ai.nextAction.proposeUpgradeReason'),
            confidence: 82,
            signals: [
              t('customer.ai.signal.health', { health: customer.healthScore }),
            ],
            recommendedAction: t('customer.ai.nextAction.proposeUpgradeRec'),
            cta: {
              label: t('customer.ai.nextAction.sendProposal'),
              action: 'create-proposal',
            },
          }
        : opp.level === 'low'
        ? {
            type: 'risk',
            title: t('customer.ai.nextAction.reachOut'),
            reason: t('customer.ai.nextAction.reachOutReason', { days: idle }),
            confidence: 75,
            signals: [t('customer.ai.signal.idle', { days: idle })],
            recommendedAction: t('customer.ai.nextAction.reachOutRec'),
            cta: {
              label: t('customer.ai.nextAction.sendCheckin'),
              action: 'compose-checkin',
            },
          }
        : {
            type: 'followup',
            title: t('customer.ai.nextAction.nurture'),
            reason: t('customer.ai.nextAction.nurtureReason'),
            confidence: 70,
            signals: [
              t('customer.ai.signal.health', { health: customer.healthScore }),
            ],
            recommendedAction: t('customer.ai.nextAction.nurtureRec'),
            cta: {
              label: t('customer.ai.nextAction.scheduleCall'),
              action: 'schedule-call',
            },
          },
  };
};

export default CustomerDetailScreen;
