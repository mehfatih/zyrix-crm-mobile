/**
 * AICommandCenter — bottom-sheet AI control surface (AI Sprint 2 §7).
 *
 * Sections (per spec):
 *   1. Drag handle + title (sparkles)
 *   2. Current context card (entity from the calling screen)
 *   3. 6-tile grid of suggested commands
 *   4. AI response card (Trust Layer + CTA)
 *   5. Free-form composer at the bottom
 *
 * The sheet is mounted globally by `RootNavigator`. Visibility is owned
 * by the AI store (`commandCenterOpen`) so any screen can pop it open
 * via the Floating Button or by pushing context with
 * `useAIStore.openCommandCenter(context)`.
 */

import React, { useCallback, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '../common/Icon';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { useAIStore } from '../../store/aiStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import {
  aiCommandService,
  type AICommandId,
  type AICommandResponse,
} from '../../services/aiCommandService';
import { AITrustBadge } from './AITrustBadge';

interface CommandTile {
  id: AICommandId;
  icon: string;
  labelKey: string;
}

const TILES: CommandTile[] = [
  { id: 'analyze-deal', icon: 'analytics', labelKey: 'ai.commands.analyzeDeal' },
  { id: 'write-followup', icon: 'create', labelKey: 'ai.commands.writeFollowup' },
  { id: 'find-risks', icon: 'warning', labelKey: 'ai.commands.findRisks' },
  { id: 'create-plan', icon: 'list', labelKey: 'ai.commands.createPlan' },
  { id: 'predict-revenue', icon: 'trending-up', labelKey: 'ai.commands.predictRevenue' },
  { id: 'explain-recommendation', icon: 'help-circle', labelKey: 'ai.commands.explainRec' },
];

