/**
 * UploadMeetingScreen — file uploader + processing state. On upload
 * completion navigates to `MeetingDetail` for the freshly-analysed
 * meeting.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { FileUploader, type UploadedFile } from '../../../components/forms/FileUploader';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { darkColors } from '../../../theme/dark';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { uploadMeetingRecording } from '../../../api/ai';
import { useToast } from '../../../hooks/useToast';

export const UploadMeetingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>(
    'idle'
  );

  const submit = async (): Promise<void> => {
    if (!file) return;
    setStatus('uploading');
    try {
      const { meetingId } = await uploadMeetingRecording({
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        size: file.size,
      });
      setStatus('processing');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus('done');
      toast.success(t('common.success'));
      (navigation as unknown as {
        navigate: (route: string, params?: unknown) => void;
      }).navigate('MeetingDetail', { meetingId });
    } catch (err) {
      console.warn('[uploadMeeting] failed', err);
      toast.error(t('common.error'));
      setStatus('idle');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('meetings.uploadRecording')}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.scroll}>
        <FileUploader
          label={t('meetings.uploadRecording')}
          value={file ? [file] : []}
          onUpload={(uploaded) => setFile(uploaded)}
          onRemove={() => setFile(null)}
          acceptedTypes={['audio/*', 'video/*']}
          maxSizeMB={100}
        />

        {status === 'uploading' ? (
          <StatusCard
            icon="cloud-upload-outline"
            title={t('meetings.uploadRecording')}
            body={t('files.uploading')}
          />
        ) : null}
        {status === 'processing' ? (
          <StatusCard
            icon="sparkles-outline"
            title={t('meetings.processing')}
            body={t('common.loading')}
          />
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          label={t('meetings.uploadRecording')}
          onPress={() => void submit()}
          disabled={!file || status !== 'idle'}
          loading={status === 'uploading' || status === 'processing'}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const StatusCard: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
}> = ({ icon, title, body }) => (
  <View style={styles.statusCard}>
    <Icon name={icon} size={28} color={darkColors.primary} />
    <Text style={styles.statusTitle}>{title}</Text>
    <Text style={styles.statusBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    flex: 1,
    padding: spacing.base,
    rowGap: spacing.base,
  },
  statusCard: {
    backgroundColor: darkColors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  statusTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  statusBody: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
    backgroundColor: darkColors.surface,
  },
});

export default UploadMeetingScreen;
