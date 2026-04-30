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
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

type Mode = 'map' | 'list';

const PERFORMANCE_COLOR: Record<string, string> = {
  excellent: darkColors.success,
  on_track: darkColors.primary,
  at_risk: darkColors.error,
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
              color={mode === m ? darkColors.textOnPrimary : darkColors.primary}
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
            <Icon name="map-outline" size={48} color={darkColors.primary} />
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
                      PERFORMANCE_COLOR[territory.performance] ?? darkColors.primary,
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
                  color={darkColors.primaryDark}
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
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
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
    backgroundColor: darkColors.surface,
    borderWidth: 1.5,
    borderColor: darkColors.primary,
  },
  toggleBtnActive: {
    backgroundColor: darkColors.primary,
  },
  toggleText: {
    ...textStyles.label,
    color: darkColors.primary,
    fontWeight: '700',
  },
  toggleTextActive: { color: darkColors.textOnPrimary },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  mapCard: {
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  mapTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  mapBody: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: darkColors.surface,
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
    color: darkColors.textPrimary,
  },
  perfDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardMeta: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    columnGap: spacing.base,
  },
  statCol: { flex: 1, rowGap: 2 },
  statLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  statValue: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
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

export default TerritoriesScreen;
