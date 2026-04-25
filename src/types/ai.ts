/**
 * AI feature type catalogue. Shared across the API layer, hooks, and
 * UI components so message/insight/action shapes stay in lockstep.
 *
 * Every AI call goes through the backend (Gemini 2.0 Flash on the
 * server). The mobile client never talks to Anthropic or OpenAI
 * directly — these types model what the backend returns.
 */

export type SupportedChatLanguage = 'ar' | 'en' | 'tr';

export type InsightType = 'warning' | 'success' | 'info' | 'critical';

export interface InsightMetric {
  label: string;
  value: number | string;
  delta?: number;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation?: string;
  metric?: InsightMetric;
}

export type ChartKind = 'line' | 'bar' | 'pie';

export interface ChartSeriesPoint {
  x: string;
  y: number;
}

export interface ChartCategoryPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartData {
  type: ChartKind;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  series?: ChartSeriesPoint[];
  categories?: ChartCategoryPoint[];
  currency?: boolean;
}

export type ActionType =
  | 'create_deal'
  | 'send_email'
  | 'send_whatsapp'
  | 'schedule_call'
  | 'view_customer'
  | 'view_deal'
  | 'run_workflow';

export interface Action {
  id: string;
  label: string;
  type: ActionType;
  params?: Record<string, string | number | boolean>;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  charts?: ChartData[];
  insights?: Insight[];
  actions?: Action[];
}

export interface AIResponse {
  answer: string;
  charts?: ChartData[];
  insights?: Insight[];
  suggestedActions?: Action[];
}

export type AIBuilderMode = 'architect' | 'builder' | 'report';

export interface AIBuildResult {
  title: string;
  summary: string;
  artifacts: {
    kind: 'workflow' | 'template' | 'report' | 'setup';
    label: string;
    preview?: string;
  }[];
}

export type TriggerTypeName =
  | 'newCustomer'
  | 'dealStageChanged'
  | 'quoteAccepted'
  | 'invoiceOverdue'
  | 'customerInactive'
  | 'scheduledDate';

export type WorkflowActionType =
  | 'sendEmail'
  | 'sendWhatsApp'
  | 'sendSMS'
  | 'createTask'
  | 'addTag'
  | 'moveToStage'
  | 'notifyUser';

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: TriggerTypeName;
  actions: WorkflowActionType[];
  conditions: string[];
  description: string;
}

export interface LeadFactor {
  label: string;
  delta: number;
  kind: 'positive' | 'negative';
}

export interface LeadScore {
  leadId: string;
  leadName: string;
  company: string;
  score: number;
  factors: LeadFactor[];
  suggestedAction: string;
  lastActivity?: string;
}

export interface LeadScoreResponse {
  items: LeadScore[];
  generatedAt: string;
}

export type ConversationChannel = 'email' | 'whatsapp' | 'call' | 'meeting';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type ConversationIntent =
  | 'buyingSignal'
  | 'priceObjection'
  | 'supportNeed'
  | 'complaint'
  | 'upgradeInterest';

export interface ConversationItem {
  id: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  channel: ConversationChannel;
  snippet: string;
  sentiment: SentimentLabel;
  sentimentConfidence: number;
  intents: ConversationIntent[];
  timestamp: string;
  hot: boolean;
}

export interface ConversationHighlight {
  text: string;
  kind: 'buying' | 'concern' | 'question';
  note: string;
}

export interface ConversationMessage {
  id: string;
  speaker: 'customer' | 'rep';
  content: string;
  timestamp: string;
  highlights?: ConversationHighlight[];
}

export interface ConversationAnalysis {
  id: string;
  customerName: string;
  channel: ConversationChannel;
  summary: string;
  sentiment: SentimentLabel;
  sentimentTimeline: { time: string; score: number }[];
  intents: ConversationIntent[];
  messages: ConversationMessage[];
  suggestedAction: Action;
}

export interface DuplicateRecordField {
  key: string;
  label: string;
  values: string[];
  recommendedIndex: number;
}

export interface DuplicateRecord {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string;
  avatarInitials: string;
}

export interface DuplicateGroup {
  id: string;
  matchStrength: number;
  entityType: 'customer' | 'contact' | 'company';
  records: DuplicateRecord[];
  fields: DuplicateRecordField[];
  arabicVariant?: boolean;
}

export type MeetingSource = 'google_meet' | 'zoom' | 'teams' | 'upload';

export interface MeetingAttendee {
  id: string;
  name: string;
  initials: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  source: MeetingSource;
  startsAt: string;
  durationMinutes: number;
  attendees: MeetingAttendee[];
  summary: string;
  topics: string[];
  overallSentiment: SentimentLabel;
  transcript: { speaker: string; content: string; at: string }[];
  actionItems: { id: string; text: string; assignee?: string; dueDate?: string; done: boolean }[];
  decisions: { id: string; text: string; context: string }[];
}

export interface LiveMeetingListItem {
  id: string;
  title: string;
  source: MeetingSource;
  startsAt: string;
  durationMinutes: number;
  attendees: MeetingAttendee[];
  summaryPreview: string;
  actionItemsCount: number;
  bucket: 'upcoming' | 'recent';
}

// ─────────────────────────────────────────────────────────────────────
// AI Sprint 1 (section 15) — Agent/Decision-engine contract
// ─────────────────────────────────────────────────────────────────────

export type AgentRole =
  | 'sales-followup'
  | 'deal-risk'
  | 'revenue'
  | 'customer-profile'
  | 'messaging'
  | 'onboarding'
  | 'integration'
  | 'task';

export type AgentPermissionLevel = 1 | 2 | 3 | 4;

export interface AIInsight {
  title: string;
  reason: string;
  confidence: number;
  recommendedAction: string;
  cta: { label: string; action: string };
  signals?: string[];
}

export interface AgentOutput extends AIInsight {
  agentRole: AgentRole;
  permissionLevel: AgentPermissionLevel;
  entityType?: 'customer' | 'deal' | 'task' | 'message';
  entityId?: string;
  draftPayload?: unknown;
}

export interface RankedAction extends AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'followup' | 'revenue' | 'retention';
  priority: number;
  entityType?: string;
  entityId?: string;
  estimatedImpact?: { type: 'revenue' | 'retention'; value: number };
}

export interface AIContext {
  screen: string;
  entityType?: string;
  entityId?: string;
  summary: string;
}
