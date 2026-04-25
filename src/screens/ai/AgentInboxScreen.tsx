/**
 * AgentInboxScreen — AI Sprint 4 §11, Task 13.
 *
 * Lists every pending `AgentOutput` produced by the eight agents.
 * Sections:
 *   - Filter chips (All + one chip per agent role)
 *   - Empty state when no outputs match
 *   - List of `AIAgentCard`s sorted by confidence
 *
 * Pull-to-refresh re-runs `agentOrchestrator.runAll`. Approve / Edit /
 * Dismiss callbacks update both the local store and `aiMemoryService`
 * so the memory layer remembers what the user accepts vs. dismisses
 * (so similar suggestions are surfaced or suppressed next time).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppScreen } from '../../components/layout/AppScreen';
import { Header } from '../../components/common/Header';
import { AIAgentCard } from '../../components/ai/AIAgentCard';
import { Icon } from '../../components/common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { agentOrchestrator } from '../../services/agents/orchestrator';
import { agentDefinitions } from '../../services/agents/registry';
import { aiMemoryService } from '../../services/aiMemoryService';
import { useAiStore } from '../../store/aiStore';
import { useUserStore } from '../../store/userStore';
import type { AgentOutput, AgentRole } from '../../types/ai';

type FilterValue = 'all' | AgentRole;

const FILTERS: FilterValue[] = [
  'all',
  ...agentDefinitions.map((entry) => entry.role),
];

export const AgentInboxScreen: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const workspaceId = currentUser?.companyId ?? 'default-workspace';

  const pendingActions = useAiStore((s) => s.pendingAgentActions);
  const addPending = useAiStore((s) => s.addPendingAgentAction);
  const resolvePending = useAiStore((s) => s.resolvePendingAction);

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const outputs = await agentOrchestrator.runAll(workspaceId);
      outputs.forEach((output) => addPending(output));
    } catch (err) {
      console.warn('[AgentInboxScreen] orchestrator failed', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, addPending]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const filtered = useMemo(() => {
    if (filter === 'all') return pendingActions;
    return pendingActions.filter((output) => output.agentRole === filter);
  }, [filter, pendingActions]);

  const recordOutcome = useCallback(
    (output: AgentOutput, outcome: 'accepted' | 'ignored' | 'edited'): void => {
      void aiMemoryService.recordRecommendationOutcome({
        workspaceId,
        recommendationId: output.id,
        outcome,
      });
    },
    [workspaceId]
  );

  const handleApprove = useCallback(
    (id: string): void => {
      const output = pendingActions.find((a) => a.id === id);
      if (output) recordOutcome(output, 'accepted');
      resolvePending(id, 'approved');
    },
    [pendingActions, recordOutcome, resolvePending]
  );

  const handleEdit = useCallback(
    (id: string): void => {
      const output = pendingActions.find((a) => a.id === id);
      if (output) recordOutcome(output, 'edited');
      resolvePending(id, 'edited');
    },
    [pendingActions, recordOutcome, resolvePending]
  );

  const handleDismiss = useCallback(
    (id: string): void => {
      const output = pendingActions.find((a) => a.id === id);
      if (output) recordOutcome(output, 'ignored');
      resolvePending(id, 'dismissed');
    },
    [pendingActions, recordOutcome, resolvePending]
  );

  return (
    <AppScreen>
      <Header title={t('agents.inbox')} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((value) => {
          const isActive = filter === value;
          const count =
            value === 'all'
              ? pendingActions.length
              : pendingActions.filter((a) => a.agentRole === value).length;
          const label =
            value === 'all'
              ? t('agents.filters.all')
              : t(`agents.roles.${value}`);
          return (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {label} {count > 0 ? `(${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList<AgentOutput>
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadInbox}
            tintColor={zyrixTheme.primary}
          />
        }
        renderItem={({ item }) => (
          <AIAgentCard
            output={item}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onDismiss={handleDismiss}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Icon
                  name="sparkles-outline"
                  size={28}
                  color={zyrixTheme.primary}
                  family="Ionicons"
                />
              </View>
              <Text style={styles.emptyTitle}>{t('agents.empty.title')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('agents.empty.subtitle')}
              </Text>
            </View>
          )
        }
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: zyrixSpacing.base,
    paddingVertical: zyrixSpacing.sm,
    columnGap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: zyrixRadius.pill,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  filterChipActive: {
    backgroundColor: zyrixTheme.primary,
    borderColor: zyrixTheme.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: zyrixTheme.primary,
  },
  filterChipTextActive: {
    color: zyrixTheme.textInverse,
  },
  listContent: {
    paddingHorizontal: zyrixSpacing.base,
    paddingTop: zyrixSpacing.sm,
    paddingBottom: zyrixSpacing.xl,
    flexGrow: 1,
  },
  separator: {
    height: zyrixSpacing.sm + 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: zyrixSpacing.xxl,
    rowGap: zyrixSpacing.sm + 4,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: zyrixTheme.aiSurface,
    alignItems: 'center',
    justifyContent: 'center',
    ...zyrixShadows.aiGlow,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  emptySubtitle: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    textAlign: 'center',
    paddingHorizontal: zyrixSpacing.lg,
  },
});

export default AgentInboxScreen;
