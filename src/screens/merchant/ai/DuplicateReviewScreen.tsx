/**
 * DuplicateReviewScreen — side-by-side field picker for deciding which
 * value to keep from each duplicate record. The AI pre-selects the
 * best value per field; the user can override before merging.
 */

import React, { useMemo, useState } from 'react';
import {
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
import { useQuery } from '@tanstack/react-query';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { detectDuplicates } from '../../../api/ai';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantAIStackParamList, 'DuplicateReview'>;

export const DuplicateReviewScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const toast = useToast();

  const groupsQuery = useQuery({
    queryKey: ['ai', 'duplicates', 'review'],
    queryFn: () => detectDuplicates('customer'),
  });

  const group = useMemo(
    () =>
      (groupsQuery.data ?? []).find(
        (entry) => entry.id === route.params.groupId
      ),
    [groupsQuery.data, route.params.groupId]
  );

  const [winnerIndex, setWinnerIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});

  if (groupsQuery.isLoading || !group) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header
          title={t('duplicates.reviewIndividually')}
          onBack={() => navigation.goBack()}
        />
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={140} />
        </View>
      </SafeAreaView>
    );
  }

  const pickValue = (fieldKey: string, idx: number): void => {
    setChoices((prev) => ({ ...prev, [fieldKey]: idx }));
  };

  const merge = (): void => {
    toast.success(t('common.success'));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('duplicates.reviewIndividually')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.winnerCard}>
          <Text style={styles.sectionTitle}>
            {t('duplicates.winner', { defaultValue: 'Master record' })}
          </Text>
          <View style={styles.winnerRow}>
            {group.records.map((record, idx) => (
              <Pressable
                key={record.id}
                onPress={() => setWinnerIndex(idx)}
                style={[
                  styles.winnerOption,
                  winnerIndex === idx ? styles.winnerOptionActive : null,
                ]}
              >
                <Icon
                  name={
                    winnerIndex === idx
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.winnerLabel}>
                  {record.primaryLabel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {group.fields.map((field) => {
          const selected = choices[field.key] ?? field.recommendedIndex;
          return (
            <View key={field.key} style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.smartBadge}>
                  <Icon
                    name="sparkles-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.smartText}>
                    {t('duplicates.smartSuggestion')}
                  </Text>
                </View>
              </View>
              <View style={styles.fieldRow}>
                {field.values.map((value, idx) => (
                  <Pressable
                    key={`${field.key}-${idx}`}
                    onPress={() => pickValue(field.key, idx)}
                    style={[
                      styles.fieldOption,
                      selected === idx ? styles.fieldOptionActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fieldValue,
                        selected === idx
                          ? { color: colors.primaryDark, fontWeight: '700' }
                          : null,
                      ]}
                      numberOfLines={2}
                    >
                      {value || '—'}
                    </Text>
                    {idx === field.recommendedIndex ? (
                      <Text style={styles.recommendedTag}>
                        {t('duplicates.smartSuggestion')}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={merge}
          style={({ pressed }) => [
            styles.mergeBtn,
            pressed ? { opacity: 0.9 } : null,
          ]}
        >
          <Icon name="git-merge-outline" size={18} color={colors.textInverse} />
          <Text style={styles.mergeText}>{t('duplicates.mergeAll')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  winnerCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  winnerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  winnerOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  winnerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  winnerLabel: {
    ...textStyles.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  fieldCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  smartText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldOption: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    rowGap: 4,
  },
  fieldOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fieldValue: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  recommendedTag: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  mergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  mergeText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
});

export default DuplicateReviewScreen;
