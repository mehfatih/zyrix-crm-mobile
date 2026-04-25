/**
 * IntegrationsScreen — AI Sprint 5, section 13 entry point.
 *
 * Lets the user connect / disconnect cloud-storage providers (Google
 * Drive, Microsoft 365). Each provider card refreshes its connected
 * state from the underlying service whenever the screen mounts or an
 * action completes. Communication / e-commerce sections are wired in
 * later sprints — this screen simply scaffolds the layout so they slot
 * in without churn.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../../theme/zyrixTheme';
import { googleDriveService } from '../../../services/integrations/googleDrive';
import { microsoftService } from '../../../services/integrations/microsoft';
import { hitSlop } from '../../../constants/spacing';
import { colors } from '../../../constants/colors';

interface ProviderCardProps {
  name: string;
  iconName: AnyIconName;
  iconColor: string;
  connected: boolean;
  busy: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  iconName,
  iconColor,
  connected,
  busy,
  onConnect,
  onDisconnect,
}) => {
  const { t } = useTranslation();

  const handlePress = async (): Promise<void> => {
    try {
      if (connected) await onDisconnect();
      else await onConnect();
    } catch (err) {
      Alert.alert(t('common.error'), String(err));
    }
  };

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <Icon name={iconName} size={24} color={iconColor} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{name}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: connected
                  ? zyrixTheme.success
                  : zyrixTheme.textMuted,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {connected
              ? t('integrations.connected')
              : t('integrations.notConnected')}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handlePress}
        disabled={busy}
        style={({ pressed }) => [
          styles.actionBtn,
          connected ? styles.disconnectBtn : styles.connectBtn,
          pressed ? { opacity: 0.85 } : null,
          busy ? { opacity: 0.5 } : null,
        ]}
      >
        {busy ? (
          <ActivityIndicator
            size="small"
            color={connected ? zyrixTheme.danger : zyrixTheme.textInverse}
          />
        ) : (
          <Text
            style={[
              styles.actionText,
              connected ? styles.disconnectText : styles.connectText,
            ]}
          >
            {connected
              ? t('integrations.disconnect')
              : t('integrations.connect')}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export const IntegrationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [driveConnected, setDriveConnected] = useState(false);
  const [msConnected, setMsConnected] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [msBusy, setMsBusy] = useState(false);

  const refreshStatus = useCallback(async (): Promise<void> => {
    const [drive, ms] = await Promise.all([
      googleDriveService.isConnected(),
      microsoftService.isConnected(),
    ]);
    setDriveConnected(drive);
    setMsConnected(ms);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleDriveConnect = async (): Promise<void> => {
    setDriveBusy(true);
    try {
      const ok = await googleDriveService.connect();
      if (ok) await refreshStatus();
      else Alert.alert(t('integrations.title'), t('integrations.connectFailed'));
    } finally {
      setDriveBusy(false);
    }
  };

  const handleDriveDisconnect = async (): Promise<void> => {
    setDriveBusy(true);
    try {
      await googleDriveService.disconnect();
      await refreshStatus();
    } finally {
      setDriveBusy(false);
    }
  };

  const handleMsConnect = async (): Promise<void> => {
    setMsBusy(true);
    try {
      const ok = await microsoftService.connect();
      if (ok) await refreshStatus();
      else Alert.alert(t('integrations.title'), t('integrations.connectFailed'));
    } finally {
      setMsBusy(false);
    }
  };

  const handleMsDisconnect = async (): Promise<void> => {
    setMsBusy(true);
    try {
      await microsoftService.disconnect();
      await refreshStatus();
    } finally {
      setMsBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('navigation.integrations')}
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
        <Text style={styles.title}>{t('integrations.title')}</Text>
        <Text style={styles.subtitle}>{t('integrations.subtitle')}</Text>

        <Text style={styles.sectionTitle}>
          {t('integrations.fileStorage')}
        </Text>
        <ProviderCard
          name="Google Drive"
          iconName="cloud-outline"
          iconColor="#4285F4"
          connected={driveConnected}
          busy={driveBusy}
          onConnect={handleDriveConnect}
          onDisconnect={handleDriveDisconnect}
        />
        <ProviderCard
          name="Microsoft 365"
          iconName="cloud-outline"
          iconColor="#0078D4"
          connected={msConnected}
          busy={msBusy}
          onConnect={handleMsConnect}
          onDisconnect={handleMsDisconnect}
        />

        <Text style={styles.helper}>{t('integrations.privacyNote')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default IntegrationsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: zyrixTheme.surfaceAlt },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: zyrixSpacing.base,
    rowGap: zyrixSpacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  subtitle: {
    fontSize: 13,
    color: zyrixTheme.textMuted,
    marginBottom: zyrixSpacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: zyrixTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: zyrixSpacing.sm,
    marginBottom: zyrixSpacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
    backgroundColor: zyrixTheme.cardBg,
    borderRadius: zyrixRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    ...zyrixShadows.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginTop: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: zyrixTheme.textMuted },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: zyrixRadius.base,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: { backgroundColor: zyrixTheme.primary },
  disconnectBtn: {
    backgroundColor: zyrixTheme.surfaceAlt,
    borderWidth: 1,
    borderColor: zyrixTheme.border,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  connectText: { color: zyrixTheme.textInverse },
  disconnectText: { color: zyrixTheme.danger },
  helper: {
    marginTop: zyrixSpacing.base,
    fontSize: 12,
    color: zyrixTheme.textMuted,
    lineHeight: 18,
  },
});
