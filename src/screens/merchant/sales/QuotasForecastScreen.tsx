/**
 * QuotasForecastScreen — actual vs target for the current period, with
 * a per-rep table and an AI insight card placeholder.
 */

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BarChart, type BarDatum } from '../../../components/charts/BarChart';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { MOCK_REPS } from '../../../api/mockData';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

type Period = 'quarterToDate' | 'yearToDate';

const attainment = (actual: number, target: number): number =>
  target > 0 ? Math.round((actual / target) * 100) : 0;

export const QuotasForecastScreen: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('quarterToDate');

  const totals = useMemo(() => {
    const target = MOCK_REPS.reduce((sum, r) => sum + r.target, 0);
    const actual = MOCK_REPS.reduce((sum, r) => sum + r.actual, 0);
    return { target, actual, pct: attainment(actual, target) };
  }, []);

  const chartData = useMemo<BarDatum[]>(
    () => [
      { label: t('quotas.target'), value: totals.target, color: darkColors.primarySoft },
      { label: t('quotas.actual'), value: totals.actual, color: darkColors.primary },
    ],
    [totals, t]
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.quotasForecast')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.periodRow}>
          {(['quarterToDate', 'yearToDate'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodChip,
                period === p ? styles.periodChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p ? styles.periodTextActive : null,
                ]}
              >
                {t(`quotas.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.attainmentCard}>
          <Text style={styles.attainmentLabel}>{t('quotas.attainment')}</Text>
          <Text
            style={[
              styles.attainmentValue,
              {
                color:
                  totals.pct >= 90
                    ? darkColors.success
                    : totals.pct >= 60
                      ? darkColors.warning
                      : darkColors.error,
              },
            ]}
          >
            {`${totals.pct}%`}
          </Text>
          <View style={styles.bigNumbersRow}>
            <View style={styles.numberBlock}>
              <Text style={styles.numberLabel}>{t('quotas.target')}</Text>
              <CurrencyDisplay
                amount={totals.target}
                size="medium"
                color={darkColors.textMuted}
              />
            </View>
            <View style={styles.numberBlock}>
              <Text style={styles.numberLabel}>{t('quotas.actual')}</Text>
              <CurrencyDisplay
                amount={totals.actual}
                size="large"
                color={darkColors.primaryDark}
              />
            </View>
          </View>
        </View>

        <BarChart data={chartData} currency title={t('quotas.forecast')} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('commissions.rep')}</Text>
          {MOCK_REPS.map((rep) => {
            const pct = attainment(rep.actual, rep.target);
            return (
              <View key={rep.id} style={styles.repRow}>
                <Text style={styles.repName}>{rep.name}</Text>
                <View style={styles.repBody}>
                  <Text style={styles.repLabel}>{t('quotas.target')}</Text>
                  <CurrencyDisplay amount={rep.target} size="small" color={darkColors.textMuted} />
                  <Text style={styles.repLabel}>{t('quotas.actual')}</Text>
                  <CurrencyDisplay amount={rep.actual} size="small" />
                </View>
                <Text
                  style={[
                    styles.repPct,
                    {
                      color: pct >= 90 ? darkColors.success : pct >= 60 ? darkColors.warning : darkColors.error,
                    },
                  ]}
                >
                  {`${pct}%`}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.insightCard}>
          <Icon name="sparkles-outline" size={22} color={darkColors.primary} />
          <Text style={styles.insightTitle}>{t('quotas.projected')}</Text>
          <Text style={styles.insightBody}>
            {t('placeholders.comingInSprint', { sprint: 6 })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  periodRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  periodChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  periodChipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  periodText: {
    ...textStyles.label,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: { color: darkColors.textOnPrimary },
  attainmentCard: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  attainmentLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  attainmentValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  bigNumbersRow: {
    flexDirection: 'row',
    columnGap: spacing.base,
    marginTop: spacing.sm,
  },
  numberBlock: { rowGap: 2, alignItems: 'center' },
  numberLabel: { ...textStyles.caption, color: darkColors.textMuted },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  cardTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  repName: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    flex: 1,
  },
  repBody: {
    flex: 1,
    flexDirection: 'row',
    columnGap: spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  repLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  repPct: {
    ...textStyles.h4,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: darkColors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
  },
  insightTitle: {
    ...textStyles.h4,
    color: darkColors.primaryDark,
  },
  insightBody: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
  },
});

export default QuotasForecastScreen;
