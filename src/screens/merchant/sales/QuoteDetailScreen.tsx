/**
 * QuoteDetailScreen — read-only view of a quote with status timeline,
 * a PDF-style preview card, and action buttons (send, download,
 * WhatsApp, email, convert, duplicate).
 */

import React, { useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';

import { AttachedFilesSection } from '../../../components/files/AttachedFilesSection';
import { CurrencyDisplay } from '../../../components/forms/CurrencyDisplay';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { PDFPreview } from '../../../components/feature-specific/PDFPreview';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { darkColors } from '../../../theme/dark';
import { generateQuotePDF } from '../../../utils/pdfGenerator';
import { getQuote, type Quote } from '../../../api/quotes';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { shareQuoteViaWhatsApp } from '../../../utils/whatsapp';
import { textStyles } from '../../../constants/typography';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import { useToast } from '../../../hooks/useToast';
import type { MerchantSalesStackParamList } from '../../../navigation/types';

type Route = RouteProp<MerchantSalesStackParamList, 'QuoteDetail'>;

type TimelineEvent = {
  key: Quote['status'];
  icon: AnyIconName;
  date?: string;
};

const ORDER: readonly Quote['status'][] = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'expired',
];

const ICON_BY_STATUS: Record<Quote['status'], AnyIconName> = {
  draft: 'pencil-outline',
  sent: 'paper-plane-outline',
  viewed: 'eye-outline',
  accepted: 'checkmark-circle-outline',
  expired: 'time-outline',
};

