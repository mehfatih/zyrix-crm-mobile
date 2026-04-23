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
import { colors } from '../../constants/colors';
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
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
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
                <Icon name="warning-outline" size={16} color={colors.error} />
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
          <Icon name="mail-outline" size={18} color={colors.textInverse} />
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
  safe: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  title: {
    ...textStyles.h1,
    color: colors.error,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  issuesCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  issuesTitle: {
    ...textStyles.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  issueLine: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  primaryText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
  secondaryText: {
    ...textStyles.label,
    color: colors.primary,
  },
});

export default SecurityBlockScreen;
