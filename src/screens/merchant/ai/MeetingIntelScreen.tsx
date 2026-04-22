/**
 * MeetingIntelScreen — list of AI-analyzed meetings with upcoming /
 * recent tabs and a FAB for uploading recordings.
 */

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
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
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useMeetingList } from '../../../hooks/useAI';
import type {
  LiveMeetingListItem,
  MeetingSource,
} from '../../../types/ai';
import type { MerchantAIStackParamList } from '../../../navigation/types';

type Tab = 'upcoming' | 'recent' | 'all';

type Navigation = NativeStackNavigationProp<
  MerchantAIStackParamList,
  'MeetingIntel'
>;

const SOURCE_ICON: Record<MeetingSource, AnyIconName> = {
  google_meet: 'videocam-outline',
  zoom: 'videocam-outline',
  teams: 'videocam-outline',
  upload: 'cloud-upload-outline',
};

export const MeetingIntelScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { formatDate } = useCountryConfig();
  const meetingsQuery = useMeetingList();
  const [tab, setTab] = useState<Tab>('recent');

  const items = useMemo(() => {
    const raw = meetingsQuery.data ?? [];
    if (tab === 'all') return raw;
    return raw.filter((meeting) => meeting.bucket === tab);
  }, [meetingsQuery.data, tab]);

  const openDetail = (meeting: LiveMeetingListItem): void => {
    navigation.navigate('MeetingDetail', { meetingId: meeting.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('ai.meetingIntel')} showBack={false} />

      <View style={styles.tabs}>
        {(['upcoming', 'recent', 'all'] as Tab[]).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setTab(entry)}
            style={[
              styles.tab,
              tab === entry ? styles.tabActive : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === entry ? { color: colors.textInverse } : null,
              ]}
            >
              {t(`meetings.${entry === 'all' ? 'recent' : entry}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {meetingsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} height={130} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(meeting) => meeting.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetail(item)}
              style={({ pressed }) => [
                styles.card,
                pressed ? { opacity: 0.9 } : null,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.sourceIcon}>
                  <Icon
                    name={SOURCE_ICON[item.source]}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.dateLine}>
                {`${formatDate(item.startsAt)} · ${item.durationMinutes} min`}
              </Text>
              <Text style={styles.summary} numberOfLines={2}>
                {item.summaryPreview}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.avatars}>
                  {item.attendees.slice(0, 3).map((attendee) => (
                    <View key={attendee.id} style={styles.avatar}>
                      <Text style={styles.avatarText}>{attendee.initials}</Text>
                    </View>
                  ))}
                </View>
                {item.actionItemsCount > 0 ? (
                  <View style={styles.actionsBadge}>
                    <Icon
                      name="checkmark-done-outline"
                      size={14}
                      color={colors.primaryDark}
                    />
                    <Text style={styles.actionsText}>
                      {`${item.actionItemsCount} ${t('meetings.actionItems')}`}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="videocam-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyTitle}>
                {t('meetings.upcoming')}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('UploadMeeting')}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="cloud-upload-outline" size={24} color={colors.textInverse} />
      </Pressable>
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
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
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
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  dateLine: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  summary: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  avatars: {
    flexDirection: 'row',
    columnGap: -10,
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
  actionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  actionsText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default MeetingIntelScreen;
