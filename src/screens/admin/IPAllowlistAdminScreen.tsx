/**
 * IPAllowlistAdminScreen — manages CIDR-based IP rules platform-wide
 * or per-company. Default mode "employees only (owners bypass)" matches
 * the spec recommendation; mobile-from-anywhere bypass is a per-rule
 * toggle.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  I18nManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCreateIPRule, useIPRules } from '../../hooks/useAdmin';
import type { IPRule, IPRuleMode } from '../../types/admin';

type Scope = 'global' | 'company';

const MODES: readonly IPRuleMode[] = ['employees_only', 'all', 'specific_roles'];

const MODE_LABEL: Record<IPRuleMode, string> = {
  employees_only: 'employeesOnly',
  all: 'allUsers',
  specific_roles: 'specificRoles',
};

export const IPAllowlistAdminScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [scope, setScope] = useState<Scope>('global');
  const rulesQuery = useIPRules(scope === 'global' ? null : 'comp_103');
  const createMut = useCreateIPRule();

  const [modalOpen, setModalOpen] = useState(false);
  const [cidr, setCidr] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<IPRuleMode>('employees_only');
  const [mobileBypass, setMobileBypass] = useState(true);

  const items = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data]);

  const create = (): void => {
    if (!cidr.trim()) {
      Alert.alert(t('forms.required'), 'CIDR');
      return;
    }
    createMut.mutate(
      {
        cidr,
        description,
        mode,
        companyId: scope === 'global' ? null : 'comp_103',
        exceptions: [],
        mobileBypass,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setCidr('');
          setDescription('');
        },
      }
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.ipAllowlist')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.scopeRow}>
        {(['global', 'company'] as Scope[]).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setScope(entry)}
            style={[
              styles.scopeChip,
              scope === entry ? styles.scopeChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.scopeText,
                scope === entry ? { color: colors.textInverse } : null,
              ]}
            >
              {scope === entry ? entry : entry}
            </Text>
          </Pressable>
        ))}
      </View>

      {rulesQuery.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} height={104} />
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Icon
                name="shield-checkmark-outline"
                size={40}
                color={colors.primary}
              />
              <Text style={styles.emptyTitle}>{t('admin.ipAllowlist')}</Text>
            </View>
          ) : (
            items.map((rule: IPRule) => (
              <View key={rule.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cidr}>{rule.cidr}</Text>
                  <View style={styles.modePill}>
                    <Text style={styles.modePillText}>
                      {t(`ipAllowlistAdmin.${MODE_LABEL[rule.mode]}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.description} numberOfLines={2}>
                  {rule.description}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {rule.companyName ?? 'Platform-wide'}
                  </Text>
                  {rule.mobileBypass ? (
                    <Text style={styles.metaPositive}>
                      {t('ipAllowlistAdmin.allowMobileForOwners')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
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
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{t('ipAllowlistAdmin.addRule')}</Text>
            <Field
              label={t('ipAllowlistAdmin.cidr')}
              value={cidr}
              onChange={setCidr}
            />
            <Field
              label={t('ipAllowlistAdmin.description')}
              value={description}
              onChange={setDescription}
            />
            <Text style={styles.fieldLabel}>
              {t('ipAllowlistAdmin.mode')}
            </Text>
            <View style={styles.modeRow}>
              {MODES.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setMode(entry)}
                  style={[
                    styles.modeChip,
                    mode === entry ? styles.modeChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      mode === entry ? { color: colors.textInverse } : null,
                    ]}
                  >
                    {t(`ipAllowlistAdmin.${MODE_LABEL[entry]}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>
                {t('ipAllowlistAdmin.mobileException')}
              </Text>
              <Switch
                value={mobileBypass}
                onValueChange={setMobileBypass}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalOpen(false)}
              />
              <Button
                label={t('common.save')}
                onPress={create}
                loading={createMut.isPending}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scopeRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    padding: spacing.base,
  },
  scopeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  scopeChipActive: { backgroundColor: colors.primary },
  scopeText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cidr: { ...textStyles.h4, color: colors.textPrimary, fontWeight: '700' },
  modePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  modePillText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  description: { ...textStyles.body, color: colors.textSecondary },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { ...textStyles.caption, color: colors.textMuted },
  metaPositive: {
    ...textStyles.caption,
    color: colors.success,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    rowGap: spacing.sm,
  },
  emptyTitle: { ...textStyles.h4, color: colors.textPrimary },
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
  field: { rowGap: spacing.xs },
  fieldLabel: { ...textStyles.label, color: colors.textSecondary },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default IPAllowlistAdminScreen;
