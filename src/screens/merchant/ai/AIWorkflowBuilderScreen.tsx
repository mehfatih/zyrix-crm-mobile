/**
 * AIWorkflowBuilderScreen — chat-driven workflow creation.
 *
 * User describes the automation in plain text; the assistant replies
 * with a suggested workflow structure. A read-only preview is shown
 * below the chat once a workflow candidate exists.
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { AIAssistant } from '../../../components/feature-specific/AIAssistant';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { darkColors } from '../../../theme/dark';
import { createWorkflow } from '../../../api/ai';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAIChat } from '../../../hooks/useAI';
import { useToast } from '../../../hooks/useToast';
import type { WorkflowDefinition } from '../../../types/ai';

export const AIWorkflowBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const chat = useAIChat();
  const [preview, setPreview] = useState<WorkflowDefinition | null>(null);

  const send = async (text: string): Promise<void> => {
    await chat.sendMessage(text);
    try {
      const draft = await createWorkflow(text);
      setPreview(draft);
    } catch (err) {
      console.warn('[workflowBuilder] createWorkflow failed', err);
    }
  };

  const activate = (): void => {
    if (!preview) return;
    toast.success(t('aiWorkflows.workflowCreated'));
    navigation.goBack();
  };

  const refine = (): void => {
    setPreview(null);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('aiWorkflows.createWithAI')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.chatWrap}>
          <AIAssistant
            messages={chat.messages}
            isTyping={chat.isTyping}
            onSend={(text) => void send(text)}
            onClearHistory={chat.clearHistory}
            suggestedQuestions={[
              'Send a welcome email when a new customer is added',
              'Notify me when a deal stays in Negotiation for 7 days',
              'Tag customers who open 3 emails in a week',
            ]}
            welcomeTitle={t('aiWorkflows.describeWorkflow')}
            disableAttachment
          />
        </View>

        {preview ? (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Icon name="flash-outline" size={18} color={darkColors.primary} />
              <Text style={styles.previewTitle}>{preview.name}</Text>
            </View>
            <Text style={styles.previewDesc}>{preview.description}</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>
                {t('automation.trigger')}
              </Text>
              <Text style={styles.previewValue}>
                {t(`automation.${preview.trigger}`)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>
                {t('automation.action')}
              </Text>
              <Text style={styles.previewValue}>
                {preview.actions
                  .map((action) => t(`automation.${action}`))
                  .join(' · ')}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={refine}
                style={({ pressed }) => [
                  styles.ghostBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon name="refresh" size={16} color={darkColors.primary} />
                <Text style={styles.ghostText}>
                  {t('aiWorkflows.refine')}
                </Text>
              </Pressable>
              <Pressable
                onPress={activate}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Icon
                  name="checkmark"
                  size={16}
                  color={darkColors.textOnPrimary}
                />
                <Text style={styles.primaryText}>
                  {t('aiWorkflows.activate')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkColors.background },
  scroll: {
    flexGrow: 1,
  },
  chatWrap: {
    flex: 1,
    minHeight: 520,
  },
  previewCard: {
    margin: spacing.base,
    padding: spacing.base,
    backgroundColor: darkColors.surface,
    borderRadius: radius.lg,
    rowGap: spacing.xs,
    ...shadows.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  previewTitle: {
    ...textStyles.h4,
    color: darkColors.textPrimary,
  },
  previewDesc: {
    ...textStyles.body,
    color: darkColors.textSecondary,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: darkColors.divider,
  },
  previewLabel: {
    ...textStyles.caption,
    color: darkColors.textMuted,
  },
  previewValue: {
    ...textStyles.label,
    color: darkColors.textPrimary,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ghostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primarySoft,
  },
  ghostText: {
    ...textStyles.button,
    color: darkColors.primary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: darkColors.primary,
  },
  primaryText: {
    ...textStyles.button,
    color: darkColors.textOnPrimary,
  },
});

export default AIWorkflowBuilderScreen;
