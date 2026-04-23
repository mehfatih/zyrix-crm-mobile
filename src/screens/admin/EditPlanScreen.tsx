/**
 * EditPlanScreen — create or edit a pricing plan with limits, monthly
 * + annual price, and feature toggles.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useCreatePlan,
  useFeatureFlags,
  usePlans,
  useUpdatePlan,
} from '../../hooks/useAdmin';
import type { Plan, PlanTier } from '../../types/admin';
import type { AdminPlansStackParamList } from '../../navigation/types';

type Route = RouteProp<AdminPlansStackParamList, 'EditPlan'>;

const TIERS: readonly PlanTier[] = ['free', 'starter', 'business', 'enterprise'];

export const EditPlanScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();

  const plansQuery = usePlans();
  const flagsQuery = useFeatureFlags();
  const createMut = useCreatePlan();
  const updateMut = useUpdatePlan();

  const editing = useMemo(
    () => plansQuery.data?.find((plan) => plan.id === route.params.planId) ?? null,
    [plansQuery.data, route.params.planId]
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState<PlanTier>('starter');
  const [priceMonthly, setPriceMonthly] = useState('19');
  const [priceAnnually, setPriceAnnually] = useState('190');
  const [maxUsers, setMaxUsers] = useState('15');
  const [maxCustomers, setMaxCustomers] = useState('1000');
  const [storage, setStorage] = useState('10');
  const [apiCalls, setApiCalls] = useState('50000');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('1');
  const [active, setActive] = useState(true);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setSlug(editing.slug);
    setPriceMonthly(String(editing.priceMonthly));
    setPriceAnnually(String(editing.priceAnnually));
    setMaxUsers(String(editing.limits.users));
    setMaxCustomers(String(editing.limits.customers));
    setStorage(String(editing.limits.storageGB));
    setApiCalls(String(editing.limits.apiCallsPerMonth));
    setDescription(editing.description);
    setOrder(String(editing.order));
    setActive(editing.active);
    setEnabledFeatures(editing.features);
  }, [editing]);

  const flags = flagsQuery.data ?? [];

  const toggleFeature = (key: string): void => {
    setEnabledFeatures((prev) =>
      prev.includes(key) ? prev.filter((entry) => entry !== key) : [...prev, key]
    );
  };

  const buildPayload = (): Omit<Plan, 'id' | 'companiesCount'> => ({
    name: name || 'Untitled plan',
    slug,
    priceMonthly: Number(priceMonthly) || 0,
    priceAnnually: Number(priceAnnually) || 0,
    description,
    features: enabledFeatures,
    limits: {
      users: Number(maxUsers) || -1,
      customers: Number(maxCustomers) || -1,
      storageGB: Number(storage) || 0,
      apiCallsPerMonth: Number(apiCalls) || 0,
    },
    active,
    order: Number(order) || 0,
  });

  const save = async (): Promise<void> => {
    const payload = buildPayload();
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    navigation.goBack();
  };

  if (plansQuery.isLoading || flagsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header
          title={t('plans.editPlan')}
          onBack={() => navigation.goBack()}
        />
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={120} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={editing ? t('plans.editPlan') : t('plans.newPlan')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Field label="Name" value={name} onChange={setName} />
          <View style={styles.row}>
            <Field
              label={t('plans.priceMonthly')}
              value={priceMonthly}
              onChange={(value) => setPriceMonthly(value.replace(/[^0-9.]/g, ''))}
              keyboard="decimal-pad"
              flex={1}
            />
            <Field
              label={t('plans.priceAnnually')}
              value={priceAnnually}
              onChange={(value) => setPriceAnnually(value.replace(/[^0-9.]/g, ''))}
              keyboard="decimal-pad"
              flex={1}
            />
          </View>
          <View style={styles.row}>
            {TIERS.map((tier) => (
              <Pressable
                key={tier}
                onPress={() => setSlug(tier)}
                style={[
                  styles.tierChip,
                  slug === tier ? styles.tierChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    slug === tier ? { color: colors.textInverse } : null,
                  ]}
                >
                  {tier}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('plans.limits')}</Text>
          <Field
            label={t('plans.maxUsers')}
            value={maxUsers}
            onChange={(value) => setMaxUsers(value.replace(/[^0-9-]/g, ''))}
            keyboard="number-pad"
          />
          <Field
            label={t('plans.maxCustomers')}
            value={maxCustomers}
            onChange={(value) => setMaxCustomers(value.replace(/[^0-9-]/g, ''))}
            keyboard="number-pad"
          />
          <Field
            label={`${t('plans.storage')} (GB)`}
            value={storage}
            onChange={(value) => setStorage(value.replace(/[^0-9]/g, ''))}
            keyboard="number-pad"
          />
          <Field
            label={t('plans.apiCalls')}
            value={apiCalls}
            onChange={(value) => setApiCalls(value.replace(/[^0-9]/g, ''))}
            keyboard="number-pad"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('plans.features')}</Text>
          {flags.map((flag) => (
            <View key={flag.key} style={styles.featureRow}>
              <View style={styles.featureBody}>
                <Text style={styles.featureName}>{flag.name}</Text>
                <Text style={styles.featureMeta}>
                  {`${flag.category} · default ${flag.defaultEnabledFor}`}
                </Text>
              </View>
              <Switch
                value={enabledFeatures.includes(flag.key)}
                onValueChange={() => toggleFeature(flag.key)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Field label="Description" value={description} onChange={setDescription} />
          <Field label="Order" value={order} onChange={setOrder} keyboard="number-pad" />
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>{t('plans.activate')}</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('common.save')}
          onPress={() => void save()}
          loading={createMut.isPending || updateMut.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboard?: 'decimal-pad' | 'number-pad';
  flex?: number;
}> = ({ label, value, onChange, keyboard, flex }) => (
  <View style={[styles.field, flex ? { flex } : null]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType={keyboard}
      style={[
        styles.input,
        { textAlign: I18nManager.isRTL ? 'right' : 'left' },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  field: { rowGap: spacing.xs },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  row: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  tierChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  tierChipActive: { backgroundColor: colors.primary },
  tierText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    columnGap: spacing.sm,
  },
  featureBody: { flex: 1 },
  featureName: { ...textStyles.body, color: colors.textPrimary },
  featureMeta: { ...textStyles.caption, color: colors.textMuted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default EditPlanScreen;
