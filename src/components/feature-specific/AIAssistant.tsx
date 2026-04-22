/**
 * AIAssistant — the chat surface used by AI CFO, Builder, and Workflow
 * Builder screens. Handles message rendering (including inline charts,
 * insight cards and action pills), the typing indicator, suggested
 * question chips, and the bottom composer.
 *
 * RTL handling: bubbles swap sides automatically via `I18nManager.isRTL`
 * — Arabic users see user messages on the left, assistant on the right.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AIInsightCard } from './AIInsightCard';
import { BarChart } from '../charts/BarChart';
import { Icon } from '../common/Icon';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { colors } from '../../constants/colors';
import { hitSlop, radius, shadows, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type {
  AIMessage,
  Action,
  ChartData,
} from '../../types/ai';

export interface AIAssistantProps {
  messages: AIMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
  onClearHistory?: () => void;
  onActionPress?: (action: Action) => void;
  suggestedQuestions?: readonly string[];
  placeholder?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  style?: StyleProp<ViewStyle>;
  disableAttachment?: boolean;
}

const MAX_INPUT_LINES = 4;

export const AIAssistant: React.FC<AIAssistantProps> = ({
  messages,
  isTyping,
  onSend,
  onClearHistory,
  onActionPress,
  suggestedQuestions = [],
  placeholder,
  welcomeTitle,
  welcomeSubtitle,
  style,
  disableAttachment,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<AIMessage>>(null);

  const canSend = draft.trim().length > 0 && !isTyping;

  const handleSend = (): void => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
  };

  const sendSuggestion = (text: string): void => {
    onSend(text);
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        inverted={messages.length > 0}
        contentContainerStyle={
          messages.length > 0 ? styles.listContent : styles.listContentEmpty
        }
        renderItem={({ item }) => (
          <MessageBubble message={item} onActionPress={onActionPress} />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.welcomeWrap}>
            <View style={styles.welcomeAvatar}>
              <Icon
                name="sparkles-outline"
                size={28}
                color={colors.textInverse}
              />
            </View>
            {welcomeTitle ? (
              <Text style={styles.welcomeTitle}>{welcomeTitle}</Text>
            ) : null}
            {welcomeSubtitle ? (
              <Text style={styles.welcomeSubtitle}>{welcomeSubtitle}</Text>
            ) : null}
          </View>
        }
        ListHeaderComponent={
          isTyping ? <TypingBubble /> : null
        }
      />

      {onClearHistory && messages.length > 0 ? (
        <Pressable
          onPress={onClearHistory}
          hitSlop={hitSlop.sm}
          style={styles.clearBtn}
        >
          <Icon name="refresh" size={14} color={colors.textMuted} />
          <Text style={styles.clearText}>{t('ai.clearChat')}</Text>
        </Pressable>
      ) : null}

      {messages.length === 0 && suggestedQuestions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsRow}
        >
          {suggestedQuestions.map((question) => (
            <Pressable
              key={question}
              onPress={() => sendSuggestion(question)}
              style={({ pressed }) => [
                styles.suggestion,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Icon name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {question}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composer}>
        {disableAttachment ? null : (
          <Pressable
            style={styles.iconBtn}
            hitSlop={hitSlop.sm}
            accessibilityLabel={t('ai.attachFile')}
          >
            <Icon name="attach-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        )}

        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? t('ai.askMeAnything')}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.input,
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          maxLength={2000}
          textAlignVertical="center"
          numberOfLines={MAX_INPUT_LINES}
        />

        <Pressable
          style={styles.iconBtn}
          hitSlop={hitSlop.sm}
          accessibilityLabel={t('ai.voiceInput')}
        >
          <Icon name="mic-outline" size={22} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            canSend ? null : { backgroundColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('quoteBuilder.sendNow')}
        >
          <Icon
            name="send"
            size={20}
            color={canSend ? colors.textInverse : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
};

const MessageBubble: React.FC<{
  message: AIMessage;
  onActionPress?: (action: Action) => void;
}> = ({ message, onActionPress }) => {
  const isUser = message.role === 'user';
  const bubbleStyles = [
    styles.bubble,
    isUser ? styles.userBubble : styles.assistantBubble,
  ];

  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      {!isUser ? (
        <View style={styles.assistantAvatar}>
          <Icon name="sparkles-outline" size={14} color={colors.textInverse} />
        </View>
      ) : null}

      <View style={styles.bubbleColumn}>
        <View style={bubbleStyles}>
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? colors.textInverse : colors.textPrimary },
            ]}
          >
            {message.content}
          </Text>
        </View>

        {!isUser && message.charts
          ? message.charts.map((chart, idx) => (
              <ChartBlock key={`${message.id}-chart-${idx}`} chart={chart} />
            ))
          : null}

        {!isUser && message.insights
          ? message.insights.map((insight) => (
              <AIInsightCard
                key={insight.id}
                insight={insight}
                style={styles.insightSpacing}
              />
            ))
          : null}

        {!isUser && message.actions ? (
          <View style={styles.actionsRow}>
            {message.actions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => onActionPress?.(action)}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Text style={styles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const ChartBlock: React.FC<{ chart: ChartData }> = ({ chart }) => {
  if (chart.type === 'line') {
    return (
      <View style={styles.chartWrap}>
        <LineChart
          data={chart.series ?? []}
          title={chart.title}
          currency={chart.currency}
        />
      </View>
    );
  }
  if (chart.type === 'bar') {
    return (
      <View style={styles.chartWrap}>
        <BarChart
          data={chart.categories ?? []}
          title={chart.title}
          currency={chart.currency}
        />
      </View>
    );
  }
  return (
    <View style={styles.chartWrap}>
      <PieChart
        data={chart.categories ?? []}
        title={chart.title}
      />
    </View>
  );
};

const TypingBubble: React.FC = () => {
  const dots = useRef([
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
  ]).current;

  useEffect(() => {
    const animations = dots.map((value, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 160),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.2,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={styles.assistantAvatar}>
        <Icon name="sparkles-outline" size={14} color={colors.textInverse} />
      </View>
      <View style={[styles.bubble, styles.assistantBubble, styles.typing]}>
        {dots.map((value, idx) => (
          <Animated.View
            key={idx}
            style={[styles.typingDot, { opacity: value }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.base,
  },
  listContentEmpty: {
    flexGrow: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  welcomeWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    rowGap: spacing.xs,
  },
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  welcomeTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  suggestionsRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    columnGap: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    maxWidth: 260,
  },
  suggestionText: {
    ...textStyles.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  bubbleRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubbleColumn: {
    maxWidth: '80%',
    rowGap: spacing.xs,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    alignSelf: 'flex-start',
    ...shadows.xs,
  },
  bubbleText: {
    ...textStyles.body,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  chartWrap: {
    marginTop: spacing.xs,
  },
  insightSpacing: {
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  actionText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.xs,
    alignSelf: 'center',
    padding: spacing.xs,
  },
  clearText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    padding: spacing.sm,
    columnGap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    maxHeight: 120,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIAssistant;
