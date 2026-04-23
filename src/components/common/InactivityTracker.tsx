/**
 * InactivityTracker — wraps the app tree and resets the session
 * inactivity timer on every gesture. Use once near the root, below
 * the providers but above the navigator.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { resetTimer } from '../../utils/sessionManager';

export interface InactivityTrackerProps extends ViewProps {
  children: React.ReactNode;
}

export const InactivityTracker: React.FC<InactivityTrackerProps> = ({
  children,
  style,
  ...rest
}) => (
  <View
    {...rest}
    style={[styles.root, style]}
    onTouchStart={resetTimer}
    onTouchMove={resetTimer}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default InactivityTracker;
