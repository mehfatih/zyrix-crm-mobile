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
import { darkColors } from '../../../theme/dark';
import { getPageAccent } from '../../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('aiAgents');
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
            <Icon name="share-outline" size={22} color={darkColors.textOnPrimary} />
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
                    tab === entry.key ? { color: darkColors.textOnPrimary } : null,
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
                            color={darkColors.textOnPrimary}
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
                                  color: darkColors.textMuted,
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
                      color={darkColors.primary}
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
                color={darkColors.primary}
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
  safe: { flex: 1, backgroundColor: darkColors.background },
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
    backgroundColor: darkColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  infoText: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  attendeesRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: darkColors.surface,
    marginLeft: -8,
  },
  avatarText: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
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
    borderColor: darkColors.primary,
  },
  tabActive: { backgroundColor: darkColors.primary },
  tabText: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  summaryText: {
    ...textStyles.body,
    color: darkColors.textSecondary,
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
    backgroundColor: darkColors.primarySoft,
  },
  topicText: {
    ...textStyles.caption,
    color: darkColors.primaryDark,
    fontWeight: '600',
  },
  transcriptRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
    rowGap: 4,
  },
  speaker: {
    ...textStyles.label,
    color: darkColors.primary,
    fontWeight: '700',
  },
  lineContent: {
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
  lineTime: {
    ...textStyles.caption,
    color: darkColors.textMuted,
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
    borderColor: darkColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  actionBody: { flex: 1 },
  actionText: {
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
  actionMeta: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  decisionRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  decisionBody: { flex: 1 },
  decisionText: {
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
  decisionContext: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primarySoft,
  },
  downloadText: {
    ...textStyles.button,
    color: darkColors.primary,
  },
});

export default MeetingDetailScreen;
