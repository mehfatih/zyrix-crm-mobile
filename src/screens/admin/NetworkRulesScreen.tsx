/**
 * NetworkRulesScreen — rate-limit, geo-block, and DDoS toggles for the
 * platform. Persists locally in component state for now; backend
 * persistence drops in once the security service is online.
 */

import React, { useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useToast } from '../../hooks/useToast';

type Sensitivity = 'low' | 'medium' | 'high';

export const NetworkRulesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [apiPerMinute, setApiPerMinute] = useState('600');
  const [failedLogins, setFailedLogins] = useState('5');
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [whitelistMode, setWhitelistMode] = useState(false);
  const [ddosEnabled, setDdosEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState<Sensitivity>('medium');

  const toggleCountry = (code: string): void => {
    setBlockedCountries((prev) =>
      prev.includes(code) ? prev.filter((entry) => entry !== code) : [...prev, code]
    );
  };

  const save = (): void => {
    toast.success(t('common.success'));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('networkRules.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('networkRules.rateLimit')}</Text>
          <Field
            label={t('networkRules.apiCallsPerMinute')}
            value={apiPerMinute}
            onChange={(value) => setApiPerMinute(value.replace(/[^0-9]/g, ''))}
            keyboard="number-pad"
          />
          <Field
            label={t('networkRules.failedLoginThreshold')}
            value={failedLogins}
            onChange={(value) => setFailedLogins(value.replace(/[^0-9]/g, ''))}
            keyboard="number-pad"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('networkRules.geoBlocking')}
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>
              {t('networkRules.whitelistMode')}
            </Text>
            <Switch
              value={whitelistMode}
              onValueChange={setWhitelistMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.fieldLabel}>
            {t('networkRules.blockedCountries')}
          </Text>
          <View style={styles.countryRow}>
            {['CN', 'RU', 'KP', 'IR', 'IL', 'SY'].map((code) => {
              const selected = blockedCountries.includes(code);
              return (
                <Pressable
                  key={code}
                  onPress={() => toggleCountry(code)}
                  style={[
                    styles.countryChip,
                    selected ? styles.countryChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.countryText,
                      selected ? { color: colors.textInverse } : null,
                    ]}
                  >
                    {code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>
              {t('networkRules.ddosProtection')}
            </Text>
            <Switch
              value={ddosEnabled}
              onValueChange={setDdosEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.fieldLabel}>
            {t('networkRules.sensitivity')}
          </Text>
          <View style={styles.row}>
            {(['low', 'medium', 'high'] as Sensitivity[]).map((entry) => (
              <Pressable
                key={entry}
                onPress={() => setSensitivity(entry)}
                style={[
                  styles.sensitivityChip,
                  sensitivity === entry ? styles.sensitivityChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.sensitivityText,
                    sensitivity === entry ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`networkRules.${entry}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('networkRules.recentEvents')}
          </Text>
          <View style={styles.eventRow}>
            <Icon name="warning-outline" size={16} color={colors.warning} />
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>
                {`SYN flood detected from 185.220.x.x`}
              </Text>
              <Text style={styles.eventMeta}>
                {`Blocked automatically · 2026-04-22 03:14`}
              </Text>
            </View>
          </View>
          <View style={styles.eventRow}>
            <Icon name="information-circle-outline" size={16} color={colors.primary} />
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>
                {`Sustained scrape attempt mitigated`}
              </Text>
              <Text style={styles.eventMeta}>
                {`Limit applied per IP · 2026-04-19 22:08`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('common.save')} onPress={save} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboard?: 'number-pad';
}> = ({ label, value, onChange, keyboard }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType={keyboard}
      style={[
        styles.input,
        { textAlign: I18nManager.isRTL ? 'right' : 'left' },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  field: { rowGap: spacing.xs },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  countryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryChipActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  countryText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  sensitivityChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  sensitivityChipActive: { backgroundColor: colors.primary },
  sensitivityText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  eventBody: { flex: 1 },
  eventTitle: { ...textStyles.body, color: colors.textPrimary },
  eventMeta: { ...textStyles.caption, color: colors.textMuted },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NetworkRulesScreen;
