/**
 * AIRecommendationSlide — single slide rendered inside the
 * AIRecommendationsCard pager. Layout matches Sprint 3 spec:
 * 32px white icon on the left, title + body on the right, white CTA
 * pill anchored to the bottom of the card.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Icon } from './common/Icon';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { textStyles } from '../constants/typography';
import type { Recommendation } from '../services/recommendations';

export interface AIRecommendationSlideProps {
  recommendation: Recommendation;
  onCtaPress: (rec: Recommendation) => void;
}

export const AIRecommendationSlide: React.FC<AIRecommendationSlideProps> = ({
  recommendation,
  onCtaPress,
}) => {
  const { t } = useTranslation();

  const title = recommendation.titleKey
    ? t(recommendation.titleKey)
    : recommendation.title ?? '';
  const body = recommendation.bodyKey
    ? t(recommendation.bodyKey)
    : recommendation.body ?? '';
  const ctaLabel = t(recommendation.ctaKey);

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCtaPress(recommendation);
  };

  return (
    <View style={styles.slide}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name={recommendation.icon} size={32} color={colors.white} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cta,
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.ctaText} numberOfLines={1}>
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 14,
  },
  iconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  textBlock: {
    flex: 1,
    rowGap: 4,
  },
  title: {
    ...textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  body: {
    ...textStyles.caption,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  cta: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default AIRecommendationSlide;
