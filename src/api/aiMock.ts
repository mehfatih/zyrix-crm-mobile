/**
 * Deterministic mock data for AI features. Lives alongside `aiMock.ts`
 * so each resource module has a single source of truth for its stubs.
 *
 * Once the backend Gemini integration is live, swap the `USE_MOCKS`
 * flag in `src/api/ai.ts` and the mocks become unreachable.
 */

import type {
  AIResponse,
  ConversationAnalysis,
  ConversationItem,
  DuplicateGroup,
  LeadScoreResponse,
  LiveMeetingListItem,
  MeetingSummary,
  WorkflowDefinition,
} from '../types/ai';

export const buildCFOResponse = (question: string): AIResponse => ({
  answer: `Based on the last 6 months of data, here's what I see — revenue is trending up and two accounts are slipping on payments. Full analysis: "${question.slice(0, 80)}".`,
  charts: [
    {
      type: 'line',
      title: 'Monthly revenue',
      currency: true,
      series: [
        { x: '11', y: 82400 },
        { x: '12', y: 96200 },
        { x: '01', y: 88700 },
        { x: '02', y: 104500 },
        { x: '03', y: 121300 },
        { x: '04', y: 134900 },
      ],
    },
  ],
  insights: [
    {
      id: 'cfo_insight_1',
      type: 'success',
      title: 'Revenue up 11% MoM',
      description:
        'April revenue crossed 134K, the highest in six months. Expansion deals contributed 42% of the delta.',
    },
    {
      id: 'cfo_insight_2',
      type: 'warning',
      title: '2 customers past due',
      description:
        'Masr Foods (EGP 24.8K) and Amman Boutique (JOD 14.7K) are more than 30 days late on their latest invoices.',
      recommendation:
        'Send a reminder today and consider switching them to prepaid terms next cycle.',
    },
  ],
  suggestedActions: [
    {
      id: 'cfo_action_1',
      label: 'Send reminder to late customers',
      type: 'send_whatsapp',
    },
    {
      id: 'cfo_action_2',
      label: 'View cash-flow report',
      type: 'view_customer',
    },
  ],
});

export const buildWorkflowDefinition = (
  description: string
): WorkflowDefinition => ({
  id: `wf_${Math.random().toString(36).slice(2, 8)}`,
  name: description.slice(0, 60) || 'AI-generated workflow',
  trigger: 'newCustomer',
  actions: ['sendEmail', 'addTag', 'createTask'],
  conditions: ['customer.country in [SA, AE]'],
  description:
    'When a new customer signs up, send a welcome email, tag them "AI onboarded", and create a follow-up task for the assigned rep.',
});

export const buildLeadScoreResponse = (): LeadScoreResponse => ({
  generatedAt: new Date().toISOString(),
  items: [
    {
      leadId: 'lead_001',
      leadName: 'Rana K.',
      company: 'Lumina Clinics',
      score: 82,
      factors: [
        { label: 'Opened 6 emails in 7 days', delta: 12, kind: 'positive' },
        { label: 'Visited pricing page 3×', delta: 10, kind: 'positive' },
        { label: 'Deal value 45K SAR', delta: 8, kind: 'positive' },
      ],
      suggestedAction: 'Schedule a discovery call',
      lastActivity: '2026-04-21T09:20:00Z',
    },
    {
      leadId: 'lead_002',
      leadName: 'Khalid A.',
      company: 'Atlas Retail',
      score: 58,
      factors: [
        { label: 'Downloaded product sheet', delta: 6, kind: 'positive' },
        { label: 'No response in 10 days', delta: -8, kind: 'negative' },
        { label: 'Deal value 12K AED', delta: 2, kind: 'positive' },
      ],
      suggestedAction: 'Send personalised case study',
      lastActivity: '2026-04-14T13:05:00Z',
    },
    {
      leadId: 'lead_003',
      leadName: 'Zeynep B.',
      company: 'Ayyıldız Eğitim',
      score: 31,
      factors: [
        { label: 'Bounced onboarding email', delta: -10, kind: 'negative' },
        { label: 'No activity in 30 days', delta: -12, kind: 'negative' },
        { label: 'Original source: referral', delta: 4, kind: 'positive' },
      ],
      suggestedAction: 'Re-engage with targeted offer',
      lastActivity: '2026-03-20T11:00:00Z',
    },
  ],
});

