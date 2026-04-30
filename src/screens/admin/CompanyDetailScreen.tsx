/**
 * CompanyDetailScreen — tabbed view for a single platform-managed
 * company. Tabs: Overview, Users, Billing, Features, Audit, Activity,
 * Actions. Action tab handles suspend/reactivate/impersonate.
 */

import React, { useMemo, useState } from 'react';
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { StatsGrid } from '../../components/admin/StatsGrid';
import { darkColors } from '../../theme/dark';
import { findCountry } from '../../constants/countries';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useAllUsers,
  useCompany,
  useFeatureFlags,
  useReactivateCompany,
  useSuspendCompany,
  useUpdateFeatureFlag,
} from '../../hooks/useAdmin';
import type { SupportedLanguage } from '../../i18n';
import { useUiStore } from '../../store/uiStore';
import type { AdminCompaniesStackParamList } from '../../navigation/types';

type Tab =
  | 'overview'
  | 'users'
  | 'billing'
  | 'features'
  | 'audit'
  | 'activity'
  | 'actions';

type Route = RouteProp<AdminCompaniesStackParamList, 'CompanyDetail'>;

const TABS: readonly Tab[] = [
  'overview',
  'users',
  'billing',
  'features',
  'audit',
  'activity',
  'actions',
];

export const CompanyDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const language = useUiStore((state) => state.language) as SupportedLanguage;

  const companyQuery = useCompany(route.params.companyId);
  const flagsQuery = useFeatureFlags(route.params.companyId);
  const usersQuery = useAllUsers({ filters: { companyId: route.params.companyId } });

  const suspendMut = useSuspendCompany();
  const reactivateMut = useReactivateCompany();
  const flagMut = useUpdateFeatureFlag();

  const [tab, setTab] = useState<Tab>('overview');

  const company = companyQuery.data;
  const flags = flagsQuery.data ?? [];
  const users = usersQuery.data?.items ?? [];

  const country = useMemo(
    () => (company ? findCountry(company.country) : null),
    [company]
  );

  const suspend = (): void => {
    if (!company) return;
    Alert.alert(
      t('companies.confirmSuspend'),
      company.name,
      [
        { text: t('common.cancel') },
        {
          text: t('companies.suspend'),
          style: 'destructive',
          onPress: () =>
            suspendMut.mutate({
              id: company.id,
              reason: 'Manual platform action',
            }),
        },
      ]
    );
  };

  const reactivate = (): void => {
    if (!company) return;
    reactivateMut.mutate(company.id);
  };

  const toggleFlag = (key: string, enabled: boolean): void => {
    flagMut.mutate({
      companyId: company?.id ?? null,
      flagKey: key,
      enabled,
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={company?.name ?? t('companies.title')}
        onBack={() => navigation.goBack()}
      />
      {companyQuery.isLoading || !company ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={160} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <Text style={styles.heroFlag}>{country?.flag ?? '🌍'}</Text>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{company.name}</Text>
                <Text style={styles.heroMeta}>
                  {`${company.ownerName} · ${company.ownerEmail}`}
                </Text>
                <Text style={styles.heroMeta}>
                  {`${country?.name[language] ?? company.country} · ${company.plan.toUpperCase()}`}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {TABS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={[styles.tab, tab === item ? styles.tabActive : null]}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === item ? { color: darkColors.textOnPrimary } : null,
                  ]}
                >
                  {t(`companyTabs.${item}`, item)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.scroll}>
            {tab === 'overview' ? (
              <StatsGrid
                items={[
                  {
                    key: 'users',
                    label: t('companies.users'),
                    value: String(company.usersCount),
                    icon: 'people-outline',
                  },
                  {
                    key: 'customers',
                    label: t('companies.customers'),
                    value: String(company.customersCount),
                    icon: 'person-outline',
                  },
                  {
                    key: 'mrr',
                    label: t('companies.mrr'),
                    value: `$${company.mrr}/mo`,
                    icon: 'cash-outline',
                    tone: darkColors.success,
                  },
                  {
                    key: 'plan',
                    label: t('companies.plan'),
                    value: company.plan.toUpperCase(),
                    icon: 'pricetag-outline',
                  },
                ]}
              />
            ) : null}

            {tab === 'users' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{company.usersCount} users</Text>
                {users.map((user) => (
                  <View key={user.id} style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitials}>
                        {user.avatarInitials}
                      </Text>
                    </View>
                    <View style={styles.userBody}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userMeta}>
                        {`${user.email} · ${user.role}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {tab === 'billing' ? (
              <View style={styles.card}>
                <InfoLine
                  icon="pricetag-outline"
                  label={t('companies.plan')}
                  value={company.plan.toUpperCase()}
                />
                <InfoLine
                  icon="cash-outline"
                  label={t('companies.mrr')}
                  value={`$${company.mrr}/mo`}
                />
                <InfoLine
                  icon="calendar-outline"
                  label={t('admin.createdAt', { defaultValue: 'Created' })}
                  value={company.createdAt.slice(0, 10)}
                />
                <Pressable style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>
                    {t('plans.editPlan')}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {tab === 'features' ? (
              <View style={styles.card}>
                {flags.map((flag) => (
                  <View key={flag.key} style={styles.featureRow}>
                    <View style={styles.featureBody}>
                      <Text style={styles.featureName}>{flag.name}</Text>
                      <Text style={styles.featureMeta}>
                        {`${flag.category} · default for ${flag.defaultEnabledFor}`}
                      </Text>
                    </View>
                    <Switch
                      value={flag.enabled}
                      onValueChange={(value) => toggleFlag(flag.key, value)}
                      trackColor={{
                        false: darkColors.border,
                        true: darkColors.primary,
                      }}
                      thumbColor={darkColors.white}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {tab === 'audit' || tab === 'activity' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t('admin.auditLog')}
                </Text>
                <Text style={styles.placeholder}>
                  {t('placeholders.comingInSprint', { sprint: 9 })}
                </Text>
              </View>
            ) : null}

            {tab === 'actions' ? (
              <View style={styles.card}>
                <ActionRow
                  icon="person-circle-outline"
                  label={t('companies.impersonate')}
                  onPress={() =>
                    Alert.alert(t('usersAdmin.impersonate'), company.ownerName)
                  }
                />
                {company.status === 'suspended' ? (
                  <ActionRow
                    icon="play-outline"
                    label={t('companies.reactivate')}
                    onPress={reactivate}
                  />
                ) : (
                  <ActionRow
                    icon="pause-outline"
                    label={t('companies.suspend')}
                    tone="warning"
                    onPress={suspend}
                  />
                )}
                <ActionRow
                  icon="cloud-download-outline"
                  label={t('admin.exportCompanyData', {
                    defaultValue: 'Export all data',
                  })}
                  onPress={() =>
                    Alert.alert(t('compliance.export', { defaultValue: 'Export' }))
                  }
                />
                <ActionRow
                  icon="trash-outline"
                  label={t('companies.delete')}
                  tone="error"
                  onPress={() =>
                    Alert.alert(t('companies.confirmDelete'), undefined, [
                      { text: t('common.cancel') },
                      { text: t('companies.delete'), style: 'destructive' },
                    ])
                  }
                />
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const InfoLine: React.FC<{ icon: AnyIconName; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoLine}>
    <Icon name={icon} size={18} color={darkColors.primary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ActionRow: React.FC<{
  icon: AnyIconName;
  label: string;
  tone?: 'primary' | 'warning' | 'error';
  onPress: () => void;
}> = ({ icon, label, tone = 'primary', onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionRow,
      pressed ? { opacity: 0.85 } : null,
    ]}
  >
    <Icon
      name={icon}
      size={20}
      color={
        tone === 'error'
          ? darkColors.error
          : tone === 'warning'
            ? darkColors.warning
            : darkColors.primary
      }
    />
    <Text
      style={[
        styles.actionLabel,
        tone === 'error'
          ? { color: darkColors.error }
          : tone === 'warning'
            ? { color: darkColors.warning }
            : null,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  heroCard: {
    backgroundColor: darkColors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
  },
  heroFlag: { fontSize: 36 },
  heroInfo: { flex: 1, rowGap: 2 },
  heroName: { ...textStyles.h2, color: darkColors.textPrimary },
  heroMeta: { ...textStyles.caption, color: darkColors.textMuted },
  tabRow: {
    paddingHorizontal: spacing.base,
    columnGap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  tabActive: { backgroundColor: darkColors.primary },
  tabText: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: darkColors.textPrimary },
  placeholder: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    fontStyle: 'italic',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  userBody: { flex: 1 },
  userName: { ...textStyles.bodyMedium, color: darkColors.textPrimary },
  userMeta: { ...textStyles.caption, color: darkColors.textMuted },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  infoBody: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: darkColors.textMuted },
  infoValue: { ...textStyles.body, color: darkColors.textPrimary },
  primaryBtn: {
    backgroundColor: darkColors.primary,
    padding: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
    columnGap: spacing.sm,
  },
  featureBody: { flex: 1 },
  featureName: { ...textStyles.body, color: darkColors.textPrimary },
  featureMeta: { ...textStyles.caption, color: darkColors.textMuted },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
});

export default CompanyDetailScreen;
