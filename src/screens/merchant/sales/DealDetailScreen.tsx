/**
 * DealDetailScreen — rich view for a single deal with a stage
 * progression bar, key info cards, action buttons for moving stages /
 * marking won or lost, and a placeholder activities timeline.
 */

import React from 'react';
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { AttachedFilesSection } from '../../../components/files/AttachedFilesSection';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { DEAL_PIPELINE } from '../../../api/deals';
import { DEALS_BY_STAGE_COLORS } from '../../../api/mockData';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCloseDeal, useDeal, useMoveDealStage } from '../../../hooks/useDeals';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import type { DealStage } from '../../../api/deals';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'DealDetail'>;

export const DealDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const dealId = route.params?.dealId ?? '';

  const { formatDate } = useCountryConfig();
  const { data: deal, isLoading } = useDeal(dealId);
  const moveStage = useMoveDealStage();
  const closeDealMut = useCloseDeal();

  const advance = (): void => {
    if (!deal) return;
    const idx = DEAL_PIPELINE.indexOf(deal.stage);
    if (idx === -1 || idx >= DEAL_PIPELINE.length - 1) {
      Alert.alert(t('deals.moveToNextStage'));
      return;
    }
    const next = DEAL_PIPELINE[idx + 1] as DealStage;
    moveStage.mutate({ id: deal.id, stage: next });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={deal?.title ?? t('navigation.dealDetail')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading || !deal ? (
          <View style={{ padding: spacing.base }}>
            <SkeletonCard height={120} />
            <SkeletonCard height={100} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.customer}>{deal.customerName}</Text>
              <Text style={styles.title}>{deal.title}</Text>
              <CurrencyDisplay
                amount={deal.value}
                size="large"
                color={darkColors.primaryDark}
              />
            </View>

            <View style={styles.pipelineCard}>
              <Text style={styles.sectionTitle}>{t('deals.stage')}</Text>
              <View style={styles.stageTrack}>
                {DEAL_PIPELINE.map((stage, idx) => {
                  const activeIdx = DEAL_PIPELINE.indexOf(deal.stage);
                  const reached = idx <= activeIdx;
                  return (
                    <React.Fragment key={stage}>
                      <View style={styles.stageNodeWrap}>
                        <View
                          style={[
                            styles.stageDot,
                            {
                              backgroundColor: reached
                                ? DEALS_BY_STAGE_COLORS[stage]
                                : darkColors.border,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.stageText,
                            reached
                              ? { color: DEALS_BY_STAGE_COLORS[stage], fontWeight: '700' }
                              : null,
                          ]}
                          numberOfLines={1}
                        >
                          {t(`stages.${stage}`)}
                        </Text>
                      </View>
                      {idx < DEAL_PIPELINE.length - 1 ? (
                        <View
                          style={[
                            styles.stageLine,
                            {
                              backgroundColor: reached
                                ? DEALS_BY_STAGE_COLORS[stage]
                                : darkColors.border,
                            },
                          ]}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            <View style={styles.infoGrid}>
              <InfoCard
                label={t('deals.probability')}
                value={`${deal.probability}%`}
              />
              <InfoCard
                label={t('deals.expectedClose')}
                value={formatDate(deal.expectedCloseDate)}
              />
              <InfoCard
                label={t('deals.assignedTo')}
                value={deal.assignedToName}
              />
            </View>

            {deal.closedStatus ? null : (
              <View style={styles.actionsColumn}>
                <Pressable
                  onPress={advance}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Icon
                    name="arrow-forward"
                    size={18}
                    color={darkColors.textOnPrimary}
                  />
                  <Text style={styles.primaryText}>
                    {t('deals.moveToNextStage')}
                  </Text>
                </Pressable>
                <View style={styles.binaryRow}>
                  <Pressable
                    onPress={() =>
                      closeDealMut.mutate({ id: deal.id, status: 'won' })
                    }
                    style={({ pressed }) => [
                      styles.wonBtn,
                      pressed ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Text style={styles.wonText}>{t('deals.markAsWon')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      closeDealMut.mutate({ id: deal.id, status: 'lost' })
                    }
                    style={({ pressed }) => [
                      styles.lostBtn,
                      pressed ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Text style={styles.lostText}>{t('deals.markAsLost')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <AttachedFilesSection
              recordType="deal"
              recordId={deal.id}
              recordName={deal.title}
            />

            <View style={styles.placeholderCard}>
              <Icon name="time-outline" size={28} color={darkColors.primary} />
              <Text style={styles.placeholderTitle}>
                {t('activities.recentActivities')}
              </Text>
              <Text style={styles.placeholderBody}>
                {t('placeholders.comingInSprint', { sprint: 5 })}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: { paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: darkColors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  customer: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  title: {
    ...textStyles.h3,
    color: darkColors.textPrimary,
  },
  pipelineCard: {
    backgroundColor: darkColors.surface,
    marginHorizontal: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.label,
    color: darkColors.textSecondary,
  },
  stageTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  stageNodeWrap: {
    alignItems: 'center',
    rowGap: spacing.xs,
    minWidth: 50,
  },
  stageDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stageText: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    maxWidth: 60,
    textAlign: 'center',
  },
  stageLine: {
    flex: 1,
    height: 3,
    marginTop: -20,
  },
  infoGrid: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  infoCard: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadows.xs,
  },
  infoLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  infoValue: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    marginTop: 2,
  },
  actionsColumn: {
    paddingHorizontal: spacing.base,
    rowGap: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    columnGap: spacing.sm,
  },
  primaryText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
  binaryRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  wonBtn: {
    flex: 1,
    backgroundColor: darkColors.successSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  wonText: { ...textStyles.button, color: darkColors.success },
  lostBtn: {
    flex: 1,
    backgroundColor: darkColors.errorSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  lostText: { ...textStyles.button, color: darkColors.error },
  placeholderCard: {
    margin: spacing.base,
    padding: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  placeholderTitle: { ...textStyles.h4, color: darkColors.textPrimary },
  placeholderBody: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
});

export default DealDetailScreen;
