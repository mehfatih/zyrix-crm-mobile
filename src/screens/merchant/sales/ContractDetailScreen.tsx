/**
 * ContractDetailScreen — main details, timeline, parties, collapsible
 * terms, signatures placeholder, and action buttons (renew, terminate,
 * download, duplicate, email).
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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AttachedFilesSection } from '../../../components/files/AttachedFilesSection';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { PDFPreview } from '../../../components/feature-specific/PDFPreview';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import {
  getContract,
  renewContract,
  terminateContract,
} from '../../../api/contracts';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useToast } from '../../../hooks/useToast';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'ContractDetail'>;

export const ContractDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const toast = useToast();
  const { formatDate } = useCountryConfig();
  const contractId = route.params.contractId;

  const { data: contract, isLoading, refetch } = useQuery({
    queryKey: ['contracts', 'detail', contractId],
    queryFn: () => getContract(contractId),
  });

  const renewMut = useMutation({
    mutationFn: () => renewContract(contractId),
    onSuccess: () => {
      toast.success(t('common.success'));
      void refetch();
    },
  });

  const terminateMut = useMutation({
    mutationFn: () => terminateContract(contractId),
    onSuccess: () => {
      toast.info(t('common.success'));
      void refetch();
    },
  });

  const [termsOpen, setTermsOpen] = useState(false);

  const confirmTerminate = (): void => {
    Alert.alert(
      t('contracts.terminate'),
      t('quoteBuilder.confirmDiscard'),
      [
        { text: t('common.cancel') },
        {
          text: t('contracts.terminate'),
          style: 'destructive',
          onPress: () => terminateMut.mutate(),
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={contract?.contractNumber ?? t('navigation.contracts')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading || !contract ? (
          <View style={{ padding: spacing.base }}>
            <SkeletonCard height={140} />
            <SkeletonCard height={120} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>
                {t(`contractStatus.${contract.status}`)}
              </Text>
              <CurrencyDisplay
                amount={contract.amount}
                size="large"
                color={darkColors.primaryDark}
              />
              <Text style={styles.heroMeta}>
                {`${t(`contractTypes.${contract.type}`)}`}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('common.welcome')}</Text>
              <InfoRow
                icon="person-outline"
                label={t('quoteBuilder.customer')}
                value={contract.customerName}
              />
              <InfoRow
                icon="briefcase-outline"
                label={t('customers.title')}
                value={t(`contractTypes.${contract.type}`)}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('contracts.dates')}</Text>
              <InfoRow
                icon="calendar-outline"
                label={t('deals.expectedClose')}
                value={formatDate(contract.startDate)}
              />
              <InfoRow
                icon="calendar-outline"
                label={t('deals.expectedClose')}
                value={formatDate(contract.endDate)}
              />
              <View style={styles.autoRenewRow}>
                <Icon
                  name={contract.autoRenew ? 'refresh' : 'close-circle-outline'}
                  size={16}
                  color={contract.autoRenew ? darkColors.success : darkColors.textMuted}
                />
                <Text style={styles.autoRenewText}>
                  {contract.autoRenew ? t('contracts.renew') : t('contracts.terminate')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setTermsOpen((o) => !o)}
              style={styles.card}
            >
              <View style={styles.termsHeader}>
                <Text style={styles.sectionTitle}>{t('contracts.template')}</Text>
                <Icon
                  name={termsOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={darkColors.textMuted}
                />
              </View>
              {termsOpen ? (
                <Text style={styles.termsBody}>
                  {t('placeholders.comingInSprint', { sprint: 6 })}
                </Text>
              ) : null}
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {t('placeholders.workInProgress')}
              </Text>
              <Text style={styles.signaturesHint}>
                {t('placeholders.comingInSprint', { sprint: 8 })}
              </Text>
            </View>

            <PDFPreview
              url={`https://api.crm.zyrix.co/generated/contract/${contract.id}.pdf`}
              fileName={`${contract.contractNumber}.pdf`}
              pageCount={3}
            />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => renewMut.mutate()}
                style={[styles.action, styles.actionPrimary]}
              >
                <Icon name="refresh" size={18} color={darkColors.textOnPrimary} />
                <Text style={[styles.actionText, { color: darkColors.textOnPrimary }]}>
                  {t('contracts.renew')}
                </Text>
              </Pressable>
              <Pressable onPress={confirmTerminate} style={styles.action}>
                <Icon name="stop-circle-outline" size={18} color={darkColors.error} />
                <Text style={[styles.actionText, { color: darkColors.error }]}>
                  {t('contracts.terminate')}
                </Text>
              </Pressable>
            </View>

            <AttachedFilesSection
              recordType="contract"
              recordId={contract.id}
              recordName={contract.contractNumber}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={18} color={darkColors.primary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  heroCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    rowGap: spacing.xs,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  heroLabel: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroMeta: { ...textStyles.caption, color: darkColors.textMuted },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoBody: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: darkColors.textMuted },
  infoValue: { ...textStyles.body, color: darkColors.textPrimary },
  autoRenewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    marginTop: spacing.xs,
  },
  autoRenewText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termsBody: { ...textStyles.body, color: darkColors.textMuted },
  signaturesHint: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    backgroundColor: darkColors.errorSoft,
  },
  actionPrimary: {
    backgroundColor: darkColors.primary,
  },
  actionText: {
    ...textStyles.button,
  },
});

export default ContractDetailScreen;
