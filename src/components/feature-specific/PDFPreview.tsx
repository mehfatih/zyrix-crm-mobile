/**
 * PDFPreview — lightweight PDF placeholder.
 *
 * Real PDF rendering needs `react-native-pdf` (native module, requires
 * a dev build) which isn't part of Zyrix's bundle yet. Sprint 5 ships
 * a minimal preview that shows the document metadata and exposes
 * download + share actions so the calling screens have the full UX
 * hooked up. When `react-native-pdf` lands we swap the placeholder for
 * the real viewer without touching callers.
 */

import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface PDFPreviewProps {
  url: string;
  fileName?: string;
  pageCount?: number;
  size?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  url,
  fileName,
  pageCount,
  size,
}) => {
  const { t } = useTranslation();

  const openInBrowser = async (): Promise<void> => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t('files.uploadFailed'), url);
    }
  };

  const shareDocument = async (): Promise<void> => {
    if (await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(url, { dialogTitle: fileName ?? 'PDF' });
      } catch (err) {
        console.warn('[PDFPreview] share failed', err);
      }
      return;
    }

    await openInBrowser();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="document-outline" size={36} color={colors.primary} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName ?? 'document.pdf'}
          </Text>
          <Text style={styles.detail}>
            {pageCount
              ? `${pageCount} ${t('common.continue').toLowerCase()}`
              : 'PDF'}
            {size ? ` · ${size}` : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.placeholderText}>
        {t('placeholders.comingInSprint', { sprint: 6 })}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={openInBrowser}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="download-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>{t('common.save')}</Text>
        </Pressable>

        <Pressable
          onPress={shareDocument}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="share-outline" size={18} color={colors.textInverse} />
          <Text style={[styles.actionText, { color: colors.textInverse }]}>
            {t('common.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.base,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  fileName: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  detail: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  placeholderText: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceAlt,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    ...textStyles.button,
    color: colors.primary,
  },
});

export default PDFPreview;