/**
 * Toast — root-level toast surface that subscribes to `toastStore`
 * and renders stacked toasts with auto-dismiss. Mount once, high in
 * the tree (App.tsx).
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type AnyIconName } from './Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from '../../store/toastStore';

const VARIANT_STYLE: Record<
  ToastVariant,
  { background: string; text: string; icon: AnyIconName }
> = {
  success: {
    background: colors.success,
    text: colors.textInverse,
    icon: 'checkmark-circle-outline',
  },
  error: {
    background: colors.error,
    text: colors.textInverse,
    icon: 'close-circle-outline',
  },
  info: {
    background: colors.primary,
    text: colors.textInverse,
    icon: 'information-circle-outline',
  },
  warning: {
    background: colors.warning,
    text: colors.textPrimary,
    icon: 'warning-outline',
  },
};

const ToastRow: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = VARIANT_STYLE[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <Pressable
      onPress={() => dismiss(toast.id)}
      style={({ pressed }) => [
        styles.toast,
        { backgroundColor: style.background },
        pressed ? { opacity: 0.9 } : null,
      ]}
      accessibilityRole="alert"
    >
      <Icon name={style.icon} size={22} color={style.text} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: style.text }]} numberOfLines={2}>
          {toast.title}
        </Text>
        {toast.description ? (
          <Text
            style={[styles.description, { color: style.text }]}
            numberOfLines={2}
          >
            {toast.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export const Toast: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={styles.container}
      edges={['top']}
    >
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.base,
    right: spacing.base,
    rowGap: spacing.sm,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    ...shadows.lg,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...textStyles.bodyMedium,
  },
  description: {
    ...textStyles.caption,
    marginTop: 2,
    opacity: 0.92,
  },
});

export default Toast;