export const buildConversationList = (): ConversationItem[] => [
  {
    id: 'cv_001',
    customerId: 'cus_001',
    customerName: 'Al-Salam Distribution',
    customerInitials: 'AS',
    channel: 'whatsapp',
    snippet:
      'عرض السعر ممتاز بس نقدر نناقش الدفعة المقدّمة؟ يمكن نوقع هذا الأسبوع.',
    sentiment: 'positive',
    sentimentConfidence: 0.86,
    intents: ['buyingSignal', 'priceObjection'],
    timestamp: '2026-04-20T09:30:00Z',
    hot: true,
  },
  {
    id: 'cv_002',
    customerId: 'cus_003',
    customerName: 'Nova Medikal',
    customerInitials: 'NM',
    channel: 'email',
    snippet:
      'We reviewed the proposal; one concern is SLA coverage in İstanbul vs Ankara branches. Can you clarify?',
    sentiment: 'neutral',
    sentimentConfidence: 0.74,
    intents: ['supportNeed', 'priceObjection'],
    timestamp: '2026-04-19T13:45:00Z',
    hot: false,
  },
  {
    id: 'cv_003',
    customerId: 'cus_004',
    customerName: 'Masr Foods',
    customerInitials: 'MF',
    channel: 'call',
    snippet:
      'الفاتورة اللي جاية متقدر ترحّلها شهرين؟ فيه ضغط كاش فلو علينا حاليًا.',
    sentiment: 'negative',
    sentimentConfidence: 0.78,
    intents: ['complaint'],
    timestamp: '2026-04-18T16:00:00Z',
    hot: false,
  },
  {
    id: 'cv_004',
    customerId: 'cus_005',
    customerName: 'Gulf Tech',
    customerInitials: 'GT',
    channel: 'meeting',
    snippet:
      'Gulf Tech keen to upgrade to Enterprise tier next quarter — need a proposal by the 15th.',
    sentiment: 'positive',
    sentimentConfidence: 0.92,
    intents: ['upgradeInterest', 'buyingSignal'],
    timestamp: '2026-04-21T11:10:00Z',
    hot: true,
  },
];

export const buildConversationAnalysis = (
  id: string
): ConversationAnalysis => ({
  id,
  customerName: 'Al-Salam Distribution',
  channel: 'whatsapp',
  summary:
    'Customer is enthusiastic about the annual CRM proposal but wants a smaller upfront deposit (20% vs. 40%). They are close to signing; decision-maker is Ahmed on the procurement team. Recommended to offer a tiered payment schedule and send a DocuSign link within 24h.',
  sentiment: 'positive',
  sentimentTimeline: [
    { time: 'Day 1', score: 0.4 },
    { time: 'Day 3', score: 0.55 },
    { time: 'Day 5', score: 0.78 },
    { time: 'Day 7', score: 0.86 },
  ],
  intents: ['buyingSignal', 'priceObjection'],
  messages: [
    {
      id: 'm1',
      speaker: 'customer',
      content: 'رأينا في العرض ممتاز والتفاصيل واضحة.',
      timestamp: '2026-04-18T10:00:00Z',
      highlights: [
        {
          text: 'رأينا في العرض ممتاز',
          kind: 'buying',
          note: 'إشارة شراء قوية — العميل عبّر عن رضا واضح.',
        },
      ],
    },
    {
      id: 'm2',
      speaker: 'rep',
      content: 'Thanks! Happy to walk you through the onboarding schedule.',
      timestamp: '2026-04-18T10:10:00Z',
    },
    {
      id: 'm3',
      speaker: 'customer',
      content:
        'بس الدفعة المقدمة 40% صعبة. هل نقدر نخليها 20% مع جدولة على 3 أشهر؟',
      timestamp: '2026-04-19T13:00:00Z',
      highlights: [
        {
          text: 'الدفعة المقدمة 40% صعبة',
          kind: 'concern',
          note: 'اعتراض سعري — اقترح جدولة دفعات 20/40/40.',
        },
      ],
    },
    {
      id: 'm4',
      speaker: 'customer',
      content: 'ومتى نقدر نوقع فعليًا؟',
      timestamp: '2026-04-19T13:02:00Z',
      highlights: [
        {
          text: 'متى نقدر نوقع',
          kind: 'question',
          note: 'يسأل عن موعد التوقيع — فرصة للإغلاق.',
        },
      ],
    },
  ],
  suggestedAction: {
    id: 'sa_1',
    label: 'Send revised schedule + DocuSign',
    type: 'send_whatsapp',
  },
});

