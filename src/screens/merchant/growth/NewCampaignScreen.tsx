/**
 * NewCampaignScreen — hosts `CampaignBuilder`. On submit shows a
 * success screen and returns to the campaigns list.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import {
  CampaignBuilder,
  type CampaignDraft,
} from '../../../components/feature-specific/CampaignBuilder';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';

export const NewCampaignScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const [sent, setSent] = useState(false);

  const onSubmit = (_draft: CampaignDraft): void => {
    toast.success(t('common.success'));
    setSent(true);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('growth.campaigns')}
        onBack={() => navigation.goBack()}
      />
      {sent ? (
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Icon name="checkmark" size={44} color={colors.textInverse} />
          </View>
          <Text style={styles.successTitle}>{t('common.success')}</Text>
          <Text style={styles.successBody}>
            {t('campaigns.reviewAndSend')}
          </Text>
          <Button
            label={t('common.continue')}
            onPress={() => navigation.goBack()}
          />
        </View>
      ) : (
        <CampaignBuilder
          onSubmit={onSubmit}
          onCancel={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    rowGap: spacing.base,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  successTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default NewCampaignScreen;
