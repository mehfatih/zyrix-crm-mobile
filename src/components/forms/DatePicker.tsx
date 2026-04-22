/**
 * DatePicker — modal calendar with cyan theme.
 *
 * Uses the country config to decide which day starts the week (0 for
 * Sunday in most Arab countries, 1 for Monday in TR/AE). Saudi users
 * see a Hijri preview line below the selected date; the picker itself
 * stays Gregorian so we don't have to ship a full Islamic-calendar
 * date conversion in Sprint 5.
 */

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import { useTranslation } from 'react-i18next';

export interface DatePickerProps {
  value: Date | null;
  onChange: (next: Date | null) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  disabled?: boolean;
}

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildGrid = (year: number, month: number, weekStart: number): (Date | null)[] => {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() - weekStart + 7) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= lastDay; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  error,
  disabled,
}) => {
  const { t } = useTranslation();
  const { config, formatDate } = useCountryConfig();
  const weekStart = config.weekStart;

  const [visible, setVisible] = useState(false);
  const initial = value ?? new Date();
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());

  const weekdayLabels = useMemo(() => {
    const base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rotated: string[] = [];
    for (let i = 0; i < 7; i += 1) rotated.push(base[(weekStart + i) % 7] as string);
    return rotated;
  }, [weekStart]);

  const grid = useMemo(
    () => buildGrid(viewYear, viewMonth, weekStart),
    [viewYear, viewMonth, weekStart]
  );

  const open = (): void => {
    if (disabled) return;
    setViewMonth(initial.getMonth());
    setViewYear(initial.getFullYear());
    setVisible(true);
  };

  const goMonth = (delta: number): void => {
    let next = viewMonth + delta;
    let year = viewYear;
    if (next < 0) {
      next = 11;
      year -= 1;
    } else if (next > 11) {
      next = 0;
      year += 1;
    }
    setViewMonth(next);
    setViewYear(year);
  };

  const pick = (day: Date): void => {
    const normalized = startOfDay(day);
    if (minDate && normalized < startOfDay(minDate)) return;
    if (maxDate && normalized > startOfDay(maxDate)) return;
    onChange(normalized);
    setVisible(false);
  };

  const today = new Date();
  const showsHijriHint = config.code === 'SA' && value;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.trigger,
          error ? { borderColor: colors.error } : null,
          pressed ? { opacity: 0.85 } : null,
          disabled ? { opacity: 0.5 } : null,
        ]}
      >
        <Icon name="calendar-outline" size={18} color={colors.primary} />
        <Text
          style={[
            styles.triggerText,
            !value ? styles.placeholder : null,
          ]}
        >
          {value ? formatDate(value) : placeholder ?? t('common.continue')}
        </Text>
        {value ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            hitSlop={8}
          >
            <Icon name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      {showsHijriHint ? (
        <Text style={styles.hijriHint}>
          {`${t('common.continue')}: ${formatDate(value as Date, 'long')}`}
        </Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.monthHeader}>
              <Pressable onPress={() => goMonth(-1)} hitSlop={8} style={styles.monthBtn}>
                <Icon name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {`${MONTHS_EN[viewMonth]} ${viewYear}`}
              </Text>
              <Pressable onPress={() => goMonth(1)} hitSlop={8} style={styles.monthBtn}>
                <Icon name="chevron-forward" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdayLabels.map((label) => (
                <Text key={label} style={styles.weekLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((day, idx) => {
                if (!day) {
                  return <View key={`blank-${idx}`} style={styles.dayCell} />;
                }
                const outside =
                  (minDate && day < startOfDay(minDate)) ||
                  (maxDate && day > startOfDay(maxDate));
                const selected = value ? isSameDay(day, value) : false;
                const isToday = isSameDay(day, today);
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => pick(day)}
                    style={[
                      styles.dayCell,
                      selected ? styles.dayCellSelected : null,
                      !selected && isToday ? styles.dayCellToday : null,
                      outside ? { opacity: 0.3 } : null,
                    ]}
                    disabled={!!outside}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected ? styles.dayTextSelected : null,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footerRow}>
              <Pressable
                onPress={() => pick(today)}
                style={styles.footerBtn}
              >
                <Text style={styles.footerBtnText}>{t('onboarding.next')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(null);
                  setVisible(false);
                }}
                style={styles.footerBtn}
              >
                <Text style={[styles.footerBtnText, { color: colors.error }]}>
                  {t('common.delete')}
                </Text>
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
  placeholder: {
    color: colors.textMuted,
  },
  hijriHint: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
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
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as unknown as number,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.base,
  },
  dayText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.base,
    marginTop: spacing.sm,
  },
  footerBtn: {
    padding: spacing.sm,
  },
  footerBtnText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default DatePicker;
