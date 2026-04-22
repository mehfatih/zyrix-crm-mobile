/**
 * AICFOScreen — conversational CFO co-pilot. Wires the `AIAssistant`
 * to `useAIChat`, seeds suggested questions per language, and shows
 * the merchant's country flag in the header.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AIAssistant } from '../../../components/feature-specific/AIAssistant';
import { Header } from '../../../components/common/Header';
import { colors } from '../../../constants/colors';
import { getCFOSuggestions, getWelcomePrompt } from '../../../utils/aiPrompts';
import { radius, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useAIChat } from '../../../hooks/useAI';
import { useCountryConfig } from '../../../hooks/useCountryConfig';
import type { SupportedChatLanguage } from '../../../types/ai';
import { useUiStore } from '../../../store/uiStore';
import { useUserStore } from '../../../store/userStore';

export const AICFOScreen: React.FC = () => {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language) as SupportedChatLanguage;
  const currentUser = useUserStore((s) => s.currentUser);
  const { config } = useCountryConfig();

  const chat = useAIChat();

  const welcomeTitle =
    language === 'ar'
      ? 'مرحبًا! أنا مساعدك المالي الذكي'
      : language === 'tr'
        ? "AI CFO'nuz burada"
        : "Hi, I'm your AI CFO";
  const welcomeSubtitle = getWelcomePrompt(
    currentUser?.name,
    language,
    currentUser?.role ?? null
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('ai.aiCFO')}
        showBack={false}
        rightSlot={
          <View style={styles.flagWrap}>
            <Text style={styles.flagText}>{config.flag}</Text>
          </View>
        }
      />
      <AIAssistant
        messages={chat.messages}
        isTyping={chat.isTyping}
        onSend={chat.sendMessage}
        onClearHistory={chat.clearHistory}
        suggestedQuestions={getCFOSuggestions(language)}
        welcomeTitle={welcomeTitle}
        welcomeSubtitle={welcomeSubtitle}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flagWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.xs,
  },
  flagText: {
    ...textStyles.body,
  },
});

export default AICFOScreen;
