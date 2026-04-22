/**
 * VoiceRecorder — placeholder UI for voice input. The actual
 * `expo-av` integration lands in Sprint 10; for now this component
 * renders the mic button + waveform scaffolding and fires
 * `onRecordingComplete(null)` when the user hits Send, so flow code
 * can be wired end-to-end in advance.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface VoiceRecorderProps {
  onRecordingComplete: (
    file: {
      uri: string;
      durationSeconds: number;
    } | null
  ) => void;
  onCancel?: () => void;
}

const BAR_COUNT = 14;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const waveRefs = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  );
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) {
      if (elapsedTimer.current) {
        clearInterval(elapsedTimer.current);
        elapsedTimer.current = null;
      }
      return;
    }
    const loops = waveRefs.current.map((value, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 0.9,
            duration: 260 + idx * 32,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 260 + idx * 32,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    elapsedTimer.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [isRecording]);

  const toggle = (): void => {
    if (isRecording) {
      setIsRecording(false);
      onRecordingComplete({
        uri: `recording-${Date.now()}.m4a`,
        durationSeconds: elapsed,
      });
    } else {
      setElapsed(0);
      setIsRecording(true);
    }
  };

  const discard = (): void => {
    setIsRecording(false);
    setElapsed(0);
    onCancel?.();
  };

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.waveform}>
        {waveRefs.current.map((value, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.bar,
              {
                transform: [{ scaleY: value }],
                backgroundColor: isRecording ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.time}>{`${mins}:${secs}`}</Text>

      <View style={styles.buttonsRow}>
        <Pressable
          onPress={discard}
          style={styles.ghostBtn}
          disabled={!isRecording && elapsed === 0}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.ghostText, { color: colors.error }]}>
            {t('common.delete')}
          </Text>
        </Pressable>

        <Pressable
          onPress={toggle}
          style={[
            styles.micBtn,
            { backgroundColor: isRecording ? colors.error : colors.primary },
          ]}
        >
          <Icon
            name={isRecording ? 'stop' : 'mic'}
            size={28}
            color={colors.textInverse}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            if (!isRecording && elapsed > 0) {
              onRecordingComplete({
                uri: `recording-${Date.now()}.m4a`,
                durationSeconds: elapsed,
              });
            }
          }}
          style={styles.ghostBtn}
          disabled={isRecording || elapsed === 0}
        >
          <Icon
            name="paper-plane-outline"
            size={20}
            color={elapsed > 0 && !isRecording ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.ghostText,
              {
                color:
                  elapsed > 0 && !isRecording ? colors.primary : colors.textMuted,
              },
            ]}
          >
            {t('quoteBuilder.sendNow')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {t('placeholders.comingInSprint', { sprint: 10 })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    height: 60,
  },
  bar: {
    width: 6,
    height: '100%',
    borderRadius: 3,
  },
  time: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xl,
    marginTop: spacing.xs,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  ghostBtn: {
    alignItems: 'center',
    rowGap: 4,
  },
  ghostText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  hint: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default VoiceRecorder;