export const AICommandCenter: React.FC = () => {
  const { t } = useTranslation();
  const open = useAIStore((s) => s.commandCenterOpen);
  const close = useAIStore((s) => s.closeCommandCenter);
  const context = useAIStore((s) => s.context);
  const currentUser = useUserStore((s) => s.currentUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AICommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPrompt('');
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    close();
  }, [close, reset]);

  const runCommand = useCallback(
    async (commandId: AICommandId, input?: string) => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const result = await aiCommandService.execute({
          commandId,
          input,
          context,
          workspaceId: currentUser.companyId ?? currentUser.id,
          userId: currentUser.id,
        });
        setResponse(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('common.error');
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [context, currentUser, t]
  );

  const handleSendPrompt = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    void runCommand('free-form', trimmed);
  }, [prompt, runCommand]);

  // Don't render outside of authenticated sessions — auth/onboarding
  // navigators shouldn't ever show the AI surface.
  if (!isAuthenticated) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <LinearGradient
                colors={[zyrixTheme.primaryLight, zyrixTheme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIcon}
              >
                <Icon
                  name="sparkles"
                  size={18}
                  color={zyrixTheme.textInverse}
                  family="Ionicons"
                />
              </LinearGradient>
              <View style={styles.flex}>
                <Text style={styles.title}>{t('ai.commandCenter.title')}</Text>
                <Text style={styles.subtitle}>
                  {context?.summary ?? t('ai.askAnything')}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                hitSlop={8}
              >
                <Icon
                  name="close"
                  size={22}
                  color={zyrixTheme.textMuted}
                  family="Ionicons"
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {context ? (
                <View style={styles.contextCard}>
                  <Text style={styles.contextLabel}>{t('ai.context')}</Text>
                  <Text style={styles.contextText}>
                    {context.summary || `${context.screen}`}
                  </Text>
                  {context.entityType ? (
                    <Text style={styles.contextEntity}>
                      {context.entityType.toUpperCase()}
                      {context.entityId ? ` · ${context.entityId}` : ''}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>
                {t('ai.suggestedCommands')}
              </Text>
              <View style={styles.tilesGrid}>
                {TILES.map((tile) => (
                  <Pressable
                    key={tile.id}
                    style={({ pressed }) => [
                      styles.tile,
                      pressed ? styles.tilePressed : null,
                    ]}
                    onPress={() => void runCommand(tile.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t(tile.labelKey)}
                  >
                    <View style={styles.tileIconWrap}>
                      <Icon
                        name={tile.icon as never}
                        size={20}
                        color={zyrixTheme.primary}
                        family="Ionicons"
                      />
                    </View>
                    <Text style={styles.tileLabel} numberOfLines={2}>
                      {t(tile.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {loading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={zyrixTheme.primary} />
                  <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorCard}>
                  <Icon
                    name="alert-circle"
                    size={16}
                    color={zyrixTheme.danger}
                    family="Ionicons"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {response ? (
                <View style={styles.responseCard}>
                  <Text style={styles.responseTitle}>{response.title}</Text>
                  <Text style={styles.responseReason}>
                    {response.recommendedAction}
                  </Text>
                  <View style={styles.responseTrust}>
                    <AITrustBadge
                      confidence={response.confidence}
                      reason={response.reason}
                      signals={response.signals}
                      recommendedAction={response.recommendedAction}
                    />
                  </View>
                  {response.cta ? (
                    <Pressable style={styles.ctaButton} onPress={handleClose}>
                      <Text style={styles.ctaText}>{response.cta.label}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder={t('ai.askAnything')}
                placeholderTextColor={zyrixTheme.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                onSubmitEditing={handleSendPrompt}
                returnKeyType="send"
                editable={!loading}
              />
              <Pressable
                onPress={handleSendPrompt}
                disabled={loading || prompt.trim().length === 0}
                style={({ pressed }) => [
                  styles.sendButton,
                  pressed ? { opacity: 0.85 } : null,
                  loading || prompt.trim().length === 0
                    ? styles.sendButtonDisabled
                    : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('common.confirm')}
              >
                <Icon
                  name="send"
                  size={18}
                  color={zyrixTheme.textInverse}
                  family="Ionicons"
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,74,110,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: zyrixTheme.surface,
    borderTopLeftRadius: zyrixRadius.xxl,
    borderTopRightRadius: zyrixRadius.xxl,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: zyrixSpacing.base,
    ...zyrixShadows.modal,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: zyrixTheme.border,
    marginTop: zyrixSpacing.sm + 2,
    marginBottom: zyrixSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm + 2,
    paddingHorizontal: zyrixSpacing.lg,
    paddingBottom: zyrixSpacing.sm + 2,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  subtitle: {
    fontSize: 12,
    color: zyrixTheme.textMuted,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: zyrixSpacing.lg,
    paddingBottom: zyrixSpacing.lg,
    rowGap: zyrixSpacing.base,
  },
  contextCard: {
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.aiSurface,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
    rowGap: 4,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: zyrixTheme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contextText: {
    fontSize: 14,
    color: zyrixTheme.textBody,
    fontWeight: '600',
  },
  contextEntity: {
    fontSize: 11,
    color: zyrixTheme.textMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: zyrixTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: zyrixSpacing.xs,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: zyrixSpacing.sm + 2,
  },
  tile: {
    width: '31%',
    minHeight: 88,
    padding: zyrixSpacing.sm + 2,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  tilePressed: {
    backgroundColor: zyrixTheme.cardHover,
    borderColor: zyrixTheme.borderStrong,
  },
  tileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: zyrixTheme.aiSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: zyrixTheme.textBody,
    lineHeight: 16,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm,
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.aiSurface,
  },
  loadingText: {
    fontSize: 13,
    color: zyrixTheme.primary,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm,
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: {
    fontSize: 13,
    color: zyrixTheme.danger,
    flex: 1,
  },
  responseCard: {
    padding: zyrixSpacing.base,
    borderRadius: zyrixRadius.lg,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    rowGap: zyrixSpacing.sm,
    ...zyrixShadows.card,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
  },
  responseReason: {
    fontSize: 14,
    color: zyrixTheme.textBody,
    lineHeight: 20,
  },
  responseTrust: {
    marginTop: zyrixSpacing.xs,
  },
  ctaButton: {
    marginTop: zyrixSpacing.sm,
    backgroundColor: zyrixTheme.primary,
    paddingVertical: 12,
    borderRadius: zyrixRadius.base,
    alignItems: 'center',
  },
  ctaText: {
    color: zyrixTheme.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: zyrixSpacing.sm,
    paddingHorizontal: zyrixSpacing.lg,
    paddingTop: zyrixSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: zyrixTheme.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: zyrixSpacing.base,
    paddingVertical: 10,
    borderRadius: zyrixRadius.base,
    backgroundColor: zyrixTheme.surfaceAlt,
    borderWidth: 1,
    borderColor: zyrixTheme.border,
    color: zyrixTheme.textBody,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: zyrixTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: zyrixTheme.textMuted,
  },
});

export default AICommandCenter;
