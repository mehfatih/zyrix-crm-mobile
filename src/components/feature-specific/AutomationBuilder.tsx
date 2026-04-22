/**
 * AutomationBuilder — visual no-code workflow editor (simplified).
 *
 * Renders a vertical flow: trigger node at the top, then a stack of
 * action / condition nodes. Tapping a node opens a picker modal that
 * swaps the underlying type. Re-ordering and nested branches ship
 * later — this covers the 80% case merchants need.
 */

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../common/Button';
import { Icon, type AnyIconName } from '../common/Icon';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export type TriggerType =
  | 'newCustomer'
  | 'dealStageChanged'
  | 'quoteAccepted'
  | 'invoiceOverdue'
  | 'customerInactive'
  | 'scheduledDate';

export type ActionType =
  | 'sendEmail'
  | 'sendWhatsApp'
  | 'sendSMS'
  | 'createTask'
  | 'addTag'
  | 'moveToStage'
  | 'notifyUser';

export type ConditionType = 'customerCountry' | 'dealValue' | 'customerTag';

export type NodeType = 'action' | 'condition';

export interface AutomationNode {
  id: string;
  kind: NodeType;
  action?: ActionType;
  condition?: ConditionType;
  label?: string;
}

export interface AutomationWorkflow {
  name: string;
  active: boolean;
  trigger: TriggerType;
  nodes: AutomationNode[];
}

export interface AutomationBuilderProps {
  value: AutomationWorkflow;
  onChange: (next: AutomationWorkflow) => void;
}

const TRIGGER_ICON: Record<TriggerType, AnyIconName> = {
  newCustomer: 'person-add-outline',
  dealStageChanged: 'swap-horizontal-outline',
  quoteAccepted: 'checkmark-circle-outline',
  invoiceOverdue: 'alert-circle-outline',
  customerInactive: 'time-outline',
  scheduledDate: 'calendar-outline',
};

const ACTION_ICON: Record<ActionType, AnyIconName> = {
  sendEmail: 'mail-outline',
  sendWhatsApp: 'logo-whatsapp',
  sendSMS: 'chatbubble-outline',
  createTask: 'checkbox-outline',
  addTag: 'pricetag-outline',
  moveToStage: 'flag-outline',
  notifyUser: 'notifications-outline',
};

const CONDITION_ICON: Record<ConditionType, AnyIconName> = {
  customerCountry: 'earth-outline',
  dealValue: 'cash-outline',
  customerTag: 'pricetag-outline',
};

const TRIGGERS: readonly TriggerType[] = [
  'newCustomer',
  'dealStageChanged',
  'quoteAccepted',
  'invoiceOverdue',
  'customerInactive',
  'scheduledDate',
];

const ACTIONS: readonly ActionType[] = [
  'sendEmail',
  'sendWhatsApp',
  'sendSMS',
  'createTask',
  'addTag',
  'moveToStage',
  'notifyUser',
];

const CONDITIONS: readonly ConditionType[] = [
  'customerCountry',
  'dealValue',
  'customerTag',
];

