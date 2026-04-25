/**
 * AITrustBadge — AI Trust Layer (AI Sprint 2 §5).
 *
 * Sits next to every AI-generated output. Shows a confidence chip
 * coloured by score (green ≥80, cyan ≥60, amber otherwise) plus an
 * "Explain" affordance that opens a modal listing the reason and
 * supporting signals so the user can verify the recommendation
 * before acting.
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';

export interface AITrustBadgeProps {
  confidence: number;
  reason?: string;
  signals?: string[];
  recommendedAction?: string;
  compact?: boolean;
}

const clampConfidence = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  if (value <= 1 && value >= 0) return Math.round(value * 100);
  return Math.max(0, Math.min(100, Math.round(value)));
};

const pickColor = (confidence: number): string => {
  if (confidence >= 80) return zyrixTheme.success;
  if (confidence >= 60) return zyrixTheme.primary;
  return zyrixTheme.warning;
};

export const AITrustBadge: React.FC<AITrustBadgeProps> = ({
  confidence,
  reason,
  signals = [],
  recommendedAction,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [showExplain, setShowExplain] = useState(false);

  const value = clampConfidence(confidence);
  const color = pickColor(value);

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { borderColor: color }]}>
        <Icon
          name="shield-checkmark"
          size={12}
          color={color}
          family="Ionicons"
        />
        <Text style={[styles.badgeText, { color }]}>
          {value}% {t('ai.confidence')}
        </Text>
      </View>

      {!compact && (reason || signals.length > 0 || recommendedAction) ? (
        <Pressable
          onPress={() => setShowExplain(true)}
          style={styles.explainBtn}
          accessibilityRole="button"
          accessibilityLabel={t('ai.explain')}
        >
          <Icon
            name="information-circle-outline"
            size={14}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
          <Text style={styles.explainText}>{t('ai.explain')}</Text>
        </Pressable>
      ) : null}

      <Modal
        visible={showExplain}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExplain(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowExplain(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('ai.howThisWasDecided')}</Text>
            {reason ? <Text style={styles.reasonText}>{reason}</Text> : null}
            {signals.length > 0 ? (
              <>
                <Text style={styles.signalsTitle}>
                  {t('ai.basedOnSignals')}:
                </Text>
                {signals.map((signal, idx) => (
                  <View key={`${idx}-${signal}`} style={styles.signalRow}>
                    <Icon
                      name="checkmark-circle"
                      size={14}
                      color={zyrixTheme.success}
                      family="Ionicons"
                    />
                    <Text style={styles.signalText}>{signal}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {recommendedAction ? (
              <View style={styles.action}>
                <Text style={styles.actionLabel}>
                  {t('ai.recommendedAction')}
                </Text>
                <Text style={styles.actionText}>{recommendedAction}</Text>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm + 2,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: zyrixRadius.base,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  explainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  explainText: {
    fontSize: 12,
    color: zyrixTheme.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,74,110,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: zyrixSpacing.lg,
  },
  modalCard: {
    backgroundColor: zyrixTheme.surface,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.lg,
    width: '100%',
    maxWidth: 360,
    rowGap: zyrixSpacing.sm + 2,
    ...zyrixShadows.modal,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  reasonText: {
    fontSize: 14,
    color: zyrixTheme.textBody,
    lineHeight: 20,
  },
  signalsTitle: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    marginTop: zyrixSpacing.sm,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm,
    paddingVertical: 4,
  },
  signalText: {
    fontSize: 13,
    color: zyrixTheme.textBody,
    flex: 1,
  },
  action: {
    marginTop: zyrixSpacing.sm + 4,
    padding: zyrixSpacing.sm + 4,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.base,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  actionText: {
    fontSize: 14,
    color: zyrixTheme.textBody,
    marginTop: 4,
  },
});

export default AITrustBadge;
