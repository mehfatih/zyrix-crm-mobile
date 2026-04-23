/**
 * QRCodeDisplay — renders a base64-encoded PNG QR code (issued by the
 * backend, e.g. ZATCA TLV) with an optional label and a tap-to-zoom
 * modal. When `base64Data` is empty we render a placeholder card so
 * the surrounding layout doesn't shift.
 */

import React, { useState } from 'react';
import {
  Image,
  Modal,
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

export interface QRCodeDisplayProps {
  base64Data?: string;
  size?: number;
  label?: string;
}

const DATA_URI_PREFIX = 'data:image/png;base64,';

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  base64Data,
  size = 150,
  label,
}) => {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);

  if (!base64Data) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <Icon
          name="qr-code-outline"
          size={48}
          color={colors.textMuted}
        />
        <Text style={styles.placeholderText}>
          {t('zatca.qrPending', { defaultValue: 'QR code will appear after submission' })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setZoomed(true)}>
        <Image
          source={{ uri: `${DATA_URI_PREFIX}${base64Data}` }}
          style={{ width: size, height: size, borderRadius: radius.base }}
          resizeMode="contain"
          accessibilityLabel={label ?? 'QR code'}
        />
      </Pressable>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Modal
        transparent
        visible={zoomed}
        animationType="fade"
        onRequestClose={() => setZoomed(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setZoomed(false)}>
          <View style={styles.modalCard}>
            <Image
              source={{ uri: `${DATA_URI_PREFIX}${base64Data}` }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            {label ? <Text style={styles.modalLabel}>{label}</Text> : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    rowGap: spacing.xs,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    rowGap: spacing.xs,
  },
  placeholderText: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalImage: {
    width: 280,
    height: 280,
  },
  modalLabel: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
});

export default QRCodeDisplay;
