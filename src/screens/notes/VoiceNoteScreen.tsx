/**
 * VoiceNoteScreen — full-screen voice recorder reached from the
 * "Voice Note" tile in the quick-add sheet.
 *
 * Records up to 60s via expo-av. After recording the user can play back
 * the clip and either save it (passes the local URI back to the caller
 * via `onSaved`) or discard. Permissions are handled inline.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useToast } from '../../hooks/useToast';

const MAX_DURATION_MS = 60_000;

type Phase = 'idle' | 'recording' | 'recorded' | 'playing' | 'saving';

export interface VoiceNoteResult {
  uri: string;
  durationMs: number;
}

export interface VoiceNoteScreenProps {
  onClose: () => void;
  onSaved?: (result: VoiceNoteResult) => void;
}

const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(1, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const VoiceNoteScreen: React.FC<VoiceNoteScreenProps> = ({
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [permission, setPermission] = useState<Audio.PermissionResponse | null>(
    null
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void (async () => {
      try {
        const initial = await Audio.getPermissionsAsync();
        setPermission(initial);
      } catch (err) {
        console.warn('[voiceNote] getPermissionsAsync failed', err);
      }
    })();

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
      void soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (phase === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [phase, pulse]);

  const stopRecording = useCallback(async (): Promise<void> => {
    const rec = recordingRef.current;
    if (!rec) return;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    try {
      await rec.stopAndUnloadAsync();
    } catch (err) {
      console.warn('[voiceNote] stop failed', err);
    }
    const uri = rec.getURI();
    recordingRef.current = null;
    setRecordingUri(uri ?? null);
    setPhase('recorded');
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const status = permission?.granted
        ? permission
        : await Audio.requestPermissionsAsync();
      setPermission(status);
      if (!status.granted) {
        toast.error(t('voiceNote.permissionTitle'));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      recordingRef.current = recording;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setPhase('recording');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      tickRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        setElapsedMs(ms);
        if (ms >= MAX_DURATION_MS) {
          void stopRecording();
        }
      }, 200);
    } catch (err) {
      console.warn('[voiceNote] startRecording failed', err);
      toast.error(t('common.error'));
      setPhase('idle');
    }
  }, [permission, stopRecording, toast, t]);

  const playRecording = useCallback(async (): Promise<void> => {
    if (!recordingUri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;
      setPhase('playing');
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPhase('recorded');
        }
      });
      await sound.playAsync();
    } catch (err) {
      console.warn('[voiceNote] playback failed', err);
      setPhase('recorded');
    }
  }, [recordingUri]);

  const onPrimaryPress = useCallback((): void => {
    if (phase === 'idle') {
      void startRecording();
    } else if (phase === 'recording') {
      void Haptics.selectionAsync();
      void stopRecording();
    } else if (phase === 'recorded') {
      void playRecording();
    }
  }, [phase, startRecording, stopRecording, playRecording]);

  const onSave = useCallback((): void => {
    if (!recordingUri) return;
    setPhase('saving');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaved?.({ uri: recordingUri, durationMs: elapsedMs });
    toast.success(t('voiceNote.saved'));
    setTimeout(() => {
      onClose();
    }, 250);
  }, [recordingUri, elapsedMs, onSaved, toast, t, onClose]);

  const onDiscard = useCallback((): void => {
    void soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setRecordingUri(null);
    setElapsedMs(0);
    setPhase('idle');
  }, []);

  const primaryIcon =
    phase === 'recording' ? 'stop' : phase === 'recorded' ? 'play' : 'mic';
  const primaryColor =
    phase === 'recording' ? colors.error : colors.textInverse;
  const primaryBg =
    phase === 'recording' ? colors.surface : colors.primary;

  const helperText =
    phase === 'recording'
      ? t('voiceNote.recording')
      : phase === 'recorded' || phase === 'playing'
        ? t('voiceNote.playback')
        : phase === 'saving'
          ? t('voiceNote.saving')
          : t('voiceNote.tapToRecord');

  const renderBody = (): React.ReactNode => {
    if (permission && !permission.granted) {
      return (
        <View style={styles.permissionWrap}>
          <Icon name="mic-outline" size={48} color={colors.primary} />
          <Text style={styles.permissionTitle}>
            {t('voiceNote.permissionTitle')}
          </Text>
          <Text style={styles.permissionBody}>
            {t('voiceNote.permissionBody')}
          </Text>
          <Pressable
            onPress={() => {
              void Audio.requestPermissionsAsync().then(setPermission);
            }}
            style={styles.permissionBtn}
            accessibilityRole="button"
          >
            <Text style={styles.permissionBtnText}>
              {t('voiceNote.grantPermission')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <Text style={styles.subtitle}>{t('voiceNote.subtitle')}</Text>

        <View style={styles.timerWrap}>
          <Text style={styles.timer}>{formatTime(elapsedMs)}</Text>
          <Text style={styles.timerMax}>/ {formatTime(MAX_DURATION_MS)}</Text>
        </View>

        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulse }], opacity: phase === 'recording' ? 0.35 : 0 },
          ]}
        />

        <Pressable
          onPress={onPrimaryPress}
          disabled={phase === 'saving'}
          style={[
            styles.primaryBtn,
            { backgroundColor: primaryBg },
            phase === 'recording' ? styles.primaryBtnRecording : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={helperText}
        >
          {phase === 'saving' ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Icon name={primaryIcon} size={36} color={primaryColor} />
          )}
        </Pressable>

        <Text style={styles.helper}>{helperText}</Text>

        {phase === 'recorded' || phase === 'playing' ? (
          <View style={styles.actions}>
            <Pressable
              onPress={onDiscard}
              style={[styles.actionBtn, styles.secondaryBtn]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>
                {t('voiceNote.discard')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[styles.actionBtn, styles.primaryActionBtn]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionText}>
                {t('voiceNote.save')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.maxLength}>{t('voiceNote.maxLength')}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <Header
        title={t('voiceNote.title')}
        showBack
        onBack={onClose}
        titleAlign="center"
      />
      {renderBody()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    columnGap: spacing.xs,
  },
  timer: {
    ...textStyles.display,
    color: colors.textHeading,
  },
  timerMax: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  pulseRing: {
    position: 'absolute',
    top: 220,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.coralSoft,
  },
  primaryBtn: {
    marginTop: spacing.xl,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnRecording: {
    borderWidth: 3,
    borderColor: colors.error,
  },
  helper: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    columnGap: spacing.md,
    marginTop: spacing.xl,
  },
  actionBtn: {
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
  },
  secondaryText: {
    ...textStyles.button,
    color: colors.textSecondary,
  },
  primaryActionText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
  maxLength: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    rowGap: spacing.md,
  },
  permissionTitle: {
    ...textStyles.h3,
    color: colors.textHeading,
    textAlign: 'center',
  },
  permissionBody: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  permissionBtnText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
});

export default VoiceNoteScreen;
