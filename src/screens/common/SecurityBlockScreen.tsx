/**
 * SecurityBlockScreen — full-screen lockout shown when the device is
 * jailbroken/rooted/compromised and the company policy is "block".
 */

import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon } from '../../components/common/Icon';
import { darkColors } from '../../theme/dark';
import {
  hasHooks,
  isJailbroken,
  isRooted,
} from '../../utils/jailbreakDetection';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export const SecurityBlockScreen: React.FC = () => {
  const { t } = useTranslation();

  const issues = [
    isRooted() ? t('jailbreak.rootDetected') : null,
    isJailbroken() ? t('jailbreak.rootDetected') : null,
    hasHooks() ? t('jailbreak.hooksDetected') : null,
  ].filter((issue): issue is string => Boolean(issue));

  const contactAdmin = (): void => {
    Linking.openURL('mailto:security@zyrix.co').catch(() => undefined);
  };

  const learnMore = (): void => {
    Linking.openURL('https://help.zyrix.co/security').catch(() => undefined);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name="alert-circle-outline" size={56} color={darkColors.error} />
        </View>
        <Text style={styles.title}>{t('jailbreak.title')}</Text>
        <Text style={styles.message}>{t('jailbreak.deviceCompromised')}</Text>

        <View style={styles.issuesCard}>
          <Text style={styles.issuesTitle}>
            {t('jailbreak.detectedIssues')}
          </Text>
          {issues.length === 0 ? (
            <Text style={styles.issueLine}>—</Text>
          ) : (
            issues.map((issue, idx) => (
              <View key={idx} style={styles.issueRow}>
                <Icon name="warning-outline" size={16} color={darkColors.error} />
                <Text style={styles.issueLine}>{issue}</Text>
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={contactAdmin}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="mail-outline" size={18} color={darkColors.textOnPrimary} />
          <Text style={styles.primaryText}>{t('jailbreak.contactAdmin')}</Text>
        </Pressable>
        <Pressable onPress={learnMore} hitSlop={8}>
          <Text style={styles.secondaryText}>{t('jailbreak.learnMore')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.base,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: darkColors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  title: {
    ...textStyles.h1,
    color: darkColors.error,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  issuesCard: {
    width: '100%',
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  issuesTitle: {
    ...textStyles.label,
    color: darkColors.textSecondary,
    textTransform: 'uppercase',
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  issueLine: {
    ...textStyles.body,
    color: darkColors.textPrimary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    backgroundColor: darkColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  primaryText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
  secondaryText: {
    ...textStyles.label,
    color: darkColors.primary,
  },
});

export default SecurityBlockScreen;
