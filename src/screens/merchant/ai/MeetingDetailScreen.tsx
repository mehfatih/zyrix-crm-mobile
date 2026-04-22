/**
 * MeetingDetailScreen — tabs for Summary, Transcript, Action Items,
 * and Key Decisions. Wires up action-item completion locally so the
 * merchant can check items off immediately; the backend sync lands
 * when the action-items API ships.
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { SentimentBadge } from '../../../components/feature-specific/SentimentBadge';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useMeetingIntel } from '../../../hooks/useAI';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantAIStackParamList, 'MeetingDetail'>;
type Tab = 'summary' | 'transcript' | 'actionItems' | 'keyDecisions';

export const MeetingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { formatDate } = useCountryConfig();
  const { data: meeting, isLoading } = useMeetingIntel(route.params.meetingId);

  const [tab, setTab] = useState<Tab>('summary');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleItem = (id: string): void => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={meeting?.title ?? t('ai.meetingIntel')}
        onBack={() => navigation.goBack()}
        rightSlot={
          <Pressable
            onPress={() => Alert.alert(t('meetings.shareSummary'))}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="share-outline" size={22} color={colors.textInverse} />
          </Pressable>
        }
      />

      {isLoading || !meeting ? (
        <View style={{ padding: spacing.base }}>
          <SkeletonCard height={160} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <>
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {`${formatDate(meeting.startsAt)} · ${meeting.durationMinutes} min`}
            </Text>
            <View style={styles.attendeesRow}>
              {meeting.attendees.slice(0, 4).map((attendee) => (
                <View key={attendee.id} style={styles.avatar}>
                  <Text style={styles.avatarText}>{attendee.initials}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {(
              [
                { key: 'summary', label: 'meetings.summary' },
                { key: 'transcript', label: 'meetings.transcript' },
                { key: 'actionItems', label: 'meetings.actionItems' },
                { key: 'keyDecisions', label: 'meetings.keyDecisions' },
              ] as const
            ).map((entry) => (
              <Pressable
                key={entry.key}
                onPress={() => setTab(entry.key as Tab)}
                style={[
                  styles.tab,
                  tab === entry.key ? styles.tabActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === entry.key ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(entry.label)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.scroll}>
            {tab === 'summary' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t('meetings.summary')}
                </Text>
                <Text style={styles.summaryText}>{meeting.summary}</Text>
                <View style={styles.chipsRow}>
                  {meeting.topics.map((topic) => (
                    <View key={topic} style={styles.topicChip}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
                <SentimentBadge sentiment={meeting.overallSentiment} />
              </View>
            ) : null}

            {tab === 'transcript' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t('meetings.transcript')}
                </Text>
                {meeting.transcript.map((line, idx) => (
                  <View key={`${line.speaker}-${idx}`} style={styles.transcriptRow}>
                    <Text style={styles.speaker}>{line.speaker}</Text>
                    <Text style={styles.lineContent}>{line.content}</Text>
                    <Text style={styles.lineTime}>{line.at}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {tab === 'actionItems' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t('meetings.actionItems')}
                </Text>
                {meeting.actionItems.map((item) => {
                  const done = completedItems[item.id] ?? item.done;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      style={styles.actionRow}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          done ? styles.checkboxDone : null,
                        ]}
                      >
                        {done ? (
                          <Icon
                            name="checkmark"
                            size={12}
                            color={colors.textInverse}
                          />
                        ) : null}
                      </View>
                      <View style={styles.actionBody}>
                        <Text
                          style={[
                            styles.actionText,
                            done
                              ? {
                                  textDecorationLine: 'line-through',
                                  color: colors.textMuted,
                                }
                              : null,
                          ]}
                        >
                          {item.text}
                        </Text>
                        <Text style={styles.actionMeta}>
                          {[item.assignee, item.dueDate ? formatDate(item.dueDate) : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {tab === 'keyDecisions' ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {t('meetings.keyDecisions')}
                </Text>
                {meeting.decisions.map((decision) => (
                  <View key={decision.id} style={styles.decisionRow}>
                    <Icon
                      name="flag-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <View style={styles.decisionBody}>
                      <Text style={styles.decisionText}>{decision.text}</Text>
                      <Text style={styles.decisionContext}>
                        {decision.context}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() => Alert.alert(t('meetings.downloadTranscript'))}
              style={({ pressed }) => [
                styles.downloadBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Icon
                name="download-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.downloadText}>
                {t('meetings.downloadTranscript')}
              </Text>
            </Pressable>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  attendeesRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    marginLeft: -8,
  },
  avatarText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 10,
  },
  tabs: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    columnGap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  summaryText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  topicChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  topicText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  transcriptRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    rowGap: 4,
  },
  speaker: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  lineContent: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  lineTime: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBody: { flex: 1 },
  actionText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  actionMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  decisionRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  decisionBody: { flex: 1 },
  decisionText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  decisionContext: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  downloadText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default MeetingDetailScreen;
