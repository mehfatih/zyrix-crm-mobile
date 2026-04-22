/**
 * AIBuilderScreen — mode-aware AI entry point (Architect, Builder,
 * Reports). Each mode seeds a different set of suggested prompts and
 * welcome copy; switching the mode resets the chat.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AIAssistant } from '../../../components/feature-specific/AIAssistant';
import { Header } from '../../../components/common/Header';
import { Icon, type AnyIconName } from '../../../components/common/Icon';
import { colors } from '../../../constants/colors';
import {
  getArchitectSuggestions,
  getBuilderSuggestions,
  getReportsSuggestions,
} from '../../../utils/aiPrompts';
import { radius, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAIChat } from '../../../hooks/useAI';
import type { AIBuilderMode, SupportedChatLanguage } from '../../../types/ai';
import { useUiStore } from '../../../store/uiStore';

interface ModeSpec {
  key: AIBuilderMode;
  icon: AnyIconName;
  label: 'aiBuilder.architect' | 'aiBuilder.builder' | 'aiBuilder.reports';
  intro: 'aiBuilder.architectIntro' | 'aiBuilder.builderIntro' | 'aiBuilder.reportsIntro';
}

const MODES: readonly ModeSpec[] = [
  {
    key: 'architect',
    icon: 'construct-outline',
    label: 'aiBuilder.architect',
    intro: 'aiBuilder.architectIntro',
  },
  {
    key: 'builder',
    icon: 'hammer-outline',
    label: 'aiBuilder.builder',
    intro: 'aiBuilder.builderIntro',
  },
  {
    key: 'report',
    icon: 'document-text-outline',
    label: 'aiBuilder.reports',
    intro: 'aiBuilder.reportsIntro',
  },
];

export const AIBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language) as SupportedChatLanguage;
  const [mode, setMode] = useState<AIBuilderMode>('architect');
  const chat = useAIChat();

  useEffect(() => {
    chat.clearHistory();
  }, [mode, chat.clearHistory]);

  const suggestions = useMemo(() => {
    if (mode === 'architect') return getArchitectSuggestions(language);
    if (mode === 'builder') return getBuilderSuggestions(language);
    return getReportsSuggestions(language);
  }, [mode, language]);

  const welcomeTitle = useMemo(() => {
    switch (mode) {
      case 'architect':
        return t('aiBuilder.architect');
      case 'builder':
        return t('aiBuilder.builder');
      case 'report':
        return t('aiBuilder.reports');
    }
  }, [mode, t]);

  const welcomeSubtitle = useMemo(() => {
    switch (mode) {
      case 'architect':
        return t('aiBuilder.architectIntro');
      case 'builder':
        return t('aiBuilder.builderIntro');
      case 'report':
        return t('aiBuilder.reportsIntro');
    }
  }, [mode, t]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header title={t('ai.aiBuilder')} showBack={false} />

      <View style={styles.modeRow}>
        {MODES.map((entry) => {
          const isActive = mode === entry.key;
          return (
            <Pressable
              key={entry.key}
              onPress={() => setMode(entry.key)}
              style={[
                styles.modeBtn,
                isActive ? styles.modeBtnActive : null,
              ]}
            >
              <Icon
                name={entry.icon}
                size={18}
                color={isActive ? colors.textInverse : colors.primary}
              />
              <Text
                style={[
                  styles.modeLabel,
                  isActive ? { color: colors.textInverse } : null,
                ]}
              >
                {t(entry.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AIAssistant
        messages={chat.messages}
        isTyping={chat.isTyping}
        onSend={chat.sendMessage}
        onClearHistory={chat.clearHistory}
        suggestedQuestions={suggestions}
        welcomeTitle={welcomeTitle}
        welcomeSubtitle={welcomeSubtitle}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  modeRow: {
    flexDirection: 'row',
    columnGap: spacing.xs,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeLabel: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

export default AIBuilderScreen;
