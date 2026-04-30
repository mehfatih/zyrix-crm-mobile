/**
 * ConversationIntelScreen — list of AI-analyzed customer conversations
 * with sentiment, intent chips, and a "hot signals" highlight.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { SentimentBadge } from '../../../components/feature-specific/SentimentBadge';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { getPageAccent } from '../../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('aiAgents');
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useConversationList } from '../../../hooks/useAI';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import type {
  ConversationChannel,
  ConversationItem,
  SentimentLabel,
} from '../../../types/ai';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  MerchantAIStackParamList,
  'ConversationIntel'
>;

const CHANNEL_ICON: Record<ConversationChannel, AnyIconName> = {
  email: 'mail-outline',
  whatsapp: 'logo-whatsapp',
  call: 'call-outline',
  meeting: 'videocam-outline',
};

export const ConversationIntelScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { formatDate } = useCountryConfig();
  const conversationsQuery = useConversationList();

  const [channelFilter, setChannelFilter] = useState<ConversationChannel | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentLabel | 'all'>('all');

  const items = useMemo(() => {
    const raw = conversationsQuery.data ?? [];
    return raw.filter((item) => {
      if (channelFilter !== 'all' && item.channel !== channelFilter) return false;
      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false;
      return true;
    });
  }, [conversationsQuery.data, channelFilter, sentimentFilter]);

  const openDetail = (item: ConversationItem): void => {
    navigation.navigate('ConversationAnalysis', { conversationId: item.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('ai.conversationIntel')} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(
          [
            { key: 'all', icon: 'apps-outline', label: 'customers.title' },
            { key: 'whatsapp', icon: 'logo-whatsapp', label: 'conversationIntel.channels' },
            { key: 'email', icon: 'mail-outline', label: 'conversationIntel.channels' },
            { key: 'call', icon: 'call-outline', label: 'conversationIntel.channels' },
            { key: 'meeting', icon: 'videocam-outline', label: 'conversationIntel.channels' },
          ] as const
        ).map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setChannelFilter(chip.key as ConversationChannel | 'all')}
            style={[
              styles.chip,
              channelFilter === chip.key ? styles.chipActive : null,
            ]}
          >
            <Icon
              name={chip.icon as AnyIconName}
              size={14}
              color={
                channelFilter === chip.key ? darkColors.textOnPrimary : darkColors.primary
              }
            />
            <Text
              style={[
                styles.chipText,
                channelFilter === chip.key ? styles.chipTextActive : null,
              ]}
            >
              {chip.key}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sentimentRow}>
        {(
          [
            { key: 'all', label: 'customers.title' },
            { key: 'positive', label: 'sentiment.positive' },
            { key: 'neutral', label: 'sentiment.neutral' },
            { key: 'negative', label: 'sentiment.negative' },
          ] as const
        ).map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setSentimentFilter(chip.key as SentimentLabel | 'all')}
            style={[
              styles.sentimentChip,
              sentimentFilter === chip.key
                ? styles.sentimentChipActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.sentimentText,
                sentimentFilter === chip.key
                  ? { color: darkColors.primaryDark, fontWeight: '700' }
                  : null,
              ]}
            >
              {t(chip.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {conversationsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={110} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetail(item)}
              style={({ pressed }) => [
                styles.card,
                item.hot ? styles.cardHot : null,
                pressed ? { opacity: 0.9 } : null,
              ]}
            >
              {item.hot ? (
                <View style={styles.hotBadge}>
                  <Icon
                    name="flame-outline"
                    size={14}
                    color={darkColors.textOnPrimary}
                  />
                  <Text style={styles.hotBadgeText}>
                    {t('conversationIntel.hotSignals')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.customerInitials}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                <View style={styles.channelCircle}>
                  <Icon
                    name={CHANNEL_ICON[item.channel]}
                    size={18}
                    color={darkColors.primary}
                  />
                </View>
              </View>

              <Text style={styles.snippet} numberOfLines={2}>
                {item.snippet}
              </Text>

              <View style={styles.badgesRow}>
                <SentimentBadge
                  sentiment={item.sentiment}
                  confidence={item.sentimentConfidence}
                />
                {item.intents.map((intent) => (
                  <View key={intent} style={styles.intentChip}>
                    <Text style={styles.intentText}>
                      {t(`conversationIntel.${intent}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="chatbubbles-outline"
                size={48}
                color={darkColors.primary}
              />
              <Text style={styles.emptyTitle}>
                {t('ai.conversationIntel')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  filterRow: {
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.primary,
    backgroundColor: darkColors.surface,
  },
  chipActive: {
    backgroundColor: darkColors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: darkColors.textOnPrimary,
  },
  sentimentRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  sentimentChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: darkColors.surface,
  },
  sentimentChipActive: {
    backgroundColor: darkColors.primarySoft,
  },
  sentimentText: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  cardHot: {
    borderWidth: 2,
    borderColor: darkColors.primary,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: 4,
    backgroundColor: darkColors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  hotBadgeText: {
    ...textStyles.caption,
    color: darkColors.textOnPrimary,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: darkColors.primaryDark,
    fontWeight: '700',
  },
  cardBody: { flex: 1 },
  customerName: {
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
  },
  timestamp: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  channelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snippet: {
    ...textStyles.body,
    color: darkColors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  intentChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primarySoft,
  },
  intentText: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
});

export default ConversationIntelScreen;
