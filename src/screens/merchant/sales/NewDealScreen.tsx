/**
 * NewDealScreen — single-scroll deal creation form. Probability
 * auto-suggests when the stage changes so merchants don't have to
 * think about it for standard pipelines.
 */

import React, { useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/forms/DatePicker';
import { Header } from '../../../components/common/Header';
import { Input } from '../../../components/common/Input';
import { LocalizedCurrencyInput } from '../../../components/common/LocalizedCurrencyInput';
import { SearchableDropdown, type DropdownItem } from '../../../components/forms/SearchableDropdown';
import { TagsInput } from '../../../components/forms/TagsInput';
import { darkColors } from '../../../theme/dark';
import {
  DEAL_PIPELINE,
  type DealStage,
} from '../../../api/deals';
import { listCustomers } from '../../../api/customers';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useCreateDeal } from '../../../hooks/useDeals';
import { useToast } from '../../../hooks/useToast';

type Source = 'website' | 'referral' | 'coldCall' | 'email' | 'social' | 'other';

const STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 15,
  qualified: 40,
  proposal: 60,
  negotiation: 80,
  won: 100,
  lost: 0,
};

const SOURCES: readonly Source[] = [
  'website',
  'referral',
  'coldCall',
  'email',
  'social',
  'other',
];

export const NewDealScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const createMut = useCreateDeal();

  const customersQuery = useQuery({
    queryKey: ['customers', 'picker'],
    queryFn: () => listCustomers({ pageSize: 100 }),
  });

  const customerOptions = useMemo<DropdownItem[]>(
    () =>
      (customersQuery.data?.items ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: c.email,
      })),
    [customersQuery.data]
  );

  const [customer, setCustomer] = useState<DropdownItem | null>(null);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [probability, setProbability] = useState(STAGE_PROBABILITY.lead);
  const [closeDate, setCloseDate] = useState<Date | null>(null);
  const [source, setSource] = useState<Source>('website');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const changeStage = (next: DealStage): void => {
    setStage(next);
    setProbability(STAGE_PROBABILITY[next]);
  };

  const canSubmit =
    customer !== null &&
    title.trim().length >= 2 &&
    Number(value.replace(/,/g, '')) > 0;

  const onSave = async (): Promise<void> => {
    if (!customer) return;
    try {
      const numericValue = Number(value.replace(/,/g, '')) || 0;
      await createMut.mutateAsync({
        title,
        customerId: customer.id,
        customerName: customer.label,
        value: numericValue,
        stage,
        probability,
        expectedCloseDate: (closeDate ?? new Date()).toISOString().slice(0, 10),
        assignedTo: 'rep_self',
        assignedToName: 'You',
        notes: notes || undefined,
      });
      toast.success(t('deals.newDeal'));
      navigation.goBack();
    } catch (err) {
      console.warn('[newDeal] failed', err);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('deals.newDeal')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <SearchableDropdown
            items={customerOptions}
            value={customer}
            onChange={setCustomer}
            label={t('quoteBuilder.customer')}
          />
          <Input
            label={t('deals.title')}
            value={title}
            onChangeText={setTitle}
            required
          />
          <LocalizedCurrencyInput
            label={t('currency.amount')}
            value={value}
            onChangeText={setValue}
          />
          <Text style={styles.fieldLabel}>{t('deals.stage')}</Text>
          <View style={styles.stageRow}>
            {DEAL_PIPELINE.concat('lost' as DealStage).map((key) => (
              <Pressable
                key={key}
                onPress={() => changeStage(key)}
                style={[
                  styles.stageChip,
                  stage === key ? styles.stageChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.stageText,
                    stage === key ? styles.stageTextActive : null,
                  ]}
                >
                  {t(`stages.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('deals.probability')}</Text>
          <View style={styles.probabilityCard}>
            <View style={styles.probabilityTrack}>
              <View
                style={[
                  styles.probabilityFill,
                  { width: `${Math.max(probability, 4)}%` },
                ]}
              />
            </View>
            <Text style={styles.probabilityValue}>{`${probability}%`}</Text>
          </View>
          <View style={styles.probabilityButtons}>
            {[15, 40, 60, 80, 100].map((p) => (
              <Pressable
                key={p}
                onPress={() => setProbability(p)}
                style={[
                  styles.probBtn,
                  probability === p ? styles.probBtnActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.probBtnText,
                    probability === p
                      ? { color: darkColors.textOnPrimary, fontWeight: '700' }
                      : null,
                  ]}
                >
                  {`${p}%`}
                </Text>
              </Pressable>
            ))}
          </View>

          <DatePicker
            label={t('deals.expectedClose')}
            value={closeDate}
            onChange={setCloseDate}
          />

          <Text style={styles.fieldLabel}>{t('customers.tags')}</Text>
          <View style={styles.sourceRow}>
            {SOURCES.map((key) => (
              <Pressable
                key={key}
                onPress={() => setSource(key)}
                style={[
                  styles.sourceChip,
                  source === key ? styles.sourceChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.sourceText,
                    source === key ? { color: darkColors.textOnPrimary } : null,
                  ]}
                >
                  {t(`dealSources.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <TagsInput
            label={t('customers.tags')}
            value={tags}
            onChange={setTags}
          />

          <Text style={styles.fieldLabel}>
            {t('quoteBuilder.internalNotes')}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={t('quoteBuilder.internalNotes')}
            placeholderTextColor={darkColors.textMuted}
            style={[
              styles.textarea,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('deals.newDeal')}
          onPress={() => void onSave()}
          loading={createMut.isPending}
          disabled={!canSubmit}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: darkColors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldLabel: {
    ...textStyles.label,
    color: darkColors.textSecondary,
  },
  stageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stageChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  stageChipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  stageText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  stageTextActive: { color: darkColors.textOnPrimary },
  probabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  probabilityTrack: {
    flex: 1,
    height: 8,
    backgroundColor: darkColors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: 8,
    backgroundColor: darkColors.primary,
  },
  probabilityValue: {
    ...textStyles.bodyMedium,
    color: darkColors.primaryDark,
    minWidth: 48,
    textAlign: 'right',
  },
  probabilityButtons: {
    flexDirection: 'row',
    columnGap: spacing.xs,
  },
  probBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.base,
    backgroundColor: darkColors.surfaceAlt,
    alignItems: 'center',
  },
  probBtnActive: { backgroundColor: darkColors.primary },
  probBtnText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sourceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  sourceChipActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  sourceText: {
    ...textStyles.caption,
    color: darkColors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  textarea: {
    ...textStyles.body,
    color: darkColors.textPrimary,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
    backgroundColor: darkColors.surface,
  },
});

export default NewDealScreen;
