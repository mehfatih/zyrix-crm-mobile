/**
 * CommissionsScreen — period selector, summary of total commission
 * earned, per-rep breakdown. Taps through a rep for a deal detail list
 * which is a placeholder for Sprint 5.
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

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { MOCK_REPS } from '../../../api/mockData';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

type Period = 'thisMonth' | 'lastMonth' | 'quarter' | 'custom';

const PERIODS: readonly Period[] = ['thisMonth', 'lastMonth', 'quarter', 'custom'];

export const CommissionsScreen: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('thisMonth');

  const totalCommission = useMemo(
    () =>
      MOCK_REPS.reduce(
        (sum, rep) => sum + (rep.revenue * rep.commissionRate) / 100,
        0
      ),
    []
  );

  const onRepPress = (name: string): void => {
    Alert.alert(name, t('placeholders.comingInSprint', { sprint: 5 }));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.commissions')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periods}
        >
          {PERIODS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              style={[
                styles.periodChip,
                period === key ? styles.periodChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  period === key ? styles.periodTextActive : null,
                ]}
              >
                {t(`commissions.${key}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('commissions.totalEarned')}</Text>
          <CurrencyDisplay
            amount={totalCommission}
            size="large"
            color={darkColors.primaryDark}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('commissions.rep')}</Text>

        {MOCK_REPS.map((rep) => {
          const earned = (rep.revenue * rep.commissionRate) / 100;
          return (
            <Pressable
              key={rep.id}
              onPress={() => onRepPress(rep.name)}
              style={({ pressed }) => [
                styles.repCard,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{rep.avatarInitials}</Text>
              </View>
              <View style={styles.repBody}>
                <Text style={styles.repName}>{rep.name}</Text>
                <Text style={styles.repMeta}>
                  {`${rep.dealsClosed} ${t('commissions.dealsClosed')} · ${rep.commissionRate}%`}
                </Text>
                <CurrencyDisplay
                  amount={rep.revenue}
                  size="small"
                  color={darkColors.textMuted}
                />
              </View>
              <View style={styles.earnedWrap}>
                <Text style={styles.earnedLabel}>
                  {t('commissions.earned')}
                </Text>
                <CurrencyDisplay
                  amount={earned}
                  size="medium"
                  color={darkColors.primaryDark}
                />
              </View>
            </Pressable>
          );
        })}
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
  periods: {
    columnGap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  periodChipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  periodText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: { color: darkColors.textOnPrimary },
  summaryCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    ...shadows.sm,
    alignItems: 'flex-start',
    rowGap: spacing.xs,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  repCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    columnGap: spacing.sm,
    ...shadows.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  repBody: { flex: 1, rowGap: 2 },
  repName: { ...textStyles.bodyMedium, color: darkColors.textPrimary },
  repMeta: { ...textStyles.caption, color: darkColors.textMuted },
  earnedWrap: {
    alignItems: 'flex-end',
    rowGap: 2,
  },
  earnedLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
});

export default CommissionsScreen;
