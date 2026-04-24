/**
 * ScanScreen — full-screen QR / barcode scanner used by the
 * "Scan QR" tile in the quick-add sheet.
 *
 * Detects QR codes (and common 1D barcodes); the first detected payload
 * is passed back to the caller via `onScanned`. The screen handles
 * camera permission requests and exposes a "scan again" affordance after
 * a hit so the user can retry without re-mounting.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';

import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface ScanResultPayload {
  type: string;
  value: string;
}

export interface ScanScreenProps {
  onClose: () => void;
  onScanned?: (result: ScanResultPayload) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onClose,
  onScanned,
}) => {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastResult, setLastResult] = useState<ScanResultPayload | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcode = useCallback(
    (event: BarcodeScanningResult): void => {
      if (lockRef.current) return;
      lockRef.current = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const payload: ScanResultPayload = {
        type: event.type,
        value: event.data,
      };
      setLastResult(payload);
      onScanned?.(payload);
    },
    [onScanned]
  );

  const onScanAgain = useCallback((): void => {
    setLastResult(null);
    lockRef.current = false;
  }, []);

  const renderBody = (): React.ReactNode => {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionWrap}>
          <Icon name="camera-outline" size={48} color={colors.primary} />
          <Text style={styles.permissionTitle}>
            {t('scan.permissionTitle')}
          </Text>
          <Text style={styles.permissionBody}>{t('scan.permissionBody')}</Text>
          <Pressable
            onPress={() => {
              void requestPermission();
            }}
            style={styles.permissionBtn}
            accessibilityRole="button"
          >
            <Text style={styles.permissionBtnText}>
              {t('scan.grantPermission')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'code93',
              'pdf417',
              'datamatrix',
            ],
          }}
          onBarcodeScanned={lastResult ? undefined : handleBarcode}
        />

        <View style={styles.frameOverlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.subtitle}>{t('scan.subtitle')}</Text>
        </View>

        {lastResult ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultLabel}>{lastResult.type}</Text>
            <Text style={styles.resultValue} numberOfLines={3}>
              {lastResult.value}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={onScanAgain}
                style={[styles.actionBtn, styles.secondaryBtn]}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryText}>
                  {t('scan.scanAgain')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={[styles.actionBtn, styles.primaryBtn]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryText}>{t('scan.useCard')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <Header
        title={t('scan.title')}
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
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
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
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  frameOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 260,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.primaryLighter,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textInverse,
    marginTop: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  resultPanel: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
  },
  resultLabel: {
    ...textStyles.overline,
    color: colors.primary,
  },
  resultValue: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    backgroundColor: colors.background,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryText: {
    ...textStyles.button,
    color: colors.primary,
  },
  primaryText: {
    ...textStyles.button,
    color: colors.textInverse,
  },
});

export default ScanScreen;
