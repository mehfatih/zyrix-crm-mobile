/**
 * AppScreen — top-level wrapper for AI-era screens (AI Sprint 1, task 2).
 *
 * Applies the Premium Light gradient (white → #F0F9FF → #E0F2FE) and a
 * SafeAreaView so content honours notches/home indicators. Pass
 * `noGradient` when a screen needs a flat surface (modal sheets, embedded
 * sub-screens that already sit on a gradient host).
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { zyrixTheme } from '../../theme/zyrixTheme';

export interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noGradient?: boolean;
  edges?: readonly Edge[];
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom'];

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  noGradient = false,
  edges = DEFAULT_EDGES,
}) => {
  if (noGradient) {
    return (
      <SafeAreaView style={[styles.solid, style]} edges={edges}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={[
          zyrixTheme.gradient.start,
          zyrixTheme.gradient.mid,
          zyrixTheme.gradient.end,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={[styles.flex, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  solid: { flex: 1, backgroundColor: zyrixTheme.surfaceAlt },
});

export default AppScreen;
