import React, { ReactNode } from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkColors } from '../../theme/dark';

type ScreenProps = {
  children: ReactNode;
  /** Apply edge-to-edge background. Default: SafeAreaView clipping. */
  edgeToEdge?: boolean;
  /** Override the screen's root background color. */
  background?: string;
  /** Hide the status bar entirely. */
  hideStatusBar?: boolean;
  /** Disable safe-area on a specific edge — defaults to all edges respected. */
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  style?: ViewStyle;
};

export function Screen({
  children,
  edgeToEdge = false,
  background = darkColors.background,
  hideStatusBar = false,
  edges = ['top', 'right', 'bottom', 'left'],
  style,
}: ScreenProps) {
  if (edgeToEdge) {
    return (
      <View style={[styles.root, { backgroundColor: background }, style]}>
        {!hideStatusBar && (
          <StatusBar barStyle="light-content" backgroundColor={background} />
        )}
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: background }, style]}
      edges={edges}
    >
      {!hideStatusBar && (
        <StatusBar barStyle="light-content" backgroundColor={background} />
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
