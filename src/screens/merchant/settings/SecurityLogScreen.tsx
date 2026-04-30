/**
 * SecurityLogScreen — current user's security event timeline. Mock
 * data until the backend ships the per-user security log endpoint.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';

type EventKind =
  | 'login_success'
  | 'login_failure'
  | 'biometric_used'
  | 'permission_denied'
  | 'suspicious_activity';

interface Event {
  id: string;
  kind: EventKind;
  ip: string;
  device: string;
  at: string;
  detail?: string;
}

const EVENTS: readonly Event[] = [
  {
    id: 'ev_1',
    kind: 'login_success',
    ip: '212.118.45.12',
    device: 'iPhone 13 Pro',
    at: '2026-04-23T08:00:00Z',
  },
  {
    id: 'ev_2',
    kind: 'biometric_used',
    ip: '212.118.45.12',
    device: 'iPhone 13 Pro',
    at: '2026-04-22T09:14:00Z',
  },
  {
    id: 'ev_3',
    kind: 'permission_denied',
    ip: '37.123.55.21',
    device: 'Galaxy Tab S9',
    at: '2026-04-21T16:00:00Z',
    detail: 'Tried to delete a customer without privilege.',
  },
  {
    id: 'ev_4',
    kind: 'login_failure',
    ip: '85.140.23.99',
    device: 'Pixel 8',
    at: '2026-04-20T22:18:00Z',
    detail: 'Wrong password (3 attempts).',
  },
  {
    id: 'ev_5',
    kind: 'suspicious_activity',
    ip: '203.0.113.42',
    device: 'Unknown',
    at: '2026-04-19T03:47:00Z',
    detail: 'Login attempted from a new country.',
  },
];

const ICON: Record<
  EventKind,
  { name: AnyIconName; color: string; bg: string }
> = {
  login_success: {
    name: 'log-in-outline',
    color: darkColors.success,
    bg: darkColors.successSoft,
  },
  login_failure: {
    name: 'close-circle-outline',
    color: darkColors.error,
    bg: darkColors.errorSoft,
  },
  biometric_used: {
    name: 'finger-print-outline',
    color: darkColors.primary,
    bg: darkColors.primarySoft,
  },
  permission_denied: {
    name: 'shield-half-outline',
    color: darkColors.warning,
    bg: darkColors.warningSoft,
  },
  suspicious_activity: {
    name: 'alert-circle-outline',
    color: darkColors.error,
    bg: darkColors.errorSoft,
  },
};

export const SecurityLogScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { formatDate } = useCountryConfig();

  const [filter, setFilter] = useState<EventKind | 'all'>('all');

  const items = EVENTS.filter(
    (event) => filter === 'all' || event.kind === filter
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('securityLog.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(
          [
            'all',
            'login_success',
            'login_failure',
            'biometric_used',
            'permission_denied',
            'suspicious_activity',
          ] as (EventKind | 'all')[]
        ).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setFilter(entry)}
            style={[
              styles.chip,
              filter === entry ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                filter === entry ? { color: darkColors.textOnPrimary } : null,
              ]}
            >
              {entry === 'all' ? t('customers.title') : t(`securityLog.${entry}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((event) => {
          const icon = ICON[event.kind];
          return (
            <View key={event.id} style={styles.row}>
              <View
                style={[styles.iconCircle, { backgroundColor: icon.bg }]}
              >
                <Icon name={icon.name} size={18} color={icon.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kind, { color: icon.color }]}>
                  {t(`securityLog.${event.kind}`)}
                </Text>
                <Text style={styles.meta}>
                  {`${event.device} · ${event.ip}`}
                </Text>
                {event.detail ? (
                  <Text style={styles.detail}>{event.detail}</Text>
                ) : null}
              </View>
              <Text style={styles.timestamp}>{formatDate(event.at)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  filterRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    columnGap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  chipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kind: { ...textStyles.bodyMedium, fontWeight: '700' },
  meta: { ...textStyles.caption, color: darkColors.textMuted },
  detail: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
});

export default SecurityLogScreen;
