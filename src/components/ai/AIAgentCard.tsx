/**
 * AIAgentCard — single agent output rendered as an action card
 * (AI Sprint 4 §11.3).
 *
 * Spec: every agent output is shown as a distinct action card, NOT a
 * paragraph in a chat thread. Each card carries the same shape:
 *
 *   ┌────────────────────────────────────────────────┐
 *   │  [icon] AGENT NAME              [L#]           │
 *   │  Insight (bold)                                │
 *   │  Reason (muted)                                │
 *   │  Trust badge with confidence + signals         │
 *   │  Optional draft preview                        │
 *   │  [Approve]  [Edit]  [Dismiss]                  │
 *   └────────────────────────────────────────────────┘
 *
 * The card never auto-fires anything — Approve / Edit / Dismiss
 * callbacks are owned by the host screen (usually `AgentInboxScreen`).
 * Approve invokes the action handler; Edit opens an editable surface;
 * Dismiss tells the memory layer to suppress similar suggestions.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from './AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import type { AgentOutput, AgentRole } from '../../types/ai';

export interface AIAgentCardProps {
  output: AgentOutput;
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
  onDismiss: (id: string) => void;
}

const AGENT_ICONS: Record<AgentRole, AnyIconName> = {
  'sales-followup': 'chatbubble-ellipses-outline',
  'deal-risk': 'warning-outline',
  revenue: 'trending-up-outline',
  'customer-profile': 'person-outline',
  messaging: 'create-outline',
  onboarding: 'rocket-outline',
  integration: 'link-outline',
  task: 'checkbox-outline',
};

export const AIAgentCard: React.FC<AIAgentCardProps> = ({
  output,
  onApprove,
  onEdit,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const iconName: AnyIconName =
    AGENT_ICONS[output.agentRole] ?? ('sparkles-outline' as AnyIconName);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon
            name={iconName}
            size={18}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
        </View>
        <Text style={styles.agentName} numberOfLines={1}>
          {t(`agents.roles.${output.agentRole}`)}
        </Text>
        <View style={styles.permissionBadge}>
          <Text style={styles.permissionText}>L{output.permissionLevel}</Text>
        </View>
      </View>

      <Text style={styles.insight}>{output.insight}</Text>
      <Text style={styles.reason}>{output.reason}</Text>

      <AITrustBadge
        confidence={output.confidence}
        reason={output.reason}
        signals={output.signals}
        recommendedAction={output.recommendedAction}
      />

      {output.draftPayload ? (
        <View style={styles.draftBox}>
          <Text style={styles.draftLabel}>{t('agents.draft')}</Text>
          <Text style={styles.draftContent} numberOfLines={3}>
            {output.draftPayload.content}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onApprove(output.id)}
          style={[styles.actionBtn, styles.approveBtn]}
          accessibilityRole="button"
          accessibilityLabel={t('agents.approve')}
        >
          <LinearGradient
            colors={[zyrixTheme.primaryLight, zyrixTheme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Icon
              name="checkmark"
              size={14}
              color={zyrixTheme.textInverse}
              family="Ionicons"
            />
            <Text style={styles.approveText}>{t('agents.approve')}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => onEdit(output.id)}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={t('agents.edit')}
        >
          <Icon
            name="create-outline"
            size={14}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
          <Text style={styles.secondaryText}>{t('agents.edit')}</Text>
        </Pressable>

        <Pressable
          onPress={() => onDismiss(output.id)}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={t('agents.dismiss')}
        >
          <Icon
            name="close"
            size={14}
            color={zyrixTheme.textMuted}
            family="Ionicons"
          />
          <Text style={styles.dismissText}>{t('agents.dismiss')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.base,
    rowGap: 10,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
    ...zyrixShadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: zyrixTheme.aiSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: zyrixTheme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionBadge: {
    backgroundColor: zyrixTheme.aiSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 10,
    fontWeight: '700',
    color: zyrixTheme.primary,
  },
  insight: {
    fontSize: 16,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  reason: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 19,
  },
  draftBox: {
    backgroundColor: zyrixTheme.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: zyrixTheme.primary,
  },
  draftLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  draftContent: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    columnGap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: zyrixTheme.surfaceAlt,
  },
  approveBtn: {
    padding: 0,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
    paddingVertical: 10,
  },
  approveText: {
    color: zyrixTheme.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryText: {
    color: zyrixTheme.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dismissText: {
    color: zyrixTheme.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AIAgentCard;
