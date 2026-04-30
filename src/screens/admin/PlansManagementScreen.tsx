/**
 * PlansManagementScreen — list of pricing plans with a quick toggle
 * for active state. Tap a plan to open the editor.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { darkColors } from '../../theme/dark';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { usePlans, useUpdatePlan } from '../../hooks/useAdmin';
import type { AdminPlansStackParamList } from '../../navigation/types';

type Navigation = NativeStackNavigationProp<
  AdminPlansStackParamList,
  'PlansList'
>;

export const PlansManagementScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const plansQuery = usePlans();
  const updateMut = useUpdatePlan();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('plans.title')}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {plansQuery.isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonCard key={idx} height={120} />
            ))
          : (plansQuery.data ?? []).map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() =>
                  navigation.navigate('EditPlan', { planId: plan.id })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {plan.priceMonthly === 0
                        ? 'Free'
                        : `$${plan.priceMonthly}/mo`}
                    </Text>
                  </View>
                  <Switch
                    value={plan.active}
                    onValueChange={(value) =>
                      updateMut.mutate({
                        id: plan.id,
                        data: { active: value },
                      })
                    }
                    trackColor={{
                      false: darkColors.border,
                      true: darkColors.primary,
                    }}
                    thumbColor={darkColors.white}
                  />
                </View>
                <Text style={styles.planDesc}>{plan.description}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>
                      {t('plans.maxUsers')}
                    </Text>
                    <Text style={styles.statValue}>
                      {plan.limits.users === -1 ? '∞' : plan.limits.users}
                    </Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>
                      {t('plans.maxCustomers')}
                    </Text>
                    <Text style={styles.statValue}>
                      {plan.limits.customers === -1
                        ? '∞'
                        : plan.limits.customers.toLocaleString('en-US')}
                    </Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>
                      {t('plans.storage')}
                    </Text>
                    <Text style={styles.statValue}>
                      {`${plan.limits.storageGB} GB`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.companies}>
                  {`${plan.companiesCount} companies on this plan`}
                </Text>
              </Pressable>
            ))}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('EditPlan', { planId: null })}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={26} color={darkColors.textOnPrimary} />
      </Pressable>
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
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxxl * 2,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  planName: { ...textStyles.h3, color: darkColors.textPrimary },
  planPrice: {
    ...textStyles.bodyMedium,
    color: darkColors.primary,
    fontWeight: '700',
  },
  planDesc: { ...textStyles.body, color: darkColors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCell: {
    flex: 1,
    backgroundColor: darkColors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.base,
    rowGap: 2,
  },
  statLabel: { ...textStyles.caption, color: darkColors.primaryDark },
  statValue: {
    ...textStyles.h4,
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  companies: { ...textStyles.caption, color: darkColors.textMuted },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default PlansManagementScreen;
