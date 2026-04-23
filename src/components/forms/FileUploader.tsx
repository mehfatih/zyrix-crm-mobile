/**
 * FileUploader — tap-to-upload component that opens the platform's
 * image / document picker via `expo-image-picker` and
 * `expo-document-picker`. When the native modules aren't available
 * (e.g. bare Expo Go without the dev build), falls back to an alert
 * so the rest of the UI keeps working.
 *
 * Sprint 5 version keeps the API surface honest — `onUpload` receives
 * the chosen asset — and defers progress bars / actual remote upload
 * to the future when the backend's object storage lands.
 */

import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface UploadedFile {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  kind: 'image' | 'document';
}

export interface FileUploaderProps {
  value?: readonly UploadedFile[];
  onUpload: (file: UploadedFile) => void;
  onRemove?: (id: string) => void;
  acceptedTypes?: readonly string[];
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
}

type PickerSource = 'camera' | 'gallery' | 'files';

const genId = (): string =>
  `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const FileUploader: React.FC<FileUploaderProps> = ({
  value = [],
  onUpload,
  onRemove,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSizeMB = 10,
  multiple = false,
  label,
}) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const pick = async (source: PickerSource): Promise<void> => {
    setSheetOpen(false);

    try {
      if (source === 'camera' || source === 'gallery') {
        if (source === 'camera') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(t('files.uploadFailed'));
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

          if (result.canceled || result.assets.length === 0) return;

          const asset = result.assets[0];
          if (!asset) return;

          onUpload({
            id: genId(),
            name: asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg',
            uri: asset.uri,
            mimeType: asset.mimeType,
            size: asset.fileSize,
            kind: 'image',
          });
          return;
        }

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(t('files.uploadFailed'));
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: multiple,
          quality: 0.8,
        });

        if (result.canceled) return;

        result.assets.forEach((asset) => {
          onUpload({
            id: genId(),
            name: asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg',
            uri: asset.uri,
            mimeType: asset.mimeType,
            size: asset.fileSize,
            kind: 'image',
          });
        });
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes as string[],
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      if (asset.size && asset.size > maxSizeMB * 1024 * 1024) {
        Alert.alert(t('files.uploadFailed'));
        return;
      }

      onUpload({
        id: genId(),
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
        kind: 'document',
      });
    } catch (err) {
      console.warn('[FileUploader] pick failed', err);
      Alert.alert(t('files.uploadFailed'));
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.dropzone,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="cloud-upload-outline" size={36} color={colors.primary} />
        <Text style={styles.dropText}>{t('files.tapToUpload')}</Text>
        <Text style={styles.dropMeta}>
          {`${t('files.acceptedTypes')}: ${acceptedTypes.join(', ')}`}
        </Text>
        <Text style={styles.dropMeta}>
          {`${t('files.maxSize')}: ${maxSizeMB} MB`}
        </Text>
      </Pressable>

      {value.length > 0 ? (
        <View style={styles.list}>
          {value.map((file) => (
            <View key={file.id} style={styles.fileRow}>
              {file.kind === 'image' ? (
                <Image source={{ uri: file.uri }} style={styles.thumb} />
              ) : (
                <View style={styles.docIcon}>
                  <Icon
                    name="document-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
              )}

              <View style={styles.fileBody}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size ? (
                  <Text style={styles.fileMeta}>
                    {`${(file.size / 1024).toFixed(1)} KB`}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => onRemove?.(file.id)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Icon name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Modal
        transparent
        visible={sheetOpen}
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('files.tapToUpload')}</Text>

            <SheetOption
              icon="camera-outline"
              label="Camera"
              onPress={() => void pick('camera')}
            />
            <SheetOption
              icon="images-outline"
              label="Photo Library"
              onPress={() => void pick('gallery')}
            />
            <SheetOption
              icon="document-outline"
              label="Files"
              onPress={() => void pick('files')}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const SheetOption: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.sheetRow,
      pressed ? { backgroundColor: colors.primarySoft } : null,
    ]}
  >
    <Icon name={icon} size={22} color={colors.primary} />
    <Text style={styles.sheetLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: spacing.md },

  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  dropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
    rowGap: spacing.xs,
  },

  dropText: {
    ...textStyles.bodyMedium,
    color: colors.primaryDark,
  },

  dropMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },

  list: {
    marginTop: spacing.sm,
    rowGap: spacing.sm,
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.base,
    columnGap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },

  docIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fileBody: { flex: 1 },

  fileName: {
    ...textStyles.body,
    color: colors.textPrimary,
  },

  fileMeta: {
    ...textStyles.caption,
    color: colors.textMuted,
  },

  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
  },

  sheetTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.base,
  },

  sheetLabel: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
  },
});

export default FileUploader;