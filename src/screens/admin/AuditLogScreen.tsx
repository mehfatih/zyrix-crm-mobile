/**
 * AuditLogScreen — paginated platform audit log with severity + action
 * filters and a CSV/JSON export affordance.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuditLog } from '../../hooks/useAdmin';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { AuditSeverity } from '../../types/admin';

type SeverityFilter = AuditSeverity | 'all';

const SEVERITY_TONE: Record<
  AuditSeverity,
  { background: string; color: string; icon: AnyIconName }
> = {
  info: {
    background: colors.primarySoft,
    color: colors.primary,
    icon: 'information-circle-outline',
  },
  warning: {
    background: colors.warningSoft,
    color: colors.warning,
    icon: 'warning-outline',
  },
  critical: {
    background: colors.errorSoft,
    color: colors.error,
    icon: 'alert-circle-outline',
  },
};

export const AuditLogScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { formatDate } = useCountryConfig();

  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filters = useMemo(
    () => (severity === 'all' ? undefined : { severity }),
    [severity]
  );
  const auditQuery = useAuditLog({ filters, pageSize: 100 });

  const items = auditQuery.data?.items ?? [];

  const exportLog = (format: 'csv' | 'json'): void => {
    Alert.alert(format.toUpperCase(), t('auditLogAdmin.exportCSV'));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('auditLogAdmin.title')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
        rightSlot={
          <Pressable
            onPress={() => exportLog('csv')}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="download-outline" size={20} color={colors.textInverse} />
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(['all', 'info', 'warning', 'critical'] as SeverityFilter[]).map(
          (entry) => (
            <Pressable
              key={entry}
              onPress={() => setSeverity(entry)}
              style={[
                styles.chip,
                severity === entry ? styles.chipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  severity === entry ? { color: colors.textInverse } : null,
                ]}
              >
                {entry === 'all'
                  ? t('customers.title')
                  : t(`auditLogAdmin.${entry}`)}
              </Text>
            </Pressable>
          )
        )}
      </ScrollView>

      <View style={styles.exportRow}>
        <Pressable
          onPress={() => exportLog('csv')}
          style={styles.exportBtn}
        >
          <Icon name="document-outline" size={14} color={colors.primary} />
          <Text style={styles.exportText}>
            {t('auditLogAdmin.exportCSV')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => exportLog('json')}
          style={styles.exportBtn}
        >
          <Icon name="code-outline" size={14} color={colors.primary} />
          <Text style={styles.exportText}>
            {t('auditLogAdmin.exportJSON')}
          </Text>
        </Pressable>
      </View>

      {auditQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} height={88} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const tone = SEVERITY_TONE[item.severity];
            const isOpen = expanded === item.id;
            return (
              <Pressable
                onPress={() => setExpanded(isOpen ? null : item.id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.rowHeader}>
                  <View
                    style={[
                      styles.severityIcon,
                      { backgroundColor: tone.background },
                    ]}
                  >
                    <Icon name={tone.icon} size={16} color={tone.color} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowAction}>{item.action}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {`${item.userName} · ${item.companyName ?? '—'} · ${item.ipAddress}`}
                    </Text>
                  </View>
                  <Text style={styles.rowDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                {isOpen ? (
                  <View style={styles.expanded}>
                    <Text style={styles.expandedKey}>resource</Text>
                    <Text style={styles.expandedValue}>
                      {`${item.resource}${item.resourceId ? ` (${item.resourceId})` : ''}`}
                    </Text>
                    {item.metadata ? (
                      <>
                        <Text style={styles.expandedKey}>metadata</Text>
                        <Text style={styles.expandedValue}>
                          {JSON.stringify(item.metadata, null, 2)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon
                name="document-text-outline"
                size={40}
                color={colors.primary}
              />
              <Text style={styles.emptyTitle}>{t('auditLogAdmin.title')}</Text>
            </View>
          }
        />
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
  filterRow: {
    paddingHorizontal: spacing.base,
    columnGap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  exportRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  exportText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.sm,
  },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  severityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowAction: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
  rowMeta: { ...textStyles.caption, color: colors.textMuted },
  rowDate: { ...textStyles.caption, color: colors.textMuted },
  expanded: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.base,
    rowGap: spacing.xs,
  },
  expandedKey: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expandedValue: {
    ...textStyles.caption,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary },
});

export default AuditLogScreen;
