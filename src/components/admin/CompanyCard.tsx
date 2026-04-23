/**
 * CompanyCard — admin-facing company row with plan badge, country
 * flag, MRR, user count, and a status pill.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { findCountry } from '../../constants/countries';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { Company, CompanyStatus, PlanTier } from '../../types/admin';

export interface CompanyCardProps {
  company: Company;
  onPress?: (company: Company) => void;
}

const STATUS_TONE: Record<CompanyStatus, { background: string; color: string }> = {
  active: { background: colors.successSoft, color: colors.success },
  suspended: { background: colors.errorSoft, color: colors.error },
  pending: { background: colors.warningSoft, color: colors.warning },
  deleted: { background: colors.surfaceAlt, color: colors.textMuted },
};

const PLAN_TONE: Record<PlanTier, { background: string; color: string }> = {
  free: { background: colors.planFreeSoft, color: colors.planFree },
  starter: { background: colors.planStarterSoft, color: colors.planStarter },
  business: { background: colors.planBusinessSoft, color: colors.planBusiness },
  enterprise: {
    background: colors.planEnterpriseSoft,
    color: colors.planEnterprise,
  },
};

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onPress }) => {
  const { t } = useTranslation();
  const status = STATUS_TONE[company.status];
  const plan = PLAN_TONE[company.plan];
  const country = findCountry(company.country);

  return (
    <Pressable
      onPress={() => onPress?.(company)}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {company.name}
        </Text>
        <Text style={styles.flag}>{country.flag}</Text>
      </View>
      <Text style={styles.owner} numberOfLines={1}>
        {`${company.ownerName} · ${company.ownerEmail}`}
      </Text>

      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: plan.background }]}>
          <Text style={[styles.badgeText, { color: plan.color }]}>
            {company.plan.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.background }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>
            {t(`companies.${company.status}`)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <Icon name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {`${company.usersCount} ${t('companies.users')}`}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Icon name="cash-outline" size={14} color={colors.success} />
          <Text style={[styles.metaText, { color: colors.success, fontWeight: '700' }]}>
            {`$${company.mrr}/mo`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  flag: { fontSize: 18 },
  owner: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaCell: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
});

export default CompanyCard;
