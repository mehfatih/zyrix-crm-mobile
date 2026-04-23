/**
 * SCIMTokensScreen — SCIM token catalogue + generator. The full token
 * is shown once after creation with copy/instructions affordances.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import {
  SearchableDropdown,
  type DropdownItem,
} from '../../components/forms/SearchableDropdown';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCompanies, useCreateSCIMToken, useRevokeSCIMToken, useSCIMTokens } from '../../hooks/useAdmin';
import { useCountryConfig } from '../../hooks/useCountryConfig';
import type { SCIMScope } from '../../types/admin';

const SCOPES: readonly SCIMScope[] = ['read_only', 'read_write', 'admin'];
const EXPIRATIONS: readonly { key: 30 | 90 | 365 | -1; label: string }[] = [
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 365, label: '1y' },
  { key: -1, label: 'never' },
];

const ENDPOINT_URL = 'https://api.crm.zyrix.co/scim/v2';

export const SCIMTokensScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { formatDate } = useCountryConfig();

  const tokensQuery = useSCIMTokens();
  const companiesQuery = useCompanies({ pageSize: 100 });
  const createMut = useCreateSCIMToken();
  const revokeMut = useRevokeSCIMToken();

  const companyOptions = useMemo<DropdownItem[]>(
    () =>
      (companiesQuery.data?.items ?? []).map((entry) => ({
        id: entry.id,
        label: entry.name,
        subtitle: entry.ownerEmail,
      })),
    [companiesQuery.data]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [company, setCompany] = useState<DropdownItem | null>(null);
  const [scope, setScope] = useState<SCIMScope>('read_write');
  const [expiration, setExpiration] = useState<30 | 90 | 365 | -1>(365);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const reset = (): void => {
    setCompany(null);
    setScope('read_write');
    setExpiration(365);
    setCreatedToken(null);
  };

  const generate = async (): Promise<void> => {
    if (!company) {
      Alert.alert(t('forms.required'), t('admin.companies'));
      return;
    }
    try {
      const result = await createMut.mutateAsync({
        companyId: company.id,
        scope,
        expiresInDays: expiration,
      });
      setCreatedToken(result.fullToken);
    } catch (err) {
      console.warn('[scim] create failed', err);
    }
  };

  const closeModal = (): void => {
    setModalOpen(false);
    reset();
  };

  const revoke = (id: string): void => {
    Alert.alert(t('common.confirm'), undefined, [
      { text: t('common.cancel') },
      { text: t('common.delete'), style: 'destructive', onPress: () => revokeMut.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('scim.title')}
        onBack={() => navigation.goBack()}
      />

      {tokensQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <SkeletonCard key={idx} height={120} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(tokensQuery.data ?? []).map((token) => (
            <View key={token.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.companyName}>{token.companyName}</Text>
                <View style={styles.scopePill}>
                  <Text style={styles.scopePillText}>{token.scope}</Text>
                </View>
              </View>
              <Text style={styles.preview}>{token.tokenPreview}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {`Created: ${formatDate(token.createdAt)}`}
                </Text>
                <Text style={styles.metaText}>
                  {`Expires: ${formatDate(token.expiresAt)}`}
                </Text>
              </View>
              <Pressable onPress={() => revoke(token.id)}>
                <Text style={styles.revoke}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Icon name="add" size={26} color={colors.textInverse} />
      </Pressable>

      <Modal
        transparent
        visible={modalOpen}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {t('scim.generateToken')}
            </Text>
            {createdToken ? (
              <View style={styles.tokenSuccess}>
                <Icon
                  name="checkmark-circle"
                  size={36}
                  color={colors.success}
                />
                <Text style={styles.tokenWarning}>
                  {t('scim.tokenShownOnce')}
                </Text>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenText} numberOfLines={2}>
                    {createdToken}
                  </Text>
                </View>
                <Text style={styles.tokenInfo}>
                  {`${t('scim.endpointUrl')}: ${ENDPOINT_URL}`}
                </Text>
                <Text style={styles.tokenInfo}>
                  {t('scim.setupInstructions')}
                </Text>
                <Button label={t('common.continue')} onPress={closeModal} />
              </View>
            ) : (
              <>
                <SearchableDropdown
                  items={companyOptions}
                  value={company}
                  onChange={setCompany}
                  label={t('admin.companies')}
                  placeholder={t('companies.searchCompanies')}
                />
                <Text style={styles.fieldLabel}>{t('scim.scope')}</Text>
                <View style={styles.row}>
                  {SCOPES.map((entry) => (
                    <Pressable
                      key={entry}
                      onPress={() => setScope(entry)}
                      style={[
                        styles.chip,
                        scope === entry ? styles.chipActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          scope === entry
                            ? { color: colors.textInverse }
                            : null,
                        ]}
                      >
                        {t(`scim.${entry === 'read_only' ? 'readonly' : entry === 'read_write' ? 'readwrite' : 'admin'}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>{t('scim.expiration')}</Text>
                <View style={styles.row}>
                  {EXPIRATIONS.map((entry) => (
                    <Pressable
                      key={entry.label}
                      onPress={() => setExpiration(entry.key)}
                      style={[
                        styles.chip,
                        expiration === entry.key ? styles.chipActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          expiration === entry.key
                            ? { color: colors.textInverse }
                            : null,
                        ]}
                      >
                        {entry.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.actionsRow}>
                  <Button
                    label={t('common.cancel')}
                    variant="ghost"
                    onPress={closeModal}
                  />
                  <Button
                    label={t('scim.generateToken')}
                    onPress={() => void generate()}
                    loading={createMut.isPending}
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: {
    padding: spacing.base,
    rowGap: spacing.sm,
    paddingBottom: spacing.xxxl * 2,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: { ...textStyles.bodyMedium, color: colors.textPrimary },
  scopePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  scopePillText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  preview: {
    ...textStyles.body,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { ...textStyles.caption, color: colors.textMuted },
  revoke: {
    ...textStyles.button,
    color: colors.error,
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    insetInlineEnd: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalTitle: { ...textStyles.h3, color: colors.textPrimary },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
  tokenSuccess: { rowGap: spacing.sm, alignItems: 'center' },
  tokenWarning: {
    ...textStyles.bodyMedium,
    color: colors.warning,
    fontWeight: '700',
    textAlign: 'center',
  },
  tokenBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.base,
    width: '100%',
  },
  tokenText: {
    ...textStyles.body,
    color: colors.primaryDark,
    fontFamily: 'monospace',
  },
  tokenInfo: {
    ...textStyles.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SCIMTokensScreen;
