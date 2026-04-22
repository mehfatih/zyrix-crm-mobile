/**
 * TerritoriesScreen — list / map toggle for sales territories.
 * The map view is a placeholder card that surfaces the same data
 * with a hint to enable `react-native-maps` at build time.
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

import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { MOCK_TERRITORIES } from '../../../api/mockData';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

type Mode = 'map' | 'list';

const PERFORMANCE_COLOR: Record<string, string> = {
  excellent: colors.success,
  on_track: colors.primary,
  at_risk: colors.error,
};

export const TerritoriesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('list');

  const onNewTerritory = (): void => {
    Alert.alert(
      t('territories.newTerritory'),
      t('placeholders.comingInSprint', { sprint: 5 })
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('navigation.territories')} />

      <View style={styles.toggleRow}>
        {(['map', 'list'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.toggleBtn,
              mode === m ? styles.toggleBtnActive : null,
            ]}
          >
            <Icon
              name={m === 'map' ? 'map-outline' : 'list-outline'}
              size={16}
              color={mode === m ? colors.textInverse : colors.primary}
            />
            <Text
              style={[
                styles.toggleText,
                mode === m ? styles.toggleTextActive : null,
              ]}
            >
              {t(m === 'map' ? 'territories.mapView' : 'territories.listView')}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {mode === 'map' ? (
          <View style={styles.mapCard}>
            <Icon name="map-outline" size={48} color={colors.primary} />
            <Text style={styles.mapTitle}>{t('territories.mapView')}</Text>
            <Text style={styles.mapBody}>
              {t('placeholders.comingInSprint', { sprint: 5 })}
            </Text>
          </View>
        ) : null}

        {MOCK_TERRITORIES.map((territory) => (
          <Pressable
            key={territory.id}
            onPress={() => Alert.alert(territory.name)}
            style={({ pressed }) => [
              styles.card,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{territory.name}</Text>
              <View
                style={[
                  styles.perfDot,
                  {
                    backgroundColor:
                      PERFORMANCE_COLOR[territory.performance] ?? colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.cardMeta}>
              {`${t('territories.assignedReps')}: ${territory.reps.join(', ')}`}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>
                  {t('territories.customerCount')}
                </Text>
                <Text style={styles.statValue}>{territory.customerCount}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>
                  {t('dashboard.revenue')}
                </Text>
                <CurrencyDisplay
                  amount={territory.revenue}
                  size="medium"
                  color={colors.primaryDark}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={onNewTerritory}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  toggleRow: {
    flexDirection: 'row',
    padding: spacing.base,
    columnGap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...textStyles.label,
    color: colors.primary,
    fontWeight: '700',
  },
  toggleTextActive: { color: colors.textInverse },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  mapCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  mapTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  mapBody: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  perfDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    columnGap: spacing.base,
  },
  statCol: { flex: 1, rowGap: 2 },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  statValue: {
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

export default TerritoriesScreen;