export const buildDuplicateGroups = (): DuplicateGroup[] => [
  {
    id: 'dup_1',
    matchStrength: 0.97,
    entityType: 'customer',
    arabicVariant: true,
    records: [
      {
        id: 'cus_m1',
        primaryLabel: 'Mohammed Al-Harbi',
        secondaryLabel: 'mohammed@harbi.co',
        avatarInitials: 'MH',
      },
      {
        id: 'cus_m2',
        primaryLabel: 'محمد الحربي',
        secondaryLabel: 'm.harbi@harbi.co',
        avatarInitials: 'MH',
      },
    ],
    fields: [
      {
        key: 'name',
        label: 'Name',
        values: ['Mohammed Al-Harbi', 'محمد الحربي'],
        recommendedIndex: 1,
      },
      {
        key: 'email',
        label: 'Email',
        values: ['mohammed@harbi.co', 'm.harbi@harbi.co'],
        recommendedIndex: 0,
      },
      {
        key: 'phone',
        label: 'Phone',
        values: ['+966 50 111 2222', '+966 50 111 2222'],
        recommendedIndex: 0,
      },
    ],
  },
  {
    id: 'dup_2',
    matchStrength: 0.85,
    entityType: 'company',
    records: [
      {
        id: 'cmp_1',
        primaryLabel: 'Nova Medikal A.Ş.',
        secondaryLabel: 'nova.medikal.tr',
        avatarInitials: 'NM',
      },
      {
        id: 'cmp_2',
        primaryLabel: 'Nova Medical Inc.',
        secondaryLabel: 'novamedical.com',
        avatarInitials: 'NM',
      },
    ],
    fields: [
      {
        key: 'country',
        label: 'Country',
        values: ['TR', 'TR'],
        recommendedIndex: 0,
      },
      {
        key: 'tax',
        label: 'Tax ID',
        values: ['1234567890', '—'],
        recommendedIndex: 0,
      },
    ],
  },
  {
    id: 'dup_3',
    matchStrength: 0.74,
    entityType: 'contact',
    records: [
      {
        id: 'ct_1',
        primaryLabel: 'Omar Khaled',
        secondaryLabel: 'omar@company.co',
        avatarInitials: 'OK',
      },
      {
        id: 'ct_2',
        primaryLabel: 'Omer Khaled',
        secondaryLabel: 'omer.k@company.co',
        avatarInitials: 'OK',
      },
    ],
    fields: [
      {
        key: 'name',
        label: 'Name',
        values: ['Omar Khaled', 'Omer Khaled'],
        recommendedIndex: 0,
      },
      {
        key: 'email',
        label: 'Email',
        values: ['omar@company.co', 'omer.k@company.co'],
        recommendedIndex: 0,
      },
    ],
  },
];

