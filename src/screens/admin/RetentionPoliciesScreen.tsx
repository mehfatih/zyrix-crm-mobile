/**
 * RetentionPoliciesScreen — per-entity retention windows with legal
 * hold toggles and a "Run purge now" affordance.
 */

import React from 'react';
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

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { darkColors } from '../../theme/dark';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useCreateRetentionPolicy,
  useRetentionPolicies,
} from '../../hooks/useAdmin';
import type { RetentionEntityType } from '../../types/admin';

const ENTITY_LABEL: Record<RetentionEntityType, string> = {
  customer: 'Customer records',
  audit_log: 'Audit logs',
  message: 'Messages',
  invoice: 'Invoices (legal compliance)',
  payment: 'Payments',
};

export const RetentionPoliciesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const policiesQuery = useRetentionPolicies();
  const updateMut = useCreateRetentionPolicy();

  const runPurge = (): void => {
    Alert.alert(t('retention.runPurgeNow'), undefined, [
      { text: t('common.cancel') },
      {
        text: t('retention.runPurgeNow'),
        style: 'destructive',
        onPress: () => undefined,
      },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('retention.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {policiesQuery.isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} height={96} />
            ))
          : (policiesQuery.data ?? []).map((policy) => (
              <View key={policy.id} style={styles.card}>
                <Text style={styles.entity}>
                  {ENTITY_LABEL[policy.entityType]}
                </Text>
                <Text style={styles.retention}>
                  {`${t('retention.retentionDays')}: ${policy.retentionDays} (${Math.round(policy.retentionDays / 365)}y)`}
                </Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {t('retention.legalHold')}
                  </Text>
                  <Switch
                    value={policy.legalHoldActive}
                    onValueChange={(value) =>
                      updateMut.mutate({
                        entityType: policy.entityType,
                        retentionDays: policy.retentionDays,
                        legalHoldActive: value,
                      })
                    }
                    trackColor={{ false: darkColors.border, true: darkColors.primary }}
                    thumbColor={darkColors.white}
                  />
                </View>
              </View>
            ))}

        <View style={styles.purgeCard}>
          <View style={styles.purgeHeader}>
            <Icon name="trash-bin-outline" size={24} color={darkColors.error} />
            <Text style={styles.purgeTitle}>{t('retention.runPurgeNow')}</Text>
          </View>
          <Text style={styles.purgeBody}>{t('retention.nextPurge')}</Text>
          <Pressable
            onPress={runPurge}
            style={({ pressed }) => [
              styles.purgeBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.purgeBtnText}>
              {t('retention.runPurgeNow')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  entity: { ...textStyles.bodyMedium, color: darkColors.textPrimary },
  retention: { ...textStyles.caption, color: darkColors.textMuted },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  toggleLabel: { ...textStyles.body, color: darkColors.textPrimary },
  purgeCard: {
    backgroundColor: darkColors.errorSoft,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    marginTop: spacing.base,
  },
  purgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  purgeTitle: { ...textStyles.h4, color: darkColors.error },
  purgeBody: { ...textStyles.body, color: darkColors.error },
  purgeBtn: {
    backgroundColor: darkColors.error,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  purgeBtnText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
});

export default RetentionPoliciesScreen;
