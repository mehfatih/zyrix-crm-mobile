/**
 * ComplianceExportScreen — list of GDPR/CCPA/PDPL data export requests
 * with a "new request" affordance.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import {
  SearchableDropdown,
  type DropdownItem,
} from '../../components/forms/SearchableDropdown';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { listCustomers } from '../../api/customers';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useComplianceExports, useCreateComplianceExport } from '../../hooks/useAdmin';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import { useQuery } from '@tanstack/react-query';
import type {
  ComplianceExport,
  ComplianceExportStatus,
  ComplianceExportType,
} from '../../types/admin';

const TYPES: readonly ComplianceExportType[] = ['gdpr', 'ccpa', 'pdpl'];
const URGENCIES: readonly ('standard' | 'rush')[] = ['standard', 'rush'];

const STATUS_TONE: Record<
  ComplianceExportStatus,
  { background: string; color: string }
> = {
  pending: { background: colors.warningSoft, color: colors.warning },
  processing: { background: colors.infoSoft, color: colors.info },
  ready: { background: colors.successSoft, color: colors.success },
  downloaded: { background: colors.surfaceAlt, color: colors.textMuted },
  expired: { background: colors.errorSoft, color: colors.error },
};

export const ComplianceExportScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { formatDate } = useCountryConfig();

  const exportsQuery = useComplianceExports();
  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 200 }),
  });
  const createMut = useCreateComplianceExport();

  const customerOptions = useMemo<DropdownItem[]>(
    () =>
      (customersQuery.data?.items ?? []).map((entry) => ({
        id: entry.id,
        label: entry.name,
        subtitle: entry.email,
      })),
    [customersQuery.data]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [customer, setCustomer] = useState<DropdownItem | null>(null);
  const [type, setType] = useState<ComplianceExportType>('pdpl');
  const [urgency, setUrgency] = useState<'standard' | 'rush'>('standard');

  const summary = useMemo(() => {
    const items = exportsQuery.data ?? [];
    const month = items.filter((entry) => entry.requestedAt.startsWith('2026-04'));
    const fulfilled = items.filter((entry) => entry.status === 'ready' && entry.readyAt);
    const avg = fulfilled.length
      ? Math.round(
          fulfilled.reduce(
            (sum, entry) =>
              sum +
              (new Date(entry.readyAt as string).getTime() -
                new Date(entry.requestedAt).getTime()) /
                3_600_000,
            0
          ) / fulfilled.length
        )
      : 0;
    return {
      monthCount: month.length,
      averageHours: avg,
      pendingCount: items.filter((entry) => entry.status !== 'ready').length,
    };
  }, [exportsQuery.data]);

  const submit = async (): Promise<void> => {
    if (!customer) {
      Alert.alert(t('forms.required'), t('quoteBuilder.customer'));
      return;
    }
    try {
      await createMut.mutateAsync({
        customerId: customer.id,
        type,
        urgency,
      });
      setModalOpen(false);
      setCustomer(null);
    } catch (err) {
      console.warn('[compliance] create failed', err);
    }
  };

  const open = (entry: ComplianceExport): void => {
    if (entry.downloadUrl) Linking.openURL(entry.downloadUrl);
    else Alert.alert(t('common.continue'), entry.status);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('complianceAdmin.title')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.statsRow}>
        <Stat label="Requests / month" value={String(summary.monthCount)} />
        <Stat label="Avg fulfilment (h)" value={String(summary.averageHours)} />
        <Stat label="Pending" value={String(summary.pendingCount)} tone={colors.warning} />
      </View>

      {exportsQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} height={104} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(exportsQuery.data ?? []).map((entry) => {
            const tone = STATUS_TONE[entry.status];
            return (
              <Pressable
                key={entry.id}
                onPress={() => open(entry)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardCustomer}>
                    {entry.customerName}
                  </Text>
                  <View
                    style={[styles.statusPill, { backgroundColor: tone.background }]}
                  >
                    <Text style={[styles.statusText, { color: tone.color }]}>
                      {entry.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {`${entry.companyName} · ${entry.type.toUpperCase()} · ${entry.urgency}`}
                </Text>
                <Text style={styles.cardMeta}>
                  {`Requested: ${formatDate(entry.requestedAt)}`}
                </Text>
                {entry.readyAt ? (
                  <Text style={styles.cardMeta}>
                    {`Ready: ${formatDate(entry.readyAt)}`}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={26} color={colors.textInverse} />
      </Pressable>

      <Modal
        transparent
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {t('complianceAdmin.newRequest')}
            </Text>
            <SearchableDropdown
              items={customerOptions}
              value={customer}
              onChange={setCustomer}
              label={t('quoteBuilder.customer')}
              placeholder={t('customers.searchCustomers')}
            />
            <Text style={styles.fieldLabel}>{t('complianceAdmin.type')}</Text>
            <View style={styles.row}>
              {TYPES.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setType(entry)}
                  style={[
                    styles.chip,
                    type === entry ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      type === entry ? { color: colors.textInverse } : null,
                    ]}
                  >
                    {entry.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>{t('complianceAdmin.urgency')}</Text>
            <View style={styles.row}>
              {URGENCIES.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setUrgency(entry)}
                  style={[
                    styles.chip,
                    urgency === entry ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      urgency === entry ? { color: colors.textInverse } : null,
                    ]}
                  >
                    {entry}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actionsRow}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalOpen(false)}
              />
              <Button
                label={t('common.save')}
                onPress={() => void submit()}
                loading={createMut.isPending}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone,
}) => (
  <View style={[styles.stat, tone ? { borderLeftColor: tone } : null]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    rowGap: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.xs,
  },
  statLabel: { ...textStyles.caption, color: colors.textMuted },
  statValue: {
    ...textStyles.h3,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  list: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxxl * 2,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCustomer: { ...textStyles.bodyMedium, color: colors.textPrimary },
  cardMeta: { ...textStyles.caption, color: colors.textMuted },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalTitle: { ...textStyles.h3, color: colors.textPrimary },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default ComplianceExportScreen;