export const buildMeetings = (): LiveMeetingListItem[] => [
  {
    id: 'mt_001',
    title: 'Q2 kickoff with Gulf Tech',
    source: 'google_meet',
    startsAt: '2026-04-24T10:00:00Z',
    durationMinutes: 45,
    attendees: [
      { id: 'a1', name: 'Fatima', initials: 'FH' },
      { id: 'a2', name: 'Gulf Tech CTO', initials: 'GT' },
    ],
    summaryPreview:
      'Upcoming kickoff. Pre-read shared; focus on security + integrations.',
    actionItemsCount: 2,
    bucket: 'upcoming',
  },
  {
    id: 'mt_002',
    title: 'Nova Medikal demo follow-up',
    source: 'zoom',
    startsAt: '2026-04-20T12:00:00Z',
    durationMinutes: 35,
    attendees: [
      { id: 'a3', name: 'Selin', initials: 'SA' },
      { id: 'a4', name: 'Nova procurement', initials: 'NM' },
    ],
    summaryPreview:
      'Scope confirmed for 5 branches. Concerns on SLA clarified. Sending revised proposal.',
    actionItemsCount: 4,
    bucket: 'recent',
  },
  {
    id: 'mt_003',
    title: 'Al-Salam renewal discussion',
    source: 'teams',
    startsAt: '2026-04-15T08:30:00Z',
    durationMinutes: 55,
    attendees: [
      { id: 'a5', name: 'Omar', initials: 'OK' },
      { id: 'a6', name: 'Al-Salam CFO', initials: 'AS' },
    ],
    summaryPreview:
      'Agreed on 3-year extension pending board approval. Payment schedule revised to 20/40/40.',
    actionItemsCount: 3,
    bucket: 'recent',
  },
];

export const buildMeetingSummary = (id: string): MeetingSummary => ({
  id,
  title: 'Nova Medikal demo follow-up',
  source: 'zoom',
  startsAt: '2026-04-20T12:00:00Z',
  durationMinutes: 35,
  attendees: [
    { id: 'a3', name: 'Selin A.', initials: 'SA' },
    { id: 'a4', name: 'Nova procurement', initials: 'NM' },
    { id: 'a5', name: 'Nova IT', initials: 'NI' },
  ],
  summary:
    'Nova confirmed roll-out across 5 branches, pending security review. They raised concerns about SLA coverage during Ramadan hours and requested clarification on data residency. Selin committed to send a revised proposal by Monday, with a 20/40/40 payment schedule.',
  topics: ['Pricing', 'SLA', 'Data residency', 'Deployment timeline'],
  overallSentiment: 'positive',
  transcript: [
    {
      speaker: 'Selin',
      content:
        'Thanks for joining — I have the updated proposal ready based on last week.',
      at: '00:00',
    },
    {
      speaker: 'Nova procurement',
      content:
        'Appreciate it. The scope looks right; we still need clarity on SLA outside business hours.',
      at: '02:15',
    },
    {
      speaker: 'Selin',
      content:
        'We cover 24/7 for Severity 1 and 2; for Severity 3 we respond in 4 business hours.',
      at: '03:30',
    },
    {
      speaker: 'Nova IT',
      content:
        'Data residency — can we keep data inside TR even if we spin up EMEA resources?',
      at: '09:50',
    },
    {
      speaker: 'Selin',
      content:
        "Yes, we can pin the tenant to Frankfurt-TR region. I'll send the revised schedule Monday.",
      at: '11:40',
    },
  ],
  actionItems: [
    {
      id: 'ai1',
      text: 'Send revised proposal with 20/40/40 payment schedule',
      assignee: 'Selin A.',
      dueDate: '2026-04-26',
      done: false,
    },
    {
      id: 'ai2',
      text: 'Prepare SLA FAQ addendum',
      assignee: 'Selin A.',
      dueDate: '2026-04-27',
      done: false,
    },
    {
      id: 'ai3',
      text: 'Confirm data residency with CTO',
      assignee: 'Omar K.',
      dueDate: '2026-04-25',
      done: true,
    },
    {
      id: 'ai4',
      text: 'Schedule follow-up demo for IT team',
      assignee: 'Selin A.',
      dueDate: '2026-05-02',
      done: false,
    },
  ],
  decisions: [
    {
      id: 'd1',
      text: 'Roll out to 5 Nova Medikal branches in Q3',
      context: 'Agreed after scope review; pending board approval on budget.',
    },
    {
      id: 'd2',
      text: 'Tenant will be pinned to Frankfurt-TR region',
      context: 'Required to satisfy data residency policy.',
    },
  ],
});
