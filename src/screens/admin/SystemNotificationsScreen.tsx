/**
 * SystemNotificationsScreen — compose and send platform-wide
 * announcements (email/SMS/in-app) to the chosen audience.
 */

import React, { useState } from 'react';
import {
  Alert,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useSendSystemNotification } from '../../hooks/useAdmin';

type Audience = 'all' | 'plan' | 'country' | 'company';
type Channel = 'inApp' | 'email' | 'sms';

const AUDIENCES: readonly Audience[] = ['all', 'plan', 'country', 'company'];
const CHANNELS: readonly Channel[] = ['inApp', 'email', 'sms'];

export const SystemNotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sendMut = useSendSystemNotification();

  const [audience, setAudience] = useState<Audience>('all');
  const [audienceValue, setAudienceValue] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<Channel[]>(['inApp']);
  const [scheduleAt, setScheduleAt] = useState('');

  const toggleChannel = (channel: Channel): void => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((entry) => entry !== channel)
        : [...prev, channel]
    );
  };

  const send = async (): Promise<void> => {
    if (!title.trim() || !body.trim() || channels.length === 0) {
      Alert.alert(t('forms.required'));
      return;
    }
    try {
      await sendMut.mutateAsync({
        audience,
        audienceValue: audienceValue || undefined,
        channels,
        title,
        body,
        scheduleAt: scheduleAt || undefined,
      });
      navigation.goBack();
    } catch (err) {
      console.warn('[notifications] failed', err);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.systemNotifications')}
        showBack={false}
        leftSlot={
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={hitSlop.md}
            style={styles.headerBtn}
          >
            <Icon name="menu-outline" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('systemNotifications.audience')}
          </Text>
          <View style={styles.row}>
            {AUDIENCES.map((entry) => (
              <Pressable
                key={entry}
                onPress={() => setAudience(entry)}
                style={[
                  styles.chip,
                  audience === entry ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    audience === entry ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`systemNotifications.${entry === 'all' ? 'allUsers' : `specific${entry.charAt(0).toUpperCase()}${entry.slice(1)}`}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {audience !== 'all' ? (
            <Field
              label={`${audience} value`}
              value={audienceValue}
              onChange={setAudienceValue}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('systemNotifications.channel')}
          </Text>
          <View style={styles.row}>
            {CHANNELS.map((entry) => (
              <Pressable
                key={entry}
                onPress={() => toggleChannel(entry)}
                style={[
                  styles.chip,
                  channels.includes(entry) ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    channels.includes(entry)
                      ? { color: colors.textInverse }
                      : null,
                  ]}
                >
                  {t(`systemNotifications.${entry}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Title" value={title} onChange={setTitle} />
          <Text style={styles.fieldLabel}>Body</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="Use {{userName}} and {{companyName}} for personalisation"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textarea,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
          <Field
            label="Schedule (ISO datetime, leave empty for now)"
            value={scheduleAt}
            onChange={setScheduleAt}
          />
        </View>

        <View style={styles.previewCard}>
          <Icon name="megaphone-outline" size={20} color={colors.primary} />
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle}>{title || 'Untitled'}</Text>
            <Text style={styles.previewText} numberOfLines={4}>
              {body || '...'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            scheduleAt
              ? t('systemNotifications.scheduleLater')
              : t('systemNotifications.sendNow')
          }
          onPress={() => void send()}
          loading={sendMut.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={[
        styles.input,
        { textAlign: I18nManager.isRTL ? 'right' : 'left' },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.base,
    rowGap: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  field: { rowGap: spacing.xs },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 44,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    padding: spacing.base,
    borderRadius: radius.lg,
    columnGap: spacing.sm,
  },
  previewBody: { flex: 1 },
  previewTitle: { ...textStyles.bodyMedium, color: colors.primaryDark },
  previewText: { ...textStyles.body, color: colors.primaryDark },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default SystemNotificationsScreen;
