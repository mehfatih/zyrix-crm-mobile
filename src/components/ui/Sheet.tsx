import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { darkColors, radius, spacing } from '../../theme/dark';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max height as % of screen. Default 0.85. */
  maxHeightRatio?: number;
  contentStyle?: ViewStyle;
};

export function Sheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.85,
  contentStyle,
}: SheetProps) {
  const translateY = useRef(new Animated.Value(800)).current;
  const { height: screenHeight } = useWindowDimensions();
  const maxHeight = screenHeight * maxHeightRatio;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 800,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateY }], maxHeight }}>
          <Pressable
            style={[styles.sheet, contentStyle]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(12, 22, 44, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: 12,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.border,
    marginBottom: spacing.base,
  },
});
