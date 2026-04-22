/**
 * LoyaltyRulesScreen — configures points earning ratio, bonus
 * multipliers, tier thresholds, and per-tier benefits.
 */

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface TierConfig {
  threshold: number;
  discount: number;
  freeShipping: boolean;
  prioritySupport: boolean;
}

const DEFAULT_TIERS: Record<Tier, TierConfig> = {
  bronze: { threshold: 0, discount: 0, freeShipping: false, prioritySupport: false },
  silver: { threshold: 5000, discount: 5, freeShipping: false, prioritySupport: false },
  gold: { threshold: 15000, discount: 10, freeShipping: true, prioritySupport: false },
  platinum: { threshold: 40000, discount: 15, freeShipping: true, prioritySupport: true },
};

export const LoyaltyRulesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [pointsPerUnit, setPointsPerUnit] = useState('1');
  const [birthdayMultiplier, setBirthdayMultiplier] = useState('2');
  const [anniversaryMultiplier, setAnniversaryMultiplier] = useState('2');
  const [tiers, setTiers] = useState<Record<Tier, TierConfig>>(DEFAULT_TIERS);

  const patchTier = (tier: Tier, partial: Partial<TierConfig>): void => {
    setTiers((prev) => ({ ...prev, [tier]: { ...prev[tier], ...partial } }));
  };

  const save = (): void => {
    toast.success(t('common.success'));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('loyalty.rules')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('loyalty.pointsRatio')}</Text>
          <Text style={styles.caption}>
            {`${t('loyalty.points')} / ${t('currency.amount')}`}
          </Text>
          <TextInput
            value={pointsPerUnit}
            onChangeText={(next) =>
              setPointsPerUnit(next.replace(/[^0-9.]/g, ''))
            }
            keyboardType="decimal-pad"
            style={[
              styles.numberInput,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('loyalty.bonusMultipliers')}</Text>
          <View style={styles.multiplierRow}>
            <Text style={styles.multiplierLabel}>Birthday</Text>
            <TextInput
              value={birthdayMultiplier}
              onChangeText={(next) =>
                setBirthdayMultiplier(next.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
              style={[
                styles.numberInput,
                {
                  textAlign: I18nManager.isRTL ? 'right' : 'left',
                  flex: 1,
                },
              ]}
            />
          </View>
          <View style={styles.multiplierRow}>
            <Text style={styles.multiplierLabel}>Anniversary</Text>
            <TextInput
              value={anniversaryMultiplier}
              onChangeText={(next) =>
                setAnniversaryMultiplier(next.replace(/[^0-9.]/g, ''))
              }
              keyboardType="decimal-pad"
              style={[
                styles.numberInput,
                {
                  textAlign: I18nManager.isRTL ? 'right' : 'left',
                  flex: 1,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('loyalty.tierThresholds')}</Text>
          {(['bronze', 'silver', 'gold', 'platinum'] as Tier[]).map((tier) => {
            const config = tiers[tier];
            return (
              <View key={tier} style={styles.tierBlock}>
                <Text style={styles.tierTitle}>
                  {t(`loyalty.${tier}`)}
                </Text>
                <Row
                  label={`${t('loyalty.tierThresholds')} (${t('loyalty.points')})`}
                >
                  <TextInput
                    value={String(config.threshold)}
                    onChangeText={(next) =>
                      patchTier(tier, {
                        threshold: parseInt(next.replace(/[^0-9]/g, '') || '0', 10),
                      })
                    }
                    keyboardType="number-pad"
                    style={[
                      styles.numberInput,
                      { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                  />
                </Row>
                <Row label={`${t('forms.discount')} %`}>
                  <TextInput
                    value={String(config.discount)}
                    onChangeText={(next) =>
                      patchTier(tier, {
                        discount: Math.min(
                          parseInt(next.replace(/[^0-9]/g, '') || '0', 10),
                          100
                        ),
                      })
                    }
                    keyboardType="number-pad"
                    style={[
                      styles.numberInput,
                      { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                  />
                </Row>
                <Toggle
                  label={t('loyalty.benefits')}
                  value={config.freeShipping}
                  onValueChange={(v) => patchTier(tier, { freeShipping: v })}
                />
                <Toggle
                  label={t('loyalty.redeem')}
                  value={config.prioritySupport}
                  onValueChange={(v) =>
                    patchTier(tier, { prioritySupport: v })
                  }
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('common.save')} onPress={save} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowValue}>{children}</View>
  </View>
);

const Toggle: React.FC<{
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ label, value, onValueChange }) => (
  <View style={styles.toggleRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  title: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  caption: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  numberInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
    minWidth: 80,
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  multiplierLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
    minWidth: 110,
  },
  tierBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    rowGap: spacing.xs,
  },
  tierTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
  },
  rowLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  rowValue: { flex: 1 },
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

export default LoyaltyRulesScreen;
