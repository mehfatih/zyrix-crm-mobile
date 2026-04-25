/**
 * AttachedFilesSection — record-detail card that lists files attached
 * to a customer / deal / quote / contract / report and exposes the
 * AttachFilePicker for adding new ones.
 *
 * Files come from the backend via `/api/integrations/files/:type/:id`.
 * The list refreshes whenever the picker reports a successful attach.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { apiDelete, apiGet } from '../../api/client';
import { Icon, type AnyIconName } from '../common/Icon';
import { useToast } from '../../hooks/useToast';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { AttachFilePicker } from './AttachFilePicker';
import type { AttachableRecordType } from '../../services/integrations/googleDrive';

interface AttachedFile {
  id: string;
  provider: 'google-drive' | 'microsoft' | 'local';
  fileName: string;
  webUrl?: string;
  attachedAt: string;
}

export interface AttachedFilesSectionProps {
  recordType: AttachableRecordType;
  recordId: string;
  recordName?: string;
}

const providerMeta: Record<
  AttachedFile['provider'],
  { label: string; color: string; icon: AnyIconName }
> = {
  'google-drive': { label: 'Drive', color: '#4285F4', icon: 'cloud-outline' },
  microsoft: { label: 'OneDrive', color: '#0078D4', icon: 'cloud-outline' },
  local: { label: 'Device', color: zyrixTheme.primary, icon: 'phone-portrait-outline' },
};

export const AttachedFilesSection: React.FC<AttachedFilesSectionProps> = ({
  recordType,
  recordId,
  recordName,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!recordId) return;
    setLoading(true);
    try {
      const result = await apiGet<{ items: AttachedFile[] }>(
        `/api/integrations/files/${recordType}/${recordId}`
      );
      setFiles(result.items ?? []);
    } catch {
      // Backend may not be live yet; keep silent so the card still renders.
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [recordId, recordType]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpen = (file: AttachedFile): void => {
    if (!file.webUrl) return;
    void Linking.openURL(file.webUrl);
  };

  const handleRemove = (file: AttachedFile): void => {
    Alert.alert(
      t('files.removeTitle'),
      t('files.removeBody', { name: file.fileName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/integrations/files/${file.id}`);
              toast.success(t('files.removed'));
              await load();
            } catch (err) {
              toast.error(t('common.error'), String(err));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('files.attached')}</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.attachBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Icon name="add" size={16} color={zyrixTheme.textInverse} />
          <Text style={styles.attachBtnText}>{t('files.attachFile')}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={zyrixTheme.primary} />
      ) : files.length === 0 ? (
        <Text style={styles.empty}>{t('files.noneAttached')}</Text>
      ) : (
        <View style={styles.list}>
          {files.map((file) => {
            const meta = providerMeta[file.provider];
            return (
              <Pressable
                key={file.id}
                onPress={() => handleOpen(file)}
                style={({ pressed }) => [
                  styles.row,
                  pressed ? { backgroundColor: zyrixTheme.cardHover } : null,
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1A` }]}>
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  <Text style={styles.fileMeta}>{meta.label}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => handleRemove(file)}
                  style={styles.removeBtn}
                >
                  <Icon name="close" size={16} color={zyrixTheme.textMuted} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}

      <AttachFilePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        recordType={recordType}
        recordId={recordId}
        recordName={recordName}
        onAttached={() => void load()}
      />
    </View>
  );
};

export default AttachedFilesSection;

const styles = StyleSheet.create({
  card: {
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: zyrixSpacing.base,
    marginHorizontal: zyrixSpacing.base,
    marginTop: zyrixSpacing.sm,
    rowGap: zyrixSpacing.sm,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    backgroundColor: zyrixTheme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: zyrixRadius.base,
  },
  attachBtnText: {
    color: zyrixTheme.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    paddingVertical: zyrixSpacing.sm,
  },
  list: { rowGap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: zyrixRadius.base,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: zyrixTheme.textHeading,
  },
  fileMeta: { fontSize: 11, color: zyrixTheme.textMuted, marginTop: 2 },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
