/**
 * AttachFilePicker — bottom-sheet file picker reused across record
 * detail screens (customer, deal, quote, contract, report).
 *
 * Three sources:
 *   1. Device — expo-document-picker; we upload the bytes via the
 *      backend's local-storage attach endpoint.
 *   2. Google Drive — opens a file browser, lets the user pick,
 *      shows a confirmation dialog before calling
 *      `googleDriveService.attachToRecord()`.
 *   3. Microsoft 365 — same flow against `microsoftService`.
 *
 * Sprint-5 spec is explicit: confirmation is required before any
 * cloud file is attached. No silent sync. The cloud picker shows the
 * file's name + size and asks "Attach this file to {recordName}?"
 * before issuing the backend call.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';

import { apiPost } from '../../api/client';
import { Icon, type AnyIconName } from '../common/Icon';
import { useToast } from '../../hooks/useToast';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import {
  googleDriveService,
  type AttachableRecordType,
  type DriveFile,
} from '../../services/integrations/googleDrive';
import {
  microsoftService,
  type MSFile,
} from '../../services/integrations/microsoft';

export type AttachSource = 'device' | 'drive' | 'onedrive';

export interface AttachFilePickerProps {
  visible: boolean;
  onClose: () => void;
  recordType: AttachableRecordType;
  recordId: string;
  recordName?: string;
  onAttached?: () => void;
}

interface CloudFileRow {
  id: string;
  name: string;
  size?: number;
  modifiedAt?: string;
  webUrl?: string;
}

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export const AttachFilePicker: React.FC<AttachFilePickerProps> = ({
  visible,
  onClose,
  recordType,
  recordId,
  recordName,
  onAttached,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [driveAvailable, setDriveAvailable] = useState(false);
  const [msAvailable, setMsAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const [browser, setBrowser] = useState<{
    source: 'drive' | 'onedrive';
    files: CloudFileRow[];
  } | null>(null);

  useEffect(() => {
    if (!visible) {
      setBrowser(null);
      return;
    }
    void (async () => {
      const [d, m] = await Promise.all([
        googleDriveService.isConnected(),
        microsoftService.isConnected(),
      ]);
      setDriveAvailable(d);
      setMsAvailable(m);
    })();
  }, [visible]);

  const handleDevicePick = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      await apiPost('/api/integrations/local/attach', {
        provider: 'local',
        fileName: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        uri: asset.uri,
        recordType,
        recordId,
      });
      toast.success(t('files.attached'));
      onAttached?.();
      onClose();
    } catch (err) {
      toast.error(t('common.error'), String(err));
    } finally {
      setBusy(false);
    }
  }, [onAttached, onClose, recordId, recordType, t, toast]);

  const openCloudBrowser = useCallback(
    async (source: 'drive' | 'onedrive'): Promise<void> => {
      setBusy(true);
      try {
        if (source === 'drive') {
          const files = await googleDriveService.listFiles();
          setBrowser({
            source,
            files: files.map((f: DriveFile) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              modifiedAt: f.modifiedTime,
              webUrl: f.webViewLink,
            })),
          });
        } else {
          const files = await microsoftService.listFiles();
          setBrowser({
            source,
            files: files.map((f: MSFile) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              modifiedAt: f.lastModifiedDateTime,
              webUrl: f.webUrl,
            })),
          });
        }
      } catch (err) {
        toast.error(t('common.error'), String(err));
      } finally {
        setBusy(false);
      }
    },
    [t, toast]
  );

  const confirmAttach = useCallback(
    (file: CloudFileRow): void => {
      if (!browser) return;
      const target = recordName ?? t(`files.recordType.${recordType}`);
      Alert.alert(
        t('files.confirmAttachTitle'),
        t('files.confirmAttachBody', { name: file.name, target }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('files.attachFile'),
            onPress: async () => {
              setBusy(true);
              try {
                if (browser.source === 'drive') {
                  await googleDriveService.attachToRecord(
                    file.id,
                    recordType,
                    recordId
                  );
                } else {
                  await microsoftService.attachToRecord(
                    file.id,
                    recordType,
                    recordId
                  );
                }
                toast.success(t('files.attached'));
                onAttached?.();
                onClose();
              } catch (err) {
                toast.error(t('common.error'), String(err));
              } finally {
                setBusy(false);
              }
            },
          },
        ]
      );
    },
    [browser, onAttached, onClose, recordId, recordName, recordType, t, toast]
  );

  const renderCloudRow = ({ item }: { item: CloudFileRow }): React.ReactElement => (
    <Pressable
      onPress={() => confirmAttach(item)}
      style={({ pressed }) => [
        styles.fileRow,
        pressed ? { backgroundColor: zyrixTheme.cardHover } : null,
      ]}
    >
      <View style={styles.fileIconWrap}>
        <Icon name="document-text-outline" size={20} color={zyrixTheme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileMeta}>{formatBytes(item.size)}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={zyrixTheme.textMuted} />
    </Pressable>
  );

  const renderOption = (
    label: string,
    iconName: AnyIconName,
    iconColor: string,
    onPress: () => void,
    disabled?: boolean,
    helper?: string
  ): React.ReactElement => (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.option,
        pressed && !disabled ? { backgroundColor: zyrixTheme.cardHover } : null,
        disabled ? { opacity: 0.5 } : null,
      ]}
    >
      <View style={[styles.optIcon, { backgroundColor: `${iconColor}1A` }]}>
        <Icon name={iconName} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optLabel}>{label}</Text>
        {helper ? <Text style={styles.optHelper}>{helper}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={18} color={zyrixTheme.textMuted} />
    </Pressable>
  );

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />

          {!browser ? (
            <>
              <Text style={styles.title}>{t('files.attachFile')}</Text>
              <Text style={styles.subtitle}>
                {recordName
                  ? t('files.attachFor', { name: recordName })
                  : t('files.attachSubtitle')}
              </Text>

              {renderOption(
                t('files.uploadFromDevice'),
                'phone-portrait-outline',
                zyrixTheme.primary,
                handleDevicePick
              )}
              {renderOption(
                t('files.pickFromDrive'),
                'cloud-outline',
                '#4285F4',
                () => void openCloudBrowser('drive'),
                !driveAvailable,
                driveAvailable ? undefined : t('files.notConnectedHelper')
              )}
              {renderOption(
                t('files.pickFromOneDrive'),
                'cloud-outline',
                '#0078D4',
                () => void openCloudBrowser('onedrive'),
                !msAvailable,
                msAvailable ? undefined : t('files.notConnectedHelper')
              )}

              {busy ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={zyrixTheme.primary} />
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.browserHeader}>
                <Pressable
                  onPress={() => setBrowser(null)}
                  hitSlop={12}
                  style={styles.backBtn}
                >
                  <Icon
                    name="chevron-back"
                    size={20}
                    color={zyrixTheme.primary}
                  />
                </Pressable>
                <Text style={styles.title}>
                  {browser.source === 'drive'
                    ? t('files.pickFromDrive')
                    : t('files.pickFromOneDrive')}
                </Text>
              </View>

              {busy ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={zyrixTheme.primary} />
                </View>
              ) : (
                <FlatList
                  data={browser.files}
                  keyExtractor={(f) => f.id}
                  renderItem={renderCloudRow}
                  ListEmptyComponent={
                    <Text style={styles.empty}>{t('files.empty')}</Text>
                  }
                  style={{ maxHeight: 360 }}
                />
              )}
            </>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AttachFilePicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: zyrixTheme.cardBg,
    borderTopLeftRadius: zyrixRadius.xxl,
    borderTopRightRadius: zyrixRadius.xxl,
    paddingHorizontal: zyrixSpacing.base,
    paddingBottom: zyrixSpacing.lg,
    paddingTop: zyrixSpacing.sm,
    rowGap: 10,
    ...zyrixShadows.modal,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: zyrixTheme.border,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  subtitle: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: zyrixRadius.lg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    backgroundColor: zyrixTheme.surface,
  },
  optIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: zyrixTheme.textHeading,
  },
  optHelper: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
    marginTop: 2,
  },
  busyRow: {
    paddingVertical: zyrixSpacing.lg,
    alignItems: 'center',
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: zyrixRadius.base,
  },
  fileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zyrixTheme.aiSurface,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: zyrixTheme.textHeading,
  },
  fileMeta: { fontSize: 11, color: zyrixTheme.textMuted, marginTop: 2 },
  empty: {
    textAlign: 'center',
    color: zyrixTheme.textMuted,
    paddingVertical: zyrixSpacing.lg,
    fontSize: 13,
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.surfaceAlt,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: zyrixTheme.textBody,
  },
});
