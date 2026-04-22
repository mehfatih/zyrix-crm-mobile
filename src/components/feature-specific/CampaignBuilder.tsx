/**
 * CampaignBuilder — 5-step wizard for composing a marketing campaign.
 *
 * Handles routing between steps internally, validates required fields
 * per step, and emits the assembled draft via `onSubmit`. Content step
 * swaps between Email / SMS / WhatsApp templates based on the type
 * chosen in step 1.
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
import { useTranslation } from 'react-i18next';

import { Button } from '../common/Button';
import { DatePicker } from '../forms/DatePicker';
import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export type CampaignType = 'email' | 'sms' | 'whatsapp';
export type AudienceType = 'all' | 'segment' | 'tags' | 'list';
export type ScheduleKind = 'now' | 'later' | 'recurring';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface CampaignDraft {
  name: string;
  type: CampaignType;
  audienceType: AudienceType;
  audienceTags: string[];
  estimatedReach: number;
  subject: string;
  message: string;
  scheduleKind: ScheduleKind;
  scheduledAt: Date | null;
  recurringFrequency: RecurringFrequency;
}

export interface CampaignBuilderProps {
  initial?: Partial<CampaignDraft>;
  onSubmit: (draft: CampaignDraft) => void;
  onCancel?: () => void;
}

const DEFAULT_DRAFT: CampaignDraft = {
  name: '',
  type: 'email',
  audienceType: 'all',
  audienceTags: [],
  estimatedReach: 850,
  subject: '',
  message: '',
  scheduleKind: 'now',
  scheduledAt: null,
  recurringFrequency: 'weekly',
};

const TOTAL_STEPS = 5;
type Step = 1 | 2 | 3 | 4 | 5;

const CAMPAIGN_TYPES: readonly { key: CampaignType; icon: AnyIconName }[] = [
  { key: 'email', icon: 'mail-outline' },
  { key: 'sms', icon: 'chatbubble-outline' },
  { key: 'whatsapp', icon: 'logo-whatsapp' },
];

const AUDIENCE_TYPES: readonly AudienceType[] = [
  'all',
  'segment',
  'tags',
  'list',
];

const SMS_MAX = 160;

const VARIABLES: readonly string[] = ['{{name}}', '{{company}}', '{{amount}}'];

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({
  initial,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CampaignDraft>({
    ...DEFAULT_DRAFT,
    ...initial,
  });
  const [step, setStep] = useState<Step>(1);

  const patch = (partial: Partial<CampaignDraft>): void => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return draft.name.trim().length >= 2;
      case 2:
        return true;
      case 3:
        if (draft.type === 'email') {
          return draft.subject.trim().length > 0 && draft.message.trim().length > 0;
        }
        return draft.message.trim().length > 0;
      case 4:
        if (draft.scheduleKind === 'later') return !!draft.scheduledAt;
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, draft]);

  const next = (): void => {
    if (step < TOTAL_STEPS) setStep((s) => ((s + 1) as Step));
    else onSubmit(draft);
  };

  const back = (): void => {
    if (step > 1) setStep((s) => ((s - 1) as Step));
    else onCancel?.();
  };

  const insertVariable = (variable: string): void => {
    patch({ message: `${draft.message}${variable}` });
  };

  const messageLimit =
    draft.type === 'sms' ? SMS_MAX : draft.type === 'whatsapp' ? 1024 : 8000;

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx + 1 <= step ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('campaigns.campaignName')}</Text>
            <TextInput
              value={draft.name}
              onChangeText={(next) => patch({ name: next })}
              placeholder={t('campaigns.campaignName')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />
            <Text style={styles.fieldLabel}>{t('campaigns.audience')}</Text>
            <View style={styles.typeGrid}>
              {CAMPAIGN_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => patch({ type: type.key })}
                  style={[
                    styles.typeCard,
                    draft.type === type.key ? styles.typeCardActive : null,
                  ]}
                >
                  <Icon
                    name={type.icon}
                    size={26}
                    color={
                      draft.type === type.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      draft.type === type.key
                        ? { color: colors.primaryDark, fontWeight: '700' }
                        : null,
                    ]}
                  >
                    {t(`campaigns.${type.key === 'email' ? 'subject' : type.key === 'sms' ? 'sendSMS' : 'sendWhatsApp'}`, type.key)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('campaigns.audience')}</Text>
            <View style={styles.audienceList}>
              {AUDIENCE_TYPES.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => patch({ audienceType: key })}
                  style={[
                    styles.audienceRow,
                    draft.audienceType === key
                      ? styles.audienceRowActive
                      : null,
                  ]}
                >
                  <Icon
                    name={
                      draft.audienceType === key
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.audienceLabel}>
                    {t(`campaigns.${key === 'all' ? 'allCustomers' : key === 'segment' ? 'segment' : key === 'tags' ? 'tags' : 'individualList'}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.reachCard}>
              <Text style={styles.reachLabel}>
                {t('campaigns.estimatedReach')}
              </Text>
              <Text style={styles.reachValue}>
                {draft.estimatedReach.toLocaleString('en-US')}
              </Text>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('campaigns.content')}</Text>
            {draft.type === 'email' ? (
              <>
                <Text style={styles.fieldLabel}>
                  {t('campaigns.subject')}
                </Text>
                <TextInput
                  value={draft.subject}
                  onChangeText={(next) => patch({ subject: next })}
                  style={[
                    styles.input,
                    { textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                />
              </>
            ) : null}
            <Text style={styles.fieldLabel}>{t('campaigns.message')}</Text>
            <TextInput
              value={draft.message}
              onChangeText={(next) =>
                patch({ message: next.slice(0, messageLimit) })
              }
              placeholder={t('campaigns.message')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.textarea,
                { textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            />
            <Text style={styles.counter}>
              {`${draft.message.length}/${messageLimit}`}
            </Text>

            <View style={styles.variableRow}>
              {VARIABLES.map((variable) => (
                <Pressable
                  key={variable}
                  onPress={() => insertVariable(variable)}
                  style={styles.variableChip}
                >
                  <Text style={styles.variableText}>{variable}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('campaigns.schedule')}</Text>
            <View style={styles.audienceList}>
              {(['now', 'later', 'recurring'] as ScheduleKind[]).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => patch({ scheduleKind: key })}
                  style={[
                    styles.audienceRow,
                    draft.scheduleKind === key
                      ? styles.audienceRowActive
                      : null,
                  ]}
                >
                  <Icon
                    name={
                      draft.scheduleKind === key
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.audienceLabel}>
                    {t(`campaigns.${key === 'now' ? 'sendImmediately' : key === 'later' ? 'scheduleForLater' : 'recurring'}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {draft.scheduleKind === 'later' ? (
              <DatePicker
                label={t('campaigns.scheduleForLater')}
                value={draft.scheduledAt}
                onChange={(d) => patch({ scheduledAt: d })}
              />
            ) : null}

            {draft.scheduleKind === 'recurring' ? (
              <View style={styles.frequencyRow}>
                {(
                  ['daily', 'weekly', 'monthly'] as RecurringFrequency[]
                ).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => patch({ recurringFrequency: freq })}
                    style={[
                      styles.freqChip,
                      draft.recurringFrequency === freq
                        ? styles.freqChipActive
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.freqText,
                        draft.recurringFrequency === freq
                          ? { color: colors.textInverse }
                          : null,
                      ]}
                    >
                      {freq}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('campaigns.reviewAndSend')}
            </Text>
            <ReviewRow
              label={t('campaigns.campaignName')}
              value={draft.name || '—'}
            />
            <ReviewRow
              label={t('campaigns.audience')}
              value={
                draft.audienceType === 'all'
                  ? t('campaigns.allCustomers')
                  : draft.audienceType
              }
            />
            <ReviewRow
              label={t('campaigns.estimatedReach')}
              value={draft.estimatedReach.toLocaleString('en-US')}
            />
            <ReviewRow
              label={t('campaigns.schedule')}
              value={
                draft.scheduleKind === 'now'
                  ? t('campaigns.sendImmediately')
                  : draft.scheduleKind === 'later'
                    ? draft.scheduledAt?.toISOString().slice(0, 16).replace('T', ' ') ??
                      ''
                    : `${t('campaigns.recurring')} — ${draft.recurringFrequency}`
              }
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === 1 ? t('common.cancel') : t('onboarding.back')}
          variant="ghost"
          onPress={back}
        />
        <Button
          label={
            step === TOTAL_STEPS
              ? t('campaigns.reviewAndSend')
              : t('onboarding.next')
          }
          onPress={next}
          disabled={!canContinue}
        />
      </View>
    </View>
  );
};

const ReviewRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={styles.reviewValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dot: { width: 22, height: 5, borderRadius: 3 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h3, color: colors.textPrimary },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counter: {
    ...textStyles.caption,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    rowGap: spacing.xs,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  audienceList: { rowGap: spacing.xs },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  audienceRowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  audienceLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  reachCard: {
    backgroundColor: colors.primarySoft,
    padding: spacing.base,
    borderRadius: radius.base,
    alignItems: 'center',
  },
  reachLabel: {
    ...textStyles.caption,
    color: colors.primaryDark,
  },
  reachValue: {
    ...textStyles.h2,
    color: colors.primaryDark,
  },
  variableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  variableChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
  },
  variableText: {
    ...textStyles.caption,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  freqChip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  freqChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  freqText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reviewLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  reviewValue: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default CampaignBuilder;
