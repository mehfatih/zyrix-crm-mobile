/**
 * ShopifyScreen — connect a Shopify store via OAuth from mobile.
 *
 * Flow (Q1: deep-link scheme is `zyrix`):
 *   1. POST /api/integrations/shopify/connect?platform=mobile { shop }
 *      → backend returns an authorizeUrl.
 *   2. WebBrowser.openAuthSessionAsync(authorizeUrl, 'zyrix://shopify/connected')
 *      runs the full OAuth flow in an in-app browser; the backend completes
 *      it and redirects to the deep link with ?status=connected|error&code=...
 *   3. We parse the returned URL, then refresh /status to render state.
 *
 * No access token is ever entered or seen — only a store domain.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { Input } from '../../../components/common/Input';
import { darkColors } from '../../../theme/dark';
import { zyrixRadius, zyrixShadows, zyrixSpacing } from '../../../theme/zyrixTheme';
import { layout } from '../../../constants/spacing';
import {
  connectShopify,
  disconnectShopify,
  getShopifyStatus,
  errorCodeToKey,
  extractErrorCode,
  shopIsValid,
  type ShopifyConnection,
  type ShopifyLegacyStore,
} from '../../../api/shopifyOauth';

// Deep link the backend redirects to on completion (MOBILE_DEEP_LINK_SCHEME).
const RETURN_URL = 'zyrix://shopify/connected';

const STATUS_COLOR: Record<string, string> = {
  connected: darkColors.success,
  needs_reauth: darkColors.error,
  error: darkColors.error,
  revoked: darkColors.textMuted,
  pending: darkColors.textMuted,
  legacy_manual: darkColors.primary,
};

function parseQuery(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return out;
  for (const pair of url.slice(qIndex + 1).split('&')) {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}

export const ShopifyScreen: React.FC = () => {
  const { t } = useTranslation();

  const [shop, setShop] = useState('');
  const [touched, setTouched] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ShopifyConnection[]>([]);
  const [legacy, setLegacy] = useState<ShopifyLegacyStore[]>([]);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await getShopifyStatus();
      setConnections(s.connections);
      setLegacy(s.legacy);
    } catch {
      /* surfaced on actions */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const valid = shopIsValid(shop);

  const startConnect = async (domain: string) => {
    setConnecting(true);
    setBanner(null);
    try {
      const { authorizeUrl } = await connectShopify(domain.trim());
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, RETURN_URL);
      if (result.type === 'success' && result.url) {
        const q = parseQuery(result.url);
        if (q.status === 'connected') {
          setBanner({ kind: 'success', text: t('shopifyIntegration.connectedBanner') });
          await refresh();
        } else if (q.status === 'error') {
          setBanner({ kind: 'error', text: t(`integrationErrors.${errorCodeToKey(q.code)}`) });
        }
      }
      // result.type 'cancel' | 'dismiss' → user backed out; no banner.
    } catch (err) {
      setBanner({ kind: 'error', text: t(`integrationErrors.${extractErrorCode(err)}`) });
    } finally {
      setConnecting(false);
    }
  };

  const onConnect = () => {
    setTouched(true);
    if (!valid) return;
    void startConnect(shop);
  };

  const onDisconnect = async (id: string) => {
    setBusyId(id);
    try {
      await disconnectShopify(id);
      await refresh();
    } catch (err) {
      setBanner({ kind: 'error', text: t(`integrationErrors.${extractErrorCode(err)}`) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('shopifyIntegration.title')} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{t('shopifyIntegration.subtitle')}</Text>

        {banner ? (
          <View
            style={[
              styles.banner,
              banner.kind === 'success' ? styles.bannerOk : styles.bannerErr,
            ]}
          >
            <Icon
              name={banner.kind === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={banner.kind === 'success' ? darkColors.success : darkColors.error}
            />
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        ) : null}

        {/* Connect card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('shopifyIntegration.connectTitle')}</Text>
          <Input
            label={t('shopifyIntegration.domainLabel')}
            placeholder="your-store.myshopify.com"
            value={shop}
            onChangeText={setShop}
            onBlur={() => setTouched(true)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={touched && !valid ? t('shopifyIntegration.domainInvalid') : undefined}
            helperText={t('shopifyIntegration.domainHint')}
          />
          <Pressable
            onPress={onConnect}
            disabled={connecting}
            style={({ pressed }) => [
              styles.connectBtn,
              pressed ? { opacity: 0.85 } : null,
              connecting ? { opacity: 0.6 } : null,
            ]}
          >
            {connecting ? (
              <ActivityIndicator size="small" color={darkColors.textOnPrimary} />
            ) : (
              <Icon name="link-outline" size={18} color={darkColors.textOnPrimary} />
            )}
            <Text style={styles.connectText}>{t('shopifyIntegration.connectButton')}</Text>
          </Pressable>
          <View style={styles.securityRow}>
            <Icon name="shield-checkmark-outline" size={14} color={darkColors.success} />
            <Text style={styles.securityText}>{t('shopifyIntegration.securityNote')}</Text>
          </View>
        </View>

        {/* Connections */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={darkColors.primary} />
        ) : connections.length === 0 && legacy.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="storefront-outline" size={28} color={darkColors.textMuted} />
            <Text style={styles.emptyTitle}>{t('shopifyIntegration.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('shopifyIntegration.emptySubtitle')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('shopifyIntegration.connectionsTitle')}</Text>
            {connections.map((c) => (
              <View key={c.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowDomain}>{c.shopDomain}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.status] ?? darkColors.textMuted }]} />
                    <Text style={styles.statusText}>{t(`shopifyIntegration.statusLabels.${c.status}`)}</Text>
                    <Text style={styles.metaText}>
                      {c.lastSyncAt
                        ? new Date(c.lastSyncAt).toLocaleDateString()
                        : t('shopifyIntegration.neverSynced')}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  {c.needsReauth ? (
                    <Pressable
                      onPress={() => startConnect(c.shopDomain)}
                      disabled={connecting}
                      style={styles.reconnectBtn}
                    >
                      <Text style={styles.reconnectText}>{t('shopifyIntegration.reconnect')}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => onDisconnect(c.id)}
                    disabled={busyId === c.id}
                    style={styles.disconnectBtn}
                  >
                    {busyId === c.id ? (
                      <ActivityIndicator size="small" color={darkColors.error} />
                    ) : (
                      <Text style={styles.disconnectText}>{t('shopifyIntegration.disconnect')}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}

            {legacy.map((s) => (
              <View key={s.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowDomain}>{s.shopDomain}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: darkColors.primary }]} />
                    <Text style={styles.statusText}>{t('shopifyIntegration.statusLabels.legacy_manual')}</Text>
                  </View>
                  <Text style={styles.metaText}>{t('shopifyIntegration.legacyHint')}</Text>
                </View>
                <Pressable
                  onPress={() => startConnect(s.shopDomain)}
                  disabled={connecting}
                  style={styles.reconnectBtn}
                >
                  <Text style={styles.reconnectText}>{t('shopifyIntegration.reconnectViaShopify')}</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopifyScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.surfaceAlt },
  scroll: {
    padding: zyrixSpacing.base,
    rowGap: zyrixSpacing.sm,
    paddingBottom: layout.tabBarHeight + 24,
  },
  subtitle: { fontSize: 13, color: darkColors.textMuted, marginBottom: zyrixSpacing.xs },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    padding: 12,
    borderRadius: zyrixRadius.base,
    borderWidth: 1,
  },
  bannerOk: { backgroundColor: `${darkColors.success}14`, borderColor: `${darkColors.success}55` },
  bannerErr: { backgroundColor: `${darkColors.error}14`, borderColor: `${darkColors.error}55` },
  bannerText: { flex: 1, fontSize: 13, color: darkColors.textPrimary },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: zyrixRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: darkColors.border,
    rowGap: 4,
    ...zyrixShadows.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: darkColors.textHeading,
    marginBottom: zyrixSpacing.xs,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    backgroundColor: darkColors.primary,
    borderRadius: zyrixRadius.base,
    paddingVertical: 12,
  },
  connectText: { fontSize: 14, fontWeight: '700', color: darkColors.textOnPrimary },
  securityRow: { flexDirection: 'row', alignItems: 'flex-start', columnGap: 6, marginTop: 10 },
  securityText: { flex: 1, fontSize: 11, color: darkColors.textMuted, lineHeight: 16 },
  empty: { alignItems: 'center', rowGap: 6, paddingVertical: 32 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: darkColors.textHeading },
  emptySubtitle: { fontSize: 12, color: darkColors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: darkColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: zyrixSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    backgroundColor: darkColors.surface,
    borderRadius: zyrixRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  rowMain: { flex: 1, rowGap: 4 },
  rowDomain: { fontSize: 14, fontWeight: '700', color: darkColors.textHeading },
  statusRow: { flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: darkColors.textSecondary },
  metaText: { fontSize: 11, color: darkColors.textMuted },
  actions: { alignItems: 'flex-end', rowGap: 6 },
  reconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: zyrixRadius.base,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  reconnectText: { fontSize: 12, fontWeight: '700', color: darkColors.primary },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: zyrixRadius.base,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  disconnectText: { fontSize: 12, fontWeight: '700', color: darkColors.error },
});
