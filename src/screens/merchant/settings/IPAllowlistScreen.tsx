/**
 * IPAllowlistScreen — merchant-side IP allowlist UI. Admin-side
 * counterpart lives at `screens/admin/IPAllowlistAdminScreen.tsx`.
 * Mirrors the recommended defaults: employees only, owners bypass,
 * mobile-from-anywhere for owners.
 */

import React, { useEffect, useState } from 'react';
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

import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import { getCurrentIP } from '../../../utils/ipDetection';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';

type Mode = 'employees_only' | 'all' | 'specific_roles';

interface Rule {
  id: string;
  cidr: string;
  description: string;
  active: boolean;
  addedBy: string;
  addedAt: string;
}

const SAMPLE_RULES: readonly Rule[] = [
  {
    id: 'rule_1',
    cidr: '212.118.45.0/24',
    description: 'Riyadh HQ Wi-Fi',
    active: true,
    addedBy: 'Mehmet Fatih',
    addedAt: '2026-03-12',
  },
];

export const IPAllowlistScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<Mode>('employees_only');
  const [ownerMobileBypass, setOwnerMobileBypass] = useState(true);
  const [managerMobileBypass, setManagerMobileBypass] = useState(false);
  const [allMobileBypass, setAllMobileBypass] = useState(false);
  const [rules, setRules] = useState<Rule[]>([...SAMPLE_RULES]);
  const [currentIP, setCurrentIP] = useState<string>('—');
  const [modalOpen, setModalOpen] = useState(false);
  const [newCidr, setNewCidr] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    void getCurrentIP().then(setCurrentIP);
  }, []);

  const addRule = (): void => {
    if (!newCidr.trim() || !newDescription.trim()) {
      toast.error(t('forms.required'));
      return;
    }
    setRules((prev) => [
      ...prev,
      {
        id: `rule_${Math.random().toString(36).slice(2, 8)}`,
        cidr: newCidr.trim(),
        description: newDescription.trim(),
        active: true,
        addedBy: 'You',
        addedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNewCidr('');
    setNewDescription('');
    setModalOpen(false);
    toast.success(t('common.success'));
  };

  const testCurrent = (): void => {
    Alert.alert(
      `IP ${currentIP}`,
      enabled
        ? rules.some((rule) => currentIP.startsWith(rule.cidr.split('/')[0]?.slice(0, 7) ?? ''))
          ? t('ipBlocked.allowedIPs')
          : t('ipBlocked.accessBlocked')
        : t('ipBlocked.allowedIPs')
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('admin.ipAllowlist')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {t('ipBlocked.allowedIPs')}
              </Text>
              <Text style={styles.subtitle}>
                {enabled
                  ? `${t('admin.ipAllowlist')} ✓`
                  : t('ipBlocked.adminHint')}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {enabled ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('ipAllowlistAdmin.mode')}</Text>
              {(['employees_only', 'all', 'specific_roles'] as Mode[]).map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setMode(entry)}
                  style={styles.radioRow}
                >
                  <Icon
                    name={mode === entry ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.radioLabel}>
                      {t(
                        entry === 'employees_only'
                          ? 'ipAllowlistAdmin.employeesOnly'
                          : entry === 'all'
                            ? 'ipAllowlistAdmin.allUsers'
                            : 'ipAllowlistAdmin.specificRoles'
                      )}
                    </Text>
                    {entry === 'employees_only' ? (
                      <Text style={styles.recommendBadge}>✓ recommended</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {t('ipAllowlistAdmin.mobileException')}
              </Text>
              <CheckboxRow
                label={t('ipAllowlistAdmin.allowMobileForOwners')}
                value={ownerMobileBypass}
                onChange={setOwnerMobileBypass}
              />
              <CheckboxRow
                label="Allow managers from any IP"
                value={managerMobileBypass}
                onChange={setManagerMobileBypass}
              />
              <CheckboxRow
                label="Allow all via mobile"
                value={allMobileBypass}
                onChange={setAllMobileBypass}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.rowHeader}>
                <Text style={styles.sectionTitle}>
                  {t('ipBlocked.allowedIPs')}
                </Text>
                <Pressable
                  onPress={() => setModalOpen(true)}
                  hitSlop={8}
                  style={styles.addBtn}
                >
                  <Icon name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
              {rules.map((rule) => (
                <View key={rule.id} style={styles.ruleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleCidr}>{rule.cidr}</Text>
                    <Text style={styles.ruleMeta}>
                      {`${rule.description} · ${rule.addedBy} · ${rule.addedAt}`}
                    </Text>
                  </View>
                  <Switch
                    value={rule.active}
                    onValueChange={(value) =>
                      setRules((prev) =>
                        prev.map((entry) =>
                          entry.id === rule.id ? { ...entry, active: value } : entry
                        )
                      )
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              ))}
            </View>

            <View style={styles.testCard}>
              <Icon name="locate-outline" size={20} color={colors.primary} />
              <Text style={styles.testText}>
                {`${t('ipBlocked.currentIP')}: ${currentIP}`}
              </Text>
              <Pressable onPress={testCurrent}>
                <Text style={styles.testLink}>
                  {t('common.tryAgain')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={modalOpen}
        animationType="fade"
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
            <Text style={styles.modalTitle}>
              {t('ipAllowlistAdmin.addRule')}
            </Text>
            <Field
              label={t('ipAllowlistAdmin.cidr')}
              value={newCidr}
              onChange={setNewCidr}
            />
            <Field
              label={t('ipAllowlistAdmin.description')}
              value={newDescription}
              onChange={setNewDescription}
            />
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalOpen(false)}
              />
              <Button label={t('common.save')} onPress={addRule} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const CheckboxRow: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, value, onChange }) => (
  <Pressable onPress={() => onChange(!value)} style={styles.checkboxRow}>
    <Icon
      name={value ? 'checkbox-outline' : 'square-outline'}
      size={20}
      color={value ? colors.primary : colors.border}
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <View style={{ rowGap: spacing.xs }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
      style={[
        styles.input,
        { textAlign: I18nManager.isRTL ? 'right' : 'left' },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  title: { ...textStyles.h4, color: colors.textPrimary },
  subtitle: { ...textStyles.caption, color: colors.textMuted },
  sectionTitle: { ...textStyles.bodyMedium, color: colors.textPrimary },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  radioLabel: { ...textStyles.body, color: colors.textPrimary },
  recommendBadge: {
    ...textStyles.caption,
    color: colors.success,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxLabel: { ...textStyles.body, color: colors.textPrimary, flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ruleCidr: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  ruleMeta: { ...textStyles.caption, color: colors.textMuted },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.base,
    borderRadius: radius.lg,
  },
  testText: { flex: 1, ...textStyles.body, color: colors.primaryDark },
  testLink: { ...textStyles.button, color: colors.primary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    rowGap: spacing.sm,
    ...shadows.lg,
  },
  modalTitle: { ...textStyles.h3, color: colors.textPrimary },
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default IPAllowlistScreen;