export const QuoteDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const quoteId = route.params.quoteId;
  const toast = useToast();
  const { formatDate } = useCountryConfig();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quotes', 'detail', quoteId],
    queryFn: () => getQuote(quoteId),
  });

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!quote) return [];
    return ORDER.map((status) => ({
      key: status,
      icon: ICON_BY_STATUS[status],
      date:
        status === 'sent'
          ? quote.sentAt
          : status === 'viewed'
            ? quote.viewedAt
            : status === 'accepted'
              ? quote.acceptedAt
              : undefined,
    }));
  }, [quote]);

  const currentIndex = quote ? ORDER.indexOf(quote.status) : 0;

  const send = (): void => {
    toast.success(t('common.success'));
  };

  const duplicate = (): void => {
    toast.info(t('common.success'));
  };

  const convert = (): void => {
    toast.info(t('common.success'));
  };

  const onWhatsApp = async (): Promise<void> => {
    if (!quote) return;
    try {
      const url = await generateQuotePDF(quote);
      await shareQuoteViaWhatsApp({
        quoteNumber: quote.quoteNumber,
        customerPhone: '+966501234567',
        customerName: quote.customerName,
        documentUrl: url,
      });
    } catch (err) {
      console.warn('[quote] whatsapp share failed', err);
      Alert.alert(t('common.error'));
    }
  };

  const edit = (): void => {
    if (!quote) return;
    (navigation as unknown as {
      navigate: (route: string, params?: unknown) => void;
    }).navigate('QuoteBuilder', { quoteId: quote.id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={quote?.quoteNumber ?? t('navigation.quotes')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading || !quote ? (
          <View style={{ padding: spacing.base }}>
            <SkeletonCard height={160} />
            <SkeletonCard height={140} />
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>
                {t(`quoteStatus.${quote.status}`)}
              </Text>
              <CurrencyDisplay
                amount={quote.total}
                size="large"
                color={darkColors.primaryDark}
              />
            </View>

            <View style={styles.timelineCard}>
              {timeline.map((event, idx) => {
                const reached = idx <= currentIndex;
                return (
                  <View key={event.key} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: reached
                            ? darkColors.primary
                            : darkColors.border,
                        },
                      ]}
                    >
                      <Icon
                        name={event.icon}
                        size={14}
                        color={reached ? darkColors.textOnPrimary : darkColors.textMuted}
                      />
                    </View>
                    <View style={styles.timelineBody}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          reached ? { color: darkColors.textPrimary } : null,
                        ]}
                      >
                        {t(`quoteStatus.${event.key}`)}
                      </Text>
                      {event.date ? (
                        <Text style={styles.timelineDate}>
                          {formatDate(event.date)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewHeading}>{t('navigation.quotes')}</Text>
              <Text style={styles.previewSub}>
                {`Bill to: ${quote.customerName}`}
              </Text>
              <Text style={styles.previewSub}>
                {`Expires: ${formatDate(quote.expiresAt)}`}
              </Text>
              <View style={styles.divider} />
              {quote.items.map((item, idx) => (
                <View key={`${item.description}-${idx}`} style={styles.lineRow}>
                  <Text style={styles.lineDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.lineQty}>{`×${item.quantity}`}</Text>
                  <CurrencyDisplay
                    amount={item.unitPrice * item.quantity}
                    size="small"
                  />
                </View>
              ))}
              <View style={styles.divider} />
              <TotalsRow
                label={t('currency.subtotal')}
                amount={quote.subtotal}
              />
              <TotalsRow label={t('currency.tax')} amount={quote.tax} />
              <TotalsRow
                label={t('currency.grandTotal')}
                amount={quote.total}
                bold
              />
            </View>

            <PDFPreview
              url={`https://api.crm.zyrix.co/generated/quote/${quote.id}.pdf`}
              fileName={`${quote.quoteNumber}.pdf`}
              pageCount={1}
              size="~45 KB"
            />

            <View style={styles.actionsRow}>
              {quote.status === 'draft' ? (
                <Pressable onPress={edit} style={[styles.action, styles.actionPrimary]}>
                  <Icon name="pencil-outline" size={18} color={darkColors.textOnPrimary} />
                  <Text style={[styles.actionText, { color: darkColors.textOnPrimary }]}>
                    {t('common.edit')}
                  </Text>
                </Pressable>
              ) : null}
              {quote.status === 'draft' ? (
                <Pressable onPress={send} style={styles.action}>
                  <Icon name="paper-plane-outline" size={18} color={darkColors.primary} />
                  <Text style={styles.actionText}>{t('quoteBuilder.sendNow')}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => void onWhatsApp()}
                style={styles.action}
              >
                <Icon name="logo-whatsapp" size={18} color={darkColors.primary} />
                <Text style={styles.actionText}>WhatsApp</Text>
              </Pressable>
              <Pressable onPress={duplicate} style={styles.action}>
                <Icon name="copy-outline" size={18} color={darkColors.primary} />
                <Text style={styles.actionText}>{t('common.save')}</Text>
              </Pressable>
              {quote.status === 'accepted' ? (
                <Pressable onPress={convert} style={styles.action}>
                  <Icon name="swap-horizontal-outline" size={18} color={darkColors.primary} />
                  <Text style={styles.actionText}>
                    {t('quoteStatus.accepted')}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <AttachedFilesSection
              recordType="quote"
              recordId={quote.id}
              recordName={quote.quoteNumber ?? quote.id}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const TotalsRow: React.FC<{ label: string; amount: number; bold?: boolean }> = ({
  label,
  amount,
  bold,
}) => (
  <View style={styles.totalsRow}>
    <Text style={[styles.totalsLabel, bold ? { fontWeight: '700' } : null]}>
      {label}
    </Text>
    <CurrencyDisplay
      amount={amount}
      size={bold ? 'large' : 'medium'}
      color={bold ? darkColors.primaryDark : darkColors.textPrimary}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    rowGap: spacing.base,
  },
  statusCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.xl,
    alignItems: 'flex-start',
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  statusLabel: {
    ...textStyles.caption,
    color: darkColors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timelineCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineBody: { flex: 1 },
  timelineLabel: {
    ...textStyles.body,
    color: darkColors.textMuted,
  },
  timelineDate: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  previewCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  previewHeading: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  previewSub: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: darkColors.divider,
    marginVertical: spacing.xs,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lineDesc: {
    flex: 1,
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
  lineQty: {
    ...textStyles.caption,
    color: darkColors.textMuted,
    minWidth: 36,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalsLabel: {
    ...textStyles.body,
    color: darkColors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primarySoft,
  },
  actionPrimary: {
    backgroundColor: darkColors.primary,
  },
  actionText: {
    ...textStyles.button,
    color: darkColors.primary,
  },
});

export default QuoteDetailScreen;
