/**
 * Header — app-wide header row with cyan background, back affordance,
 * and an optional right-side actions slot.
 *
 * RTL handling: the back chevron flips automatically via I18nManager.isRTL
 * so the arrow always points "back" in reading order. Title alignment
 * defaults to centered on iOS (platform convention) and start-aligned
 * on Android; callers can override via `titleAlign`.
 */

import React from 'react';
import {
  I18nManager,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { hitSlop, layout, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Icon } from './Icon';

export type HeaderTitleAlign = 'start' | 'center';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  titleAlign?: HeaderTitleAlign;
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const defaultTitleAlign: HeaderTitleAlign = Platform.OS === 'ios' ? 'center' : 'start';

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  leftSlot,
  rightSlot,
  titleAlign = defaultTitleAlign,
  transparent = false,
  style,
  testID,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const hasLeft = Boolean(leftSlot) || (showBack && Boolean(onBack));
  const backArrowName = I18nManager.isRTL ? 'chevron-forward' : 'chevron-back';

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    transparent
      ? { backgroundColor: colors.transparent }
      : { backgroundColor: colors.primary },
    { paddingTop: insets.top },
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={transparent ? colors.transparent : colors.primary}
        translucent={transparent}
      />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.row}>
          <View style={styles.side}>
            {leftSlot ? (
              leftSlot
            ) : showBack && onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed ? styles.iconButtonPressed : null,
                ]}
              >
                <Icon
                  name={backArrowName}
                  size={26}
                  color={colors.textInverse}
                />
              </Pressable>
            ) : null}
          </View>

          <View
            style={[
              styles.titleWrap,
              titleAlign === 'center'
                ? styles.titleCenter
                : styles.titleStart,
              titleAlign === 'start' && !hasLeft
                ? { paddingStart: spacing.base }
                : null,
            ]}
            pointerEvents="none"
          >
            <Text
              numberOfLines={1}
              style={[
                textStyles.h4,
                styles.title,
                titleAlign === 'center' ? { textAlign: 'center' } : null,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[
                  textStyles.caption,
                  styles.subtitle,
                  titleAlign === 'center' ? { textAlign: 'center' } : null,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={[styles.side, styles.sideEnd]}>{rightSlot}</View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  safe: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.headerHeight,
    paddingHorizontal: spacing.sm,
  },
  side: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideEnd: {
    justifyContent: 'flex-end',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  titleStart: {
    alignItems: 'flex-start',
  },
  titleCenter: {
    alignItems: 'center',
  },
  title: {
    color: colors.textInverse,
  },
  subtitle: {
    color: colors.primarySoft,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default Header;