const genId = (): string => `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const [picker, setPicker] = useState<
    | { kind: 'trigger' }
    | { kind: 'new'; after: number }
    | { kind: 'edit'; nodeId: string }
    | null
  >(null);

  const patch = (partial: Partial<AutomationWorkflow>): void => {
    onChange({ ...value, ...partial });
  };

  const addNodeAt = (nodeKind: NodeType, subKey: string, after: number): void => {
    const nodeBase: AutomationNode = { id: genId(), kind: nodeKind };
    const node: AutomationNode = nodeKind === 'action'
      ? { ...nodeBase, action: subKey as ActionType }
      : { ...nodeBase, condition: subKey as ConditionType };
    const next = [...value.nodes];
    next.splice(after, 0, node);
    patch({ nodes: next });
  };

  const updateNode = (id: string, nodeKind: NodeType, subKey: string): void => {
    patch({
      nodes: value.nodes.map((n) =>
        n.id !== id
          ? n
          : {
              ...n,
              kind: nodeKind,
              action: nodeKind === 'action' ? (subKey as ActionType) : undefined,
              condition:
                nodeKind === 'condition' ? (subKey as ConditionType) : undefined,
            }
      ),
    });
  };

  const deleteNode = (id: string): void => {
    patch({ nodes: value.nodes.filter((n) => n.id !== id) });
  };

  const closePicker = (): void => setPicker(null);

  const currentEdit = useMemo(() => {
    if (!picker || picker.kind !== 'edit') return null;
    return value.nodes.find((n) => n.id === picker.nodeId) ?? null;
  }, [picker, value.nodes]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          value={value.name}
          onChangeText={(next) => patch({ name: next })}
          placeholder={t('automation.automationName')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.nameInput,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        />
        <View style={styles.activeRow}>
          <Text style={styles.activeLabel}>
            {value.active ? t('automation.activate') : t('automation.testMode')}
          </Text>
          <Switch
            value={value.active}
            onValueChange={(v) => patch({ active: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setPicker({ kind: 'trigger' })}
          style={({ pressed }) => [
            styles.triggerCard,
            pressed ? { opacity: 0.9 } : null,
          ]}
        >
          <Text style={styles.cardTag}>{t('automation.trigger')}</Text>
          <View style={styles.cardBody}>
            <View style={styles.cardIcon}>
              <Icon
                name={TRIGGER_ICON[value.trigger]}
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.cardLabel}>
              {t(`automation.${value.trigger}`)}
            </Text>
          </View>
        </Pressable>

        <Connector />

        {value.nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <Pressable
              onPress={() => setPicker({ kind: 'edit', nodeId: node.id })}
              style={({ pressed }) => [
                styles.nodeCard,
                pressed ? { opacity: 0.9 } : null,
              ]}
            >
              <View style={styles.nodeHeader}>
                <Text style={styles.cardTag}>
                  {node.kind === 'condition'
                    ? t('automation.condition')
                    : t('automation.action')}
                </Text>
                <Pressable
                  onPress={() => deleteNode(node.id)}
                  hitSlop={hitSlop.sm}
                >
                  <Icon name="close" size={16} color={colors.error} />
                </Pressable>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardIcon}>
                  <Icon
                    name={
                      node.kind === 'action' && node.action
                        ? ACTION_ICON[node.action]
                        : node.condition
                          ? CONDITION_ICON[node.condition]
                          : 'ellipse-outline'
                    }
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.cardLabel}>
                  {node.action
                    ? t(`automation.${node.action}`)
                    : node.condition
                      ? t(`automation.${node.condition}`)
                      : node.label ?? ''}
                </Text>
              </View>
            </Pressable>
            <InsertButton
              onPress={() => setPicker({ kind: 'new', after: index + 1 })}
            />
          </React.Fragment>
        ))}

        {value.nodes.length === 0 ? (
          <InsertButton onPress={() => setPicker({ kind: 'new', after: 0 })} />
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={picker !== null}
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {picker?.kind === 'trigger' ? (
              <>
                <Text style={styles.sheetTitle}>{t('automation.trigger')}</Text>
                {TRIGGERS.map((trig) => (
                  <Pressable
                    key={trig}
                    onPress={() => {
                      patch({ trigger: trig });
                      closePicker();
                    }}
                    style={styles.sheetRow}
                  >
                    <Icon
                      name={TRIGGER_ICON[trig]}
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={styles.sheetLabel}>
                      {t(`automation.${trig}`)}
                    </Text>
                  </Pressable>
                ))}
              </>
            ) : null}

            {picker?.kind === 'new' || picker?.kind === 'edit' ? (
              <>
                <Text style={styles.sheetTitle}>
                  {t('automation.action')} / {t('automation.condition')}
                </Text>
                <Text style={styles.subheading}>
                  {t('automation.action')}
                </Text>
                {ACTIONS.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => {
                      if (picker.kind === 'edit' && currentEdit) {
                        updateNode(currentEdit.id, 'action', a);
                      } else if (picker.kind === 'new') {
                        addNodeAt('action', a, picker.after);
                      }
                      closePicker();
                    }}
                    style={styles.sheetRow}
                  >
                    <Icon
                      name={ACTION_ICON[a]}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.sheetLabel}>
                      {t(`automation.${a}`)}
                    </Text>
                  </Pressable>
                ))}
                <Text style={styles.subheading}>
                  {t('automation.condition')}
                </Text>
                {CONDITIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      if (picker.kind === 'edit' && currentEdit) {
                        updateNode(currentEdit.id, 'condition', c);
                      } else if (picker.kind === 'new') {
                        addNodeAt('condition', c, picker.after);
                      }
                      closePicker();
                    }}
                    style={styles.sheetRow}
                  >
                    <Icon
                      name={CONDITION_ICON[c]}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.sheetLabel}>
                      {t(`automation.${c}`)}
                    </Text>
                  </Pressable>
                ))}
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={closePicker}
                />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Connector: React.FC = () => <View style={styles.connector} />;

const InsertButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.insert,
      pressed ? { opacity: 0.8 } : null,
    ]}
  >
    <Icon name="add-circle" size={24} color={colors.primary} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    rowGap: spacing.sm,
  },
  nameInput: {
    ...textStyles.h3,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  triggerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.xs,
  },
  nodeCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    rowGap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTag: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  connector: {
    width: 2,
    height: 24,
    backgroundColor: colors.primary,
  },
  insert: {
    marginVertical: spacing.sm,
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
    maxHeight: '85%',
    ...shadows.lg,
  },
  sheetTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sheetLabel: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
});

export default AutomationBuilder;
