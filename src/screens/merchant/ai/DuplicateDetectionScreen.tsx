/**
 * DuplicateDetectionScreen — groups AI-detected duplicate records by
 * match strength. Provides Merge All / Keep Separate / Review
 * Individually actions per group, and highlights groups that include
 * Arabic-script name variations.
 */

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { detectDuplicates } from '../../../api/ai';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';
import type { DuplicateGroup } from '../../../types/ai';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Entity = DuplicateGroup['entityType'];

type Navigation = NativeStackNavigationProp<
  MerchantAIStackParamList,
  'DuplicateDetection'
>;

const strengthLabel = (match: number): string => {
  if (match >= 1) return '100% match';
  if (match >= 0.9) return '90–99%';
  if (match >= 0.7) return '70–89%';
  return '<70%';
};

export const DuplicateDetectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const [entity, setEntity] = useState<Entity>('customer');

  const groupsQuery = useQuery({
    queryKey: ['ai', 'duplicates', entity],
    queryFn: () => detectDuplicates(entity),
  });

  const mergeAll = (group: DuplicateGroup): void => {
    Alert.alert(
      t('duplicates.mergeAll'),
      group.records.map((record) => record.primaryLabel).join('\n'),
      [
        { text: t('common.cancel') },
        {
          text: t('duplicates.mergeAll'),
          onPress: () => toast.success(t('common.success')),
        },
      ]
    );
  };

  const keepSeparate = (group: DuplicateGroup): void => {
    toast.info(t('duplicates.keepSeparate'), group.records[0]?.primaryLabel);
  };

  const review = (group: DuplicateGroup): void => {
    navigation.navigate('DuplicateReview', { groupId: group.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('ai.duplicateDetection')} showBack={false} />

      <View style={styles.tabs}>
        {(['customer', 'contact', 'company'] as Entity[]).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setEntity(entry)}
            style={[
              styles.tab,
              entity === entry ? styles.tabActive : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                entity === entry ? { color: colors.textInverse } : null,
              ]}
            >
              {t(`duplicates.${entry}`, entry)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => void groupsQuery.refetch()}
        style={({ pressed }) => [
          styles.scanBtn,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="scan-outline" size={18} color={colors.textInverse} />
        <Text style={styles.scanText}>{t('duplicates.scan')}</Text>
      </Pressable>

      {groupsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} height={140} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(groupsQuery.data ?? []).map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupStrength}>
                  {strengthLabel(group.matchStrength)}
                </Text>
                {group.arabicVariant ? (
                  <View style={styles.variantBadge}>
                    <Icon
                      name="language-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text style={styles.variantText}>
                      {t('duplicates.arabicVariants', {
                        defaultValue: 'Arabic variant',
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.recordsRow}>
                {group.records.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordAvatar}>
                      <Text style={styles.recordInitials}>
                        {record.avatarInitials}
                      </Text>
                    </View>
                    <Text style={styles.recordPrimary} numberOfLines={1}>
                      {record.primaryLabel}
                    </Text>
                    {record.secondaryLabel ? (
                      <Text style={styles.recordSecondary} numberOfLines={1}>
                        {record.secondaryLabel}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => mergeAll(group)}
                  style={[styles.action, styles.actionPrimary]}
                >
                  <Icon name="git-merge-outline" size={16} color={colors.textInverse} />
                  <Text
                    style={[styles.actionText, { color: colors.textInverse }]}
                  >
                    {t('duplicates.mergeAll')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => keepSeparate(group)}
                  style={styles.action}
                >
                  <Icon name="close" size={16} color={colors.textSecondary} />
                  <Text style={styles.actionText}>
                    {t('duplicates.keepSeparate')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => review(group)}
                  style={styles.action}
                >
                  <Icon
                    name="swap-horizontal-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.actionText, { color: colors.primary }]}
                  >
                    {t('duplicates.reviewIndividually')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    padding: spacing.base,
    columnGap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    marginHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  scanText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  groupCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupStrength: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  variantText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  recordsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recordCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceAlt,
    rowGap: 4,
  },
  recordAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInitials: {
    ...textStyles.label,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  recordPrimary: {
    ...textStyles.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  recordSecondary: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});

export default DuplicateDetectionScreen;
