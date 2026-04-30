/**
 * AutomationScreen — workflows with toggle switches and usage stats.
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { MOCK_AUTOMATIONS } from '../../../api/mockData';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

interface WorkflowState {
  id: string;
  enabled: boolean;
}

export const AutomationScreen: React.FC = () => {
  const { t } = useTranslation();
  const [states, setStates] = useState<WorkflowState[]>(
    MOCK_AUTOMATIONS.map((w) => ({ id: w.id, enabled: w.enabled }))
  );

  const isEnabled = (id: string): boolean =>
    states.find((s) => s.id === id)?.enabled ?? false;

  const toggle = (id: string): void => {
    setStates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const onNew = (): void => {
    Alert.alert(
      t('growth.automation'),
      t('placeholders.comingInSprint', { sprint: 5 })
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('growth.automation')} showBack={false} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {MOCK_AUTOMATIONS.map((w) => {
          const enabled = isEnabled(w.id);
          return (
            <View key={w.id} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.nameCol}>
                  <Text style={styles.name}>{w.name}</Text>
                  <Text style={styles.trigger}>{w.trigger}</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => toggle(w.id)}
                  trackColor={{ false: darkColors.border, true: darkColors.primary }}
                  thumbColor={darkColors.white}
                />
              </View>

              <View style={styles.statsRow}>
                <StatCell label={t('automation.triggers')} value={w.totalTriggers} />
                <StatCell label={t('automation.emailsSent')} value={w.emailsSent} />
                <StatCell label={t('automation.conversions')} value={w.conversions} />
              </View>

              <Text style={styles.actionsLabel}>
                {`${w.actionsCount} ${t('automation.actions')}`}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onNew}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const StatCell: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <View style={styles.statCell}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  nameCol: { flex: 1 },
  name: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  trigger: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
    paddingTop: spacing.sm,
  },
  statCell: {
    flex: 1,
    rowGap: 2,
  },
  statLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statValue: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  actionsLabel: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default AutomationScreen;
