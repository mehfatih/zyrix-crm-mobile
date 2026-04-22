/**
 * PlaceholderAdminScreen — reusable placeholder for every Admin drawer
 * destination until those modules are built in Sprint 8. Accepts a
 * translated `title` prop and renders a "Coming in Sprint 8" card.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/common/Header';
import { Icon, type AnyIconName, type IconFamily } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PlaceholderAdminScreenProps {
  title: string;
  sprint?: number | string;
  icon?: AnyIconName;
  iconFamily?: IconFamily;
}

const MenuButton: React.FC<{ onPress: () => void; label: string }> = ({
  onPress,
  label,
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={hitSlop.md}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [
      styles.menuButton,
      pressed ? styles.menuButtonPressed : null,
    ]}
  >
    <Icon name="menu-outline" size={26} color={colors.textInverse} />
  </Pressable>
);

export const PlaceholderAdminScreen: React.FC<PlaceholderAdminScreenProps> = ({
  title,
  sprint = 8,
  icon = 'construct-outline',
  iconFamily = 'Ionicons',
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const openDrawer = (): void => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={title}
        showBack={false}
        leftSlot={<MenuButton onPress={openDrawer} label={t('navigation.menu')} />}
      />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name={icon} family={iconFamily} size={52} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {t('placeholders.comingInSprint', { sprint })}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default PlaceholderAdminScreen;
