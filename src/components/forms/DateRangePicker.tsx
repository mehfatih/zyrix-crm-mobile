/**
 * DateRangePicker — preset + custom range selector.
 *
 * Sprint 5 exposes the 8 preset ranges (Today, Yesterday, Last 7 days,
 * Last 30 days, This Month, Last Month, This Year, Custom). The
 * custom option falls back to a quick start/end picker using the
 * single-date `DatePicker` twice; a dual-calendar UI is scoped for a
 * later polish pass.
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePicker } from './DatePicker';
import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (next: DateRange) => void;
  label?: string;
}

type Preset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

const PRESETS: readonly Preset[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'custom',
];

const buildPreset = (preset: Preset): DateRange | null => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (preset) {
    case 'today':
      return { startDate: now, endDate: now };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { startDate: y, endDate: y };
    }
    case 'last7': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: s, endDate: now };
    }
    case 'last30': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { startDate: s, endDate: now };
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: s, endDate: e };
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: s, endDate: e };
    }
    case 'thisYear': {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      return { startDate: s, endDate: e };
    }
    case 'custom':
    default:
      return null;
  }
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useCountryConfig();

  const [visible, setVisible] = useState(false);
  const [preset, setPreset] = useState<Preset>('last7');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const labelFor = (key: Preset): string => {
    switch (key) {
      case 'today':
        return t('common.welcome');
      case 'yesterday':
        return t('common.back');
      case 'last7':
        return `7 ${t('common.continue').toLowerCase()}`;
      case 'last30':
        return `30 ${t('common.continue').toLowerCase()}`;
      case 'thisMonth':
        return t('dashboard.monthRevenue');
      case 'lastMonth':
        return t('commissions.lastMonth');
      case 'thisYear':
        return t('quotas.yearToDate');
      case 'custom':
        return t('commissions.custom');
      default:
        return key;
    }
  };

  const apply = (): void => {
    if (preset === 'custom') {
      if (customStart && customEnd) {
        onChange({ startDate: customStart, endDate: customEnd });
        setVisible(false);
      }
      return;
    }
    const built = buildPreset(preset);
    if (built) {
      onChange(built);
      setVisible(false);
    }
  };

  const summary = value
    ? `${formatDate(value.startDate)} → ${formatDate(value.endDate)}`
    : t('commissions.custom');

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Icon name="calendar-outline" size={18} color={colors.primary} />
        <Text style={styles.triggerText}>{summary}</Text>
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {label ?? t('commissions.custom')}
            </Text>
            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPreset(p)}
                  style={[
                    styles.preset,
                    preset === p ? styles.presetActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      preset === p ? styles.presetTextActive : null,
                    ]}
                  >
                    {labelFor(p)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {preset === 'custom' ? (
              <View style={styles.customBlock}>
                <DatePicker
                  label={t('forms.email')}
                  value={customStart}
                  onChange={setCustomStart}
                />
                <DatePicker
                  label={t('forms.email')}
                  value={customEnd}
                  onChange={setCustomEnd}
                  minDate={customStart ?? undefined}
                />
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <Pressable
                onPress={() => setVisible(false)}
                style={styles.footerBtn}
              >
                <Text style={[styles.footerText, { color: colors.error }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable onPress={apply} style={styles.footerBtn}>
                <Text style={styles.footerText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  triggerText: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.textInverse,
  },
  customBlock: {
    marginTop: spacing.base,
    rowGap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.base,
    marginTop: spacing.base,
  },
  footerBtn: {
    padding: spacing.sm,
  },
  footerText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default DateRangePicker;
