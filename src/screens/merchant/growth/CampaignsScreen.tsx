/**
 * CampaignsScreen — list of marketing campaigns with status pills and
 * basic engagement metrics. Creating a new campaign is scoped for
 * Sprint 5.
 */

import React from 'react';
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

import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { StatusPill } from '../../../components/ui/StatusPill';
import { CAMPAIGN_STATUS_TONE } from '../../../lib/ui/status-tones';
import { MOCK_CAMPAIGNS, type MockCampaign } from '../../../api/mockData';
import { darkColors } from '../../../theme/dark';
import { getPageAccent } from '../../../theme/dark/accents';

const PAGE_ACCENT = getPageAccent('campaigns');
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';

const CHANNEL_ICON: Record<MockCampaign['channel'], AnyIconName> = {
  email: 'mail-outline',
  sms: 'chatbubble-outline',
  whatsapp: 'logo-whatsapp',
  push: 'notifications-outline',
};

export const CampaignsScreen: React.FC = () => {
  const { t } = useTranslation();

  const onNew = (): void => {
    Alert.alert(
      t('growth.campaigns'),
      t('placeholders.comingInSprint', { sprint: 5 })
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('growth.campaigns')} showBack={false} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {MOCK_CAMPAIGNS.map((c) => {
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.channelIcon}>
                  <Icon
                    name={CHANNEL_ICON[c.channel]}
                    size={18}
                    color={darkColors.primary}
                  />
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  {c.name}
                </Text>
                <StatusPill
                  tone={CAMPAIGN_STATUS_TONE[c.status] ?? 'neutral'}
                  size="sm"
                >
                  {t(`campaignStatus.${c.status}`)}
                </StatusPill>
              </View>

              <View style={styles.metaGrid}>
                <MetaCol label={t('growth.totalMembers')} value={c.audience} />
                <MetaCol label={t('dashboard.viewAll')} value={c.sent} />
                <MetaCol label={t('growth.activity')} value={`${c.openRate}%`} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onNew}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={28} color={darkColors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const MetaCol: React.FC<{ label: string; value: number | string }> = ({
  label,
  value,
}) => (
  <View style={styles.metaCol}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 2,
    rowGap: spacing.sm,
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    ...textStyles.bodyMedium,
    color: darkColors.textPrimary,
  },
  metaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
    paddingTop: spacing.sm,
  },
  metaCol: {
    flex: 1,
    rowGap: 2,
  },
  metaLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  metaValue: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default CampaignsScreen;
