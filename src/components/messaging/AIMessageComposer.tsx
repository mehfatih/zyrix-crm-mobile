/**
 * AIMessageComposer — AI-augmented message composer
 * (AI Sprint 3 §12 / Task 8).
 *
 * AI features inside the composer:
 *   - Suggest reply (pulls a draft from `aiAgents.draftReply`).
 *   - Improve tone → opens picker (professional / friendly / concise / persuasive).
 *   - Translate AR ↔ EN ↔ TR.
 *   - Shorten / Personalize / Explain.
 *
 * CRITICAL: every AI-generated message is editable before sending.
 * The component never auto-sends — it puts the suggestion into the
 * input, and the user reviews and confirms.
 *
 * Successful tones are written to `aiMemoryService.recordRecommendationOutcome`
 * so the memory layer learns which styles convert for this workspace.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type AnyIconName } from '../common/Icon';
import { AITrustBadge } from '../ai/AITrustBadge';
import {
  zyrixRadius,
  zyrixShadows,
  zyrixSpacing,
  zyrixTheme,
} from '../../theme/zyrixTheme';
import { aiMemoryService } from '../../services/aiMemoryService';
import type { SupportedChatLanguage } from '../../types/ai';

export type ComposerTone =
  | 'professional'
  | 'friendly'
  | 'concise'
  | 'persuasive';

export type ComposerOperation =
  | 'suggest'
  | 'improve'
  | 'translate'
  | 'shorten'
  | 'personalize'
  | 'explain';

export interface AIComposerSendInput {
  text: string;
  tone?: ComposerTone;
  language?: SupportedChatLanguage;
}

export interface AIMessageComposerProps {
  workspaceId: string;
  customerName?: string;
  language?: SupportedChatLanguage;
  initialDraft?: string;
  onSend?: (input: AIComposerSendInput) => void;
}

const TONE_OPTIONS: { id: ComposerTone; icon: AnyIconName }[] = [
  { id: 'professional', icon: 'briefcase-outline' },
  { id: 'friendly', icon: 'happy-outline' },
  { id: 'concise', icon: 'flash-outline' },
  { id: 'persuasive', icon: 'megaphone-outline' },
];

const LANGUAGE_OPTIONS: SupportedChatLanguage[] = ['ar', 'en', 'tr'];

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock generators — production calls /api/ai/messaging/suggest etc.

const mockSuggestReply = async (customerName?: string): Promise<string> => {
  await sleep(300);
  if (!customerName) {
    return 'Thanks for getting back to me. Want me to send over a quick proposal so we can move forward this week?';
  }
  return `Hi ${customerName}, thanks for the update. I have a slot tomorrow at 11:00 to walk you through the proposal — does that work?`;
};

const mockImproveTone = async (
  text: string,
  tone: ComposerTone
): Promise<string> => {
  await sleep(250);
  switch (tone) {
    case 'professional':
      return `${text}\n\nKindly let me know your preference and I will adjust accordingly.`;
    case 'friendly':
      return `Hey! ${text} 🙂 Just let me know what works best for you.`;
    case 'concise':
      return text.split(/\n+/).slice(0, 2).join(' ').trim();
    case 'persuasive':
      return `${text}\n\nMost teams in your space are seeing 20–30% faster cycles after this change — happy to walk you through how.`;
    default:
      return text;
  }
};

const mockTranslate = async (
  text: string,
  to: SupportedChatLanguage
): Promise<string> => {
  await sleep(280);
  switch (to) {
    case 'ar':
      return `${text}\n\n— الترجمة العربية: شكراً لرسالتك، سنرد بأسرع وقت ممكن.`;
    case 'tr':
      return `${text}\n\n— Türkçe: Mesajınız için teşekkürler, en kısa sürede yanıtlayacağım.`;
    case 'en':
    default:
      return `${text}\n\n— EN: Thanks for your message, I'll get back to you shortly.`;
  }
};

const mockShorten = async (text: string): Promise<string> => {
  await sleep(180);
  const sentences = text.split(/[.!?]\s+/).filter(Boolean);
  return sentences.slice(0, 1).join('. ') + (sentences.length > 1 ? '.' : '');
};

const mockPersonalize = async (
  text: string,
  customerName?: string
): Promise<string> => {
  await sleep(200);
  if (!customerName) return text;
  if (text.toLowerCase().startsWith('hi') || text.toLowerCase().startsWith('hello')) {
    return text;
  }
  return `Hi ${customerName} — ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
};

const mockExplain = async (text: string): Promise<string> => {
  await sleep(220);
  const reasons: string[] = [];
  if (text.includes('?')) reasons.push('asks a clear next-step question');
  if (text.length < 120) reasons.push('short, easy to reply on mobile');
  if (/(thank|appreciate)/i.test(text)) reasons.push('opens with appreciation');
  if (reasons.length === 0) reasons.push('neutral tone, on-topic');
  return reasons.join(' · ');
};

export const AIMessageComposer: React.FC<AIMessageComposerProps> = ({
  workspaceId,
  customerName,
  language = 'en',
  initialDraft = '',
  onSend,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);
  const [busy, setBusy] = useState<ComposerOperation | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [tonePickerOpen, setTonePickerOpen] = useState(false);
  const [translatePickerOpen, setTranslatePickerOpen] = useState(false);
  const [appliedTone, setAppliedTone] = useState<ComposerTone | null>(null);
  const [appliedLanguage, setAppliedLanguage] = useState<SupportedChatLanguage>(language);

  const setBusyOp = (op: ComposerOperation | null): void => setBusy(op);

  const runSuggest = async (): Promise<void> => {
    setBusyOp('suggest');
    try {
      const text = await mockSuggestReply(customerName);
      setDraft(text);
    } finally {
      setBusyOp(null);
    }
  };

  const runImprove = async (tone: ComposerTone): Promise<void> => {
    setTonePickerOpen(false);
    if (!draft.trim()) return;
    setBusyOp('improve');
    try {
      const text = await mockImproveTone(draft, tone);
      setDraft(text);
      setAppliedTone(tone);
    } finally {
      setBusyOp(null);
    }
  };

  const runTranslate = async (to: SupportedChatLanguage): Promise<void> => {
    setTranslatePickerOpen(false);
    if (!draft.trim()) return;
    setBusyOp('translate');
    try {
      const text = await mockTranslate(draft, to);
      setDraft(text);
      setAppliedLanguage(to);
    } finally {
      setBusyOp(null);
    }
  };

  const runShorten = async (): Promise<void> => {
    if (!draft.trim()) return;
    setBusyOp('shorten');
    try {
      const text = await mockShorten(draft);
      setDraft(text);
    } finally {
      setBusyOp(null);
    }
  };

  const runPersonalize = async (): Promise<void> => {
    if (!draft.trim()) return;
    setBusyOp('personalize');
    try {
      const text = await mockPersonalize(draft, customerName);
      setDraft(text);
    } finally {
      setBusyOp(null);
    }
  };

  const runExplain = async (): Promise<void> => {
    if (!draft.trim()) return;
    setBusyOp('explain');
    try {
      const note = await mockExplain(draft);
      setExplanation(note);
    } finally {
      setBusyOp(null);
    }
  };

  const handleSend = (): void => {
    const text = draft.trim();
    if (!text) return;
    if (appliedTone) {
      void aiMemoryService.recordRecommendationOutcome({
        workspaceId,
        recommendationId: `tone-${appliedTone}`,
        outcome: 'accepted',
      });
    }
    onSend?.({ text, tone: appliedTone ?? undefined, language: appliedLanguage });
    setDraft('');
    setAppliedTone(null);
    setExplanation(null);
  };

  return (
    <View style={styles.root}>
      {/* AI suggest reply — sits above keyboard */}
      <Pressable
        onPress={runSuggest}
        style={styles.suggestBar}
        accessibilityRole="button"
        accessibilityLabel={t('messaging.ai.suggestReply')}
      >
        <Icon
          name="sparkles-outline"
          size={14}
          color={zyrixTheme.primary}
          family="Ionicons"
        />
        <Text style={styles.suggestText}>
          {busy === 'suggest'
            ? t('messaging.ai.thinking')
            : t('messaging.ai.suggestReply')}
        </Text>
        {busy === 'suggest' ? (
          <ActivityIndicator size="small" color={zyrixTheme.primary} />
        ) : (
          <Icon
            name="arrow-forward"
            size={14}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
        )}
      </Pressable>

      {/* Tools row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolRow}
      >
        <ToolChip
          label={t('messaging.ai.improveTone')}
          icon="color-wand-outline"
          busy={busy === 'improve'}
          onPress={() => setTonePickerOpen(true)}
        />
        <ToolChip
          label={t('messaging.ai.translate')}
          icon="language-outline"
          busy={busy === 'translate'}
          onPress={() => setTranslatePickerOpen(true)}
        />
        <ToolChip
          label={t('messaging.ai.shorten')}
          icon="contract-outline"
          busy={busy === 'shorten'}
          onPress={runShorten}
        />
        <ToolChip
          label={t('messaging.ai.personalize')}
          icon="person-add-outline"
          busy={busy === 'personalize'}
          onPress={runPersonalize}
        />
        <ToolChip
          label={t('messaging.ai.explain')}
          icon="information-circle-outline"
          busy={busy === 'explain'}
          onPress={runExplain}
        />
      </ScrollView>

      {explanation ? (
        <View style={styles.explainCard}>
          <Icon
            name="sparkles-outline"
            size={12}
            color={zyrixTheme.primary}
            family="Ionicons"
          />
          <Text style={styles.explainText}>{explanation}</Text>
          <AITrustBadge confidence={75} compact />
        </View>
      ) : null}

      {/* Editable draft + send */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('messaging.ai.typeMessage')}
          placeholderTextColor={zyrixTheme.textMuted}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim()}
          style={[
            styles.sendBtn,
            !draft.trim() ? styles.sendBtnDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('messaging.ai.send')}
        >
          <Icon
            name="paper-plane-outline"
            size={16}
            color={zyrixTheme.textInverse}
            family="Ionicons"
          />
        </Pressable>
      </View>

      {/* Tone picker */}
      <Modal
        transparent
        visible={tonePickerOpen}
        animationType="fade"
        onRequestClose={() => setTonePickerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTonePickerOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{t('messaging.ai.toneTitle')}</Text>
            {TONE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => runImprove(option.id)}
                style={styles.modalRow}
              >
                <Icon
                  name={option.icon}
                  size={18}
                  color={zyrixTheme.primary}
                  family="Ionicons"
                />
                <Text style={styles.modalRowText}>
                  {t(`messaging.ai.tone.${option.id}`)}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Translate picker */}
      <Modal
        transparent
        visible={translatePickerOpen}
        animationType="fade"
        onRequestClose={() => setTranslatePickerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTranslatePickerOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {t('messaging.ai.translateTitle')}
            </Text>
            {LANGUAGE_OPTIONS.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => runTranslate(lang)}
                style={styles.modalRow}
              >
                <Icon
                  name="globe-outline"
                  size={18}
                  color={zyrixTheme.primary}
                  family="Ionicons"
                />
                <Text style={styles.modalRowText}>
                  {t(`messaging.ai.language.${lang}`)}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const ToolChip: React.FC<{
  label: string;
  icon: AnyIconName;
  busy?: boolean;
  onPress: () => void;
}> = ({ label, icon, busy, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[styles.toolChip, busy ? styles.toolChipBusy : null]}
    accessibilityRole="button"
  >
    {busy ? (
      <ActivityIndicator size="small" color={zyrixTheme.primary} />
    ) : (
      <Icon name={icon} size={13} color={zyrixTheme.primary} family="Ionicons" />
    )}
    <Text style={styles.toolChipText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: zyrixTheme.surface,
    borderTopWidth: 1,
    borderTopColor: zyrixTheme.cardBorder,
    rowGap: zyrixSpacing.sm,
    padding: zyrixSpacing.sm + 4,
  },
  suggestBar: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  suggestText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: zyrixTheme.primary,
  },
  toolRow: {
    columnGap: 8,
    paddingVertical: 2,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: zyrixRadius.pill,
    backgroundColor: zyrixTheme.cardBg,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  toolChipBusy: {
    opacity: 0.7,
  },
  toolChipText: {
    fontSize: 12,
    color: zyrixTheme.primary,
    fontWeight: '600',
  },
  explainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: zyrixTheme.aiSurface,
    borderRadius: zyrixRadius.base,
    padding: zyrixSpacing.sm,
    borderWidth: 1,
    borderColor: zyrixTheme.aiBorder,
  },
  explainText: {
    flex: 1,
    fontSize: 12,
    color: zyrixTheme.textBody,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    columnGap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: zyrixTheme.cardBorder,
    borderRadius: zyrixRadius.base,
    backgroundColor: zyrixTheme.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: zyrixTheme.textBody,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: zyrixTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...zyrixShadows.card,
  },
  sendBtnDisabled: {
    backgroundColor: zyrixTheme.aiBorder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,74,110,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: zyrixSpacing.lg,
  },
  modalCard: {
    backgroundColor: zyrixTheme.surface,
    borderRadius: zyrixRadius.xl,
    padding: zyrixSpacing.base,
    width: '100%',
    maxWidth: 320,
    rowGap: 6,
    ...zyrixShadows.modal,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: zyrixTheme.textHeading,
    marginBottom: 4,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: zyrixRadius.base,
  },
  modalRowText: {
    fontSize: 14,
    color: zyrixTheme.textBody,
    fontWeight: '600',
  },
});

export default AIMessageComposer;
