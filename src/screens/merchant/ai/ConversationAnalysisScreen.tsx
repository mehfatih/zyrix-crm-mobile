/**
 * ConversationAnalysisScreen — AI summary + sentiment timeline + full
 * transcript with highlighted lines. Each highlighted line shows the
 * AI commentary as an inline quote block.
 */

import React, { useState } from 'react';
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

import { AIInsightsChart } from '../../../components/charts/AIInsightsChart';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SentimentBadge } from '../../../components/feature-specific/SentimentBadge';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useConversationIntel } from '../../../hooks/useAI';
import type { MerchantAIStackParamList } from '../../../navigation/types';
import type { ConversationHighlight } from '../../../types/ai';

type Route = RouteProp<MerchantAIStackParamList, 'ConversationAnalysis'>;

const HIGHLIGHT_TONE: Record<
  ConversationHighlight['kind'],
  { background: string; text: string }
> = {
  buying: { background: colors.successSoft, text: colors.success },
  concern: { background: colors.errorSoft, text: colors.error },
  question: { background: colors.warningSoft, text: colors.warning },
};

export const ConversationAnalysisScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { data: analysis, isLoading } = useConversationIntel(
    route.params.conversationId
  );
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={analysis?.customerName ?? t('ai.conversationIntel')}
        onBack={() => navigation.goBack()}
      />
      {isLoading || !analysis ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={80} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Icon
                name="sparkles-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.summaryTitle}>
                {t('conversationIntel.summary', {
                  defaultValue: 'AI Summary',
                })}
              </Text>
            </View>
            <Text style={styles.summaryBody}>{analysis.summary}</Text>
            <SentimentBadge sentiment={analysis.sentiment} />
          </View>

          <AIInsightsChart
            title={t('conversationIntel.sentiments')}
            data={analysis.sentimentTimeline.map((point) => ({
              x: point.time,
              y: Math.round(point.score * 100),
            }))}
            annotations={[
              {
                x: analysis.sentimentTimeline[analysis.sentimentTimeline.length - 1]?.time ?? '',
                note: `Latest sentiment: ${analysis.sentiment}`,
                tone: analysis.sentiment === 'positive' ? 'success' : analysis.sentiment === 'negative' ? 'critical' : 'info',
              },
            ]}
          />

          <View style={styles.intentsCard}>
            <Text style={styles.sectionTitle}>
              {t('conversationIntel.intents')}
            </Text>
            <View style={styles.intentsRow}>
              {analysis.intents.map((intent) => (
                <View key={intent} style={styles.intentChip}>
                  <Text style={styles.intentText}>
                    {t(`conversationIntel.${intent}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.transcriptCard}>
            <Text style={styles.sectionTitle}>
              {t('meetings.transcript')}
            </Text>
            {analysis.messages.map((message) => (
              <Pressable
                key={message.id}
                onPress={() =>
                  setExpandedMessage((prev) =>
                    prev === message.id ? null : message.id
                  )
                }
                style={styles.messageRow}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.speaker === 'customer'
                      ? styles.customerBubble
                      : styles.repBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageSpeaker,
                      {
                        color:
                          message.speaker === 'customer'
                            ? colors.primaryDark
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {message.speaker === 'customer'
                      ? t('quoteBuilder.customer')
                      : t('commissions.rep')}
                  </Text>
                  <Text style={styles.messageContent}>{message.content}</Text>
                </View>

                {expandedMessage === message.id && message.highlights
                  ? message.highlights.map((highlight, idx) => {
                      const tone = HIGHLIGHT_TONE[highlight.kind];
                      return (
                        <View
                          key={`${message.id}-h-${idx}`}
                          style={[
                            styles.highlightCard,
                            { backgroundColor: tone.background },
                          ]}
                        >
                          <Text
                            style={[styles.highlightText, { color: tone.text }]}
                          >
                            "{highlight.text}"
                          </Text>
                          <Text style={styles.highlightNote}>
                            {highlight.note}
                          </Text>
                        </View>
                      );
                    })
                  : null}
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.replyBtn}>
            <Icon name="chatbubble-ellipses" size={18} color={colors.textInverse} />
            <Text style={styles.replyText}>
              {analysis.suggestedAction.label}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  summaryTitle: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryBody: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  intentsCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  intentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  intentChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  intentText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  transcriptCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  messageRow: {
    rowGap: spacing.xs,
  },
  messageBubble: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    maxWidth: '85%',
  },
  repBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    maxWidth: '85%',
  },
  messageSpeaker: {
    ...textStyles.caption,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageContent: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  highlightCard: {
    padding: spacing.sm,
    borderRadius: radius.base,
    rowGap: 4,
  },
  highlightText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  highlightNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  replyText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
});

export default ConversationAnalysisScreen;
