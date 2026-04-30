/**
 * AIWorkflowsScreen — entry point for AI-generated workflows. Top CTA
 * launches the chat-driven builder; the list below shows the existing
 * AI-generated workflows (currently reusing the Sprint 4 mock data
 * since both surfaces share the same underlying structure).
 */

import React, { useMemo } from 'react';
import {
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

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { MOCK_AUTOMATIONS } from '../../../api/mockData';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantAIStackParamList,
  'AIWorkflows'
>;

export const AIWorkflowsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();

  const workflows = useMemo(() => MOCK_AUTOMATIONS.slice(0, 3), []);

  const openBuilder = (): void => {
    navigation.navigate('AIWorkflowBuilder');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('ai.aiWorkflows')} showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={openBuilder}
          style={({ pressed }) => [
            styles.cta,
            pressed ? { opacity: 0.9 } : null,
          ]}
        >
          <Icon name="sparkles-outline" size={24} color={darkColors.textOnPrimary} />
          <View style={styles.ctaBody}>
            <Text style={styles.ctaTitle}>{t('aiWorkflows.createWithAI')}</Text>
            <Text style={styles.ctaSubtitle}>
              {t('aiWorkflows.describeWorkflow')}
            </Text>
          </View>
          <Icon
            name="arrow-forward"
            size={20}
            color={darkColors.textOnPrimary}
          />
        </Pressable>

        {workflows.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="flash-outline" size={48} color={darkColors.primary} />
            <Text style={styles.emptyTitle}>
              {t('aiWorkflows.describeWorkflow')}
            </Text>
          </View>
        ) : (
          workflows.map((wf) => (
            <View key={wf.id} style={styles.card}>
              <View style={styles.rowHeader}>
                <Text style={styles.name}>{wf.name}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: wf.enabled
                        ? darkColors.successSoft
                        : darkColors.surfaceAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: wf.enabled ? darkColors.success : darkColors.textMuted,
                      },
                    ]}
                  >
                    {wf.enabled
                      ? t('campaignStatus.active')
                      : t('campaignStatus.draft')}
                  </Text>
                </View>
              </View>
              <Text style={styles.trigger}>{wf.trigger}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {`${wf.actionsCount} ${t('automation.actions')}`}
                </Text>
                <Text style={styles.meta}>
                  {`${wf.totalTriggers} ${t('automation.triggers')}`}
                </Text>
              </View>
            </View>
          ))
        )}
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
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.primary,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  ctaBody: { flex: 1 },
  ctaTitle: {
    ...textStyles.h3,
    color: darkColors.textOnPrimary,
    fontWeight: '800',
  },
  ctaSubtitle: {
    ...textStyles.caption,
    color: darkColors.primarySoft,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  trigger: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  meta: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
  },
});

export default AIWorkflowsScreen;
