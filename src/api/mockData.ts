/**
 * In-memory mock dataset used by every resource module until the
 * backend is wired up. Keep these generators deterministic so the
 * UI state is predictable across reloads.
 */

import type { CountryCode } from '../types/country';

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: CountryCode;
  taxId?: string;
  address?: string;
  totalRevenue: number;
  healthScore: number;
  tags: string[];
  createdAt: string;
  lastContactAt: string;
  avatarInitials: string;
}

export interface MockDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  assignedToName: string;
  notes?: string;
  createdAt: string;
  closedAt?: string;
  closedStatus?: 'won' | 'lost';
}

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export const DEAL_PIPELINE: readonly DealStage[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
];

export interface MockQuote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired';
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  expiresAt: string;
  items: MockQuoteItem[];
}

export interface MockQuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface MockContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  type: 'service' | 'subscription' | 'one_time';
  amount: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: 'draft' | 'active' | 'expired' | 'terminated';
}

export interface MockActivity {
  id: string;
  kind:
    | 'call_made'
    | 'email_sent'
    | 'meeting_scheduled'
    | 'deal_won'
    | 'payment_received'
    | 'customer_created';
  title: string;
  subtitle?: string;
  amount?: number;
  createdAt: string;
}

const CUSTOMERS: MockCustomer[] = [
  {
    id: 'cus_001',
    name: 'Al-Salam Distribution',
    email: 'finance@alsalam.sa',
    phone: '501234567',
    company: 'Al-Salam Distribution',
    country: 'SA',
    taxId: '300012345600003',
    address: 'Riyadh',
    totalRevenue: 185400,
    healthScore: 86,
    tags: ['gold', 'distributor'],
    createdAt: '2024-06-12T10:00:00Z',
    lastContactAt: '2026-04-17T09:30:00Z',
    avatarInitials: 'AS',
  },
  {
    id: 'cus_002',
    name: 'Elma Retail',
    email: 'hello@elma.ae',
    phone: '501122334',
    company: 'Elma Retail',
    country: 'AE',
    taxId: '100123456700003',
    address: 'Dubai',
    totalRevenue: 62350,
    healthScore: 72,
    tags: ['retail'],
    createdAt: '2024-11-02T09:15:00Z',
    lastContactAt: '2026-04-19T14:45:00Z',
    avatarInitials: 'ER',
  },
  {
    id: 'cus_003',
    name: 'Nova Medikal',
    email: 'sales@novamedikal.com.tr',
    phone: '5321234567',
    company: 'Nova Medikal A.Ş.',
    country: 'TR',
    taxId: '1234567890',
    address: 'İstanbul',
    totalRevenue: 142000,
    healthScore: 64,
    tags: ['healthcare', 'annual-contract'],
    createdAt: '2025-01-18T11:30:00Z',
    lastContactAt: '2026-04-10T08:00:00Z',
    avatarInitials: 'NM',
  },
  {
    id: 'cus_004',
    name: 'Masr Foods',
    email: 'orders@masrfoods.eg',
    phone: '1012345678',
    company: 'Masr Foods Co.',
    country: 'EG',
    taxId: '123456789',
    address: 'Cairo',
    totalRevenue: 24800,
    healthScore: 38,
    tags: ['at-risk'],
    createdAt: '2025-05-04T10:45:00Z',
    lastContactAt: '2026-02-12T10:00:00Z',
    avatarInitials: 'MF',
  },
  {
    id: 'cus_005',
    name: 'Gulf Tech',
    email: 'contact@gulftech.kw',
    phone: '12345678',
    company: 'Gulf Tech Holdings',
    country: 'KW',
    address: 'Kuwait City',
    totalRevenue: 98600,
    healthScore: 80,
    tags: ['tech', 'enterprise'],
    createdAt: '2024-09-22T14:10:00Z',
    lastContactAt: '2026-04-21T12:00:00Z',
    avatarInitials: 'GT',
  },
  {
    id: 'cus_006',
    name: 'Doha Logistics',
    email: 'team@dohalogs.qa',
    phone: '33445566',
    company: 'Doha Logistics',
    country: 'QA',
    address: 'Doha',
    totalRevenue: 31250,
    healthScore: 55,
    tags: ['logistics'],
    createdAt: '2025-02-11T08:20:00Z',
    lastContactAt: '2026-04-08T15:20:00Z',
    avatarInitials: 'DL',
  },
  {
    id: 'cus_007',
    name: 'Amman Boutique',
    email: 'studio@ammanboutique.jo',
    phone: '791234567',
    company: 'Amman Boutique',
    country: 'JO',
    address: 'Amman',
    totalRevenue: 14780,
    healthScore: 42,
    tags: ['retail', 'small'],
    createdAt: '2025-07-30T13:45:00Z',
    lastContactAt: '2026-03-12T09:10:00Z',
    avatarInitials: 'AB',
  },
  {
    id: 'cus_008',
    name: 'Muscat Marine',
    email: 'ops@muscatmarine.om',
    phone: '91234567',
    company: 'Muscat Marine LLC',
    country: 'OM',
    address: 'Muscat',
    totalRevenue: 78250,
    healthScore: 75,
    tags: ['marine', 'b2b'],
    createdAt: '2024-12-05T11:00:00Z',
    lastContactAt: '2026-04-18T17:00:00Z',
    avatarInitials: 'MM',
  },
];

const DEALS: MockDeal[] = [
  {
    id: 'deal_001',
    title: 'Annual service contract',
    customerId: 'cus_001',
    customerName: 'Al-Salam Distribution',
    value: 45000,
    stage: 'proposal',
    probability: 65,
    expectedCloseDate: '2026-05-20',
    assignedTo: 'rep_001',
    assignedToName: 'Fatima H.',
    notes: 'Waiting on procurement signoff.',
    createdAt: '2026-03-01T09:30:00Z',
  },
  {
    id: 'deal_002',
    title: 'Pilot program (Q2)',
    customerId: 'cus_002',
    customerName: 'Elma Retail',
    value: 12000,
    stage: 'qualified',
    probability: 40,
    expectedCloseDate: '2026-05-05',
    assignedTo: 'rep_002',
    assignedToName: 'Omar K.',
    createdAt: '2026-03-28T11:00:00Z',
  },
  {
    id: 'deal_003',
    title: 'Multi-branch rollout',
    customerId: 'cus_003',
    customerName: 'Nova Medikal',
    value: 92000,
    stage: 'negotiation',
    probability: 80,
    expectedCloseDate: '2026-05-30',
    assignedTo: 'rep_003',
    assignedToName: 'Selin A.',
    createdAt: '2026-02-12T10:15:00Z',
  },
  {
    id: 'deal_004',
    title: 'POS upgrade',
    customerId: 'cus_005',
    customerName: 'Gulf Tech',
    value: 28000,
    stage: 'lead',
    probability: 15,
    expectedCloseDate: '2026-06-15',
    assignedTo: 'rep_001',
    assignedToName: 'Fatima H.',
    createdAt: '2026-04-11T13:40:00Z',
  },
  {
    id: 'deal_005',
    title: 'Loyalty tier expansion',
    customerId: 'cus_008',
    customerName: 'Muscat Marine',
    value: 18500,
    stage: 'won',
    probability: 100,
    expectedCloseDate: '2026-04-15',
    assignedTo: 'rep_002',
    assignedToName: 'Omar K.',
    createdAt: '2026-03-04T14:20:00Z',
    closedAt: '2026-04-15T09:00:00Z',
    closedStatus: 'won',
  },
  {
    id: 'deal_006',
    title: 'Custom integration',
    customerId: 'cus_007',
    customerName: 'Amman Boutique',
    value: 6800,
    stage: 'lost',
    probability: 0,
    expectedCloseDate: '2026-04-01',
    assignedTo: 'rep_003',
    assignedToName: 'Selin A.',
    createdAt: '2026-02-18T10:00:00Z',
    closedAt: '2026-04-02T16:00:00Z',
    closedStatus: 'lost',
  },
];

const QUOTES: MockQuote[] = [
  {
    id: 'quo_001',
    quoteNumber: 'Q-2026-0041',
    customerId: 'cus_001',
    customerName: 'Al-Salam Distribution',
    subtotal: 39130,
    tax: 5870,
    total: 45000,
    status: 'sent',
    sentAt: '2026-04-02T08:00:00Z',
    viewedAt: '2026-04-05T11:10:00Z',
    expiresAt: '2026-05-02',
    items: [
      { description: 'Annual CRM subscription', quantity: 1, unitPrice: 30000 },
      { description: 'Onboarding services', quantity: 1, unitPrice: 9130 },
    ],
  },
  {
    id: 'quo_002',
    quoteNumber: 'Q-2026-0042',
    customerId: 'cus_003',
    customerName: 'Nova Medikal',
    subtotal: 76666,
    tax: 15334,
    total: 92000,
    status: 'accepted',
    sentAt: '2026-03-10T09:00:00Z',
    viewedAt: '2026-03-11T12:00:00Z',
    acceptedAt: '2026-03-20T10:45:00Z',
    expiresAt: '2026-04-30',
    items: [
      { description: 'Multi-branch rollout', quantity: 5, unitPrice: 15333 },
    ],
  },
];

const CONTRACTS: MockContract[] = [
  {
    id: 'con_001',
    contractNumber: 'C-2026-0017',
    customerId: 'cus_003',
    customerName: 'Nova Medikal',
    type: 'subscription',
    amount: 92000,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    autoRenew: true,
    status: 'active',
  },
  {
    id: 'con_002',
    contractNumber: 'C-2026-0014',
    customerId: 'cus_008',
    customerName: 'Muscat Marine',
    type: 'service',
    amount: 18500,
    startDate: '2026-04-15',
    endDate: '2026-10-15',
    autoRenew: false,
    status: 'active',
  },
];

const ACTIVITIES: MockActivity[] = [
  {
    id: 'act_001',
    kind: 'deal_won',
    title: 'Deal closed: Loyalty tier expansion',
    subtitle: 'Muscat Marine',
    amount: 18500,
    createdAt: '2026-04-15T09:00:00Z',
  },
  {
    id: 'act_002',
    kind: 'payment_received',
    title: 'Payment received',
    subtitle: 'Nova Medikal — Invoice I-0037',
    amount: 45000,
    createdAt: '2026-04-20T14:20:00Z',
  },
  {
    id: 'act_003',
    kind: 'email_sent',
    title: 'Quote Q-2026-0041 sent',
    subtitle: 'Al-Salam Distribution',
    createdAt: '2026-04-02T08:00:00Z',
  },
  {
    id: 'act_004',
    kind: 'meeting_scheduled',
    title: 'Discovery call scheduled',
    subtitle: 'Gulf Tech — Thu 2pm',
    createdAt: '2026-04-11T13:40:00Z',
  },
  {
    id: 'act_005',
    kind: 'customer_created',
    title: 'New customer added',
    subtitle: 'Doha Logistics',
    createdAt: '2025-02-11T08:20:00Z',
  },
];

export const getMockCustomers = (): MockCustomer[] => [...CUSTOMERS];
export const getMockDeals = (): MockDeal[] => [...DEALS];
export const getMockQuotes = (): MockQuote[] => [...QUOTES];
export const getMockContracts = (): MockContract[] => [...CONTRACTS];
export const getMockActivities = (): MockActivity[] => [...ACTIVITIES];

export const REVENUE_BY_MONTH: readonly { month: string; amount: number }[] = [
  { month: '2025-11', amount: 82400 },
  { month: '2025-12', amount: 96200 },
  { month: '2026-01', amount: 88700 },
  { month: '2026-02', amount: 104500 },
  { month: '2026-03', amount: 121300 },
  { month: '2026-04', amount: 134900 },
];

export const DEALS_BY_STAGE_COLORS: Record<DealStage, string> = {
  lead: '#94A3B8',
  qualified: '#22D3EE',
  proposal: '#0EA5E9',
  negotiation: '#0891B2',
  won: '#10B981',
  lost: '#EF4444',
};

export interface MockRep {
  id: string;
  name: string;
  avatarInitials: string;
  dealsClosed: number;
  revenue: number;
  commissionRate: number;
  target: number;
  actual: number;
}

export const MOCK_REPS: readonly MockRep[] = [
  {
    id: 'rep_001',
    name: 'Fatima H.',
    avatarInitials: 'FH',
    dealsClosed: 12,
    revenue: 187500,
    commissionRate: 6,
    target: 250000,
    actual: 187500,
  },
  {
    id: 'rep_002',
    name: 'Omar K.',
    avatarInitials: 'OK',
    dealsClosed: 9,
    revenue: 142200,
    commissionRate: 5,
    target: 200000,
    actual: 142200,
  },
  {
    id: 'rep_003',
    name: 'Selin A.',
    avatarInitials: 'SA',
    dealsClosed: 14,
    revenue: 210800,
    commissionRate: 6,
    target: 240000,
    actual: 210800,
  },
];

export interface MockTerritory {
  id: string;
  name: string;
  reps: string[];
  customerCount: number;
  revenue: number;
  performance: 'excellent' | 'on_track' | 'at_risk';
}

export const MOCK_TERRITORIES: readonly MockTerritory[] = [
  {
    id: 'ter_001',
    name: 'Gulf North',
    reps: ['Fatima H.', 'Omar K.'],
    customerCount: 42,
    revenue: 520000,
    performance: 'excellent',
  },
  {
    id: 'ter_002',
    name: 'Levant',
    reps: ['Selin A.'],
    customerCount: 28,
    revenue: 310000,
    performance: 'on_track',
  },
  {
    id: 'ter_003',
    name: 'North Africa',
    reps: ['Omar K.'],
    customerCount: 17,
    revenue: 120000,
    performance: 'at_risk',
  },
];

export interface MockLoyaltyMember {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
}

export const MOCK_LOYALTY_MEMBERS: readonly MockLoyaltyMember[] = [
  { id: 'lm_001', name: 'Al-Salam Distribution', tier: 'platinum', points: 48200 },
  { id: 'lm_002', name: 'Elma Retail', tier: 'gold', points: 23450 },
  { id: 'lm_003', name: 'Gulf Tech', tier: 'gold', points: 19800 },
  { id: 'lm_004', name: 'Doha Logistics', tier: 'silver', points: 7600 },
  { id: 'lm_005', name: 'Amman Boutique', tier: 'bronze', points: 1200 },
];

export interface MockCampaign {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  audience: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  sent: number;
  openRate: number;
}

export const MOCK_CAMPAIGNS: readonly MockCampaign[] = [
  {
    id: 'cmp_001',
    name: 'Spring renewals',
    channel: 'email',
    audience: 1240,
    status: 'active',
    sent: 820,
    openRate: 42,
  },
  {
    id: 'cmp_002',
    name: 'Ramadan promo',
    channel: 'whatsapp',
    audience: 3200,
    status: 'completed',
    sent: 3200,
    openRate: 68,
  },
  {
    id: 'cmp_003',
    name: 'Win-back Q2',
    channel: 'email',
    audience: 540,
    status: 'scheduled',
    sent: 0,
    openRate: 0,
  },
  {
    id: 'cmp_004',
    name: 'Loyalty invite',
    channel: 'sms',
    audience: 980,
    status: 'draft',
    sent: 0,
    openRate: 0,
  },
];

export interface MockAutomation {
  id: string;
  name: string;
  trigger: string;
  actionsCount: number;
  enabled: boolean;
  totalTriggers: number;
  emailsSent: number;
  conversions: number;
}

export const MOCK_AUTOMATIONS: readonly MockAutomation[] = [
  {
    id: 'aut_001',
    name: 'Welcome series',
    trigger: 'When a customer is created',
    actionsCount: 3,
    enabled: true,
    totalTriggers: 234,
    emailsSent: 702,
    conversions: 38,
  },
  {
    id: 'aut_002',
    name: 'Abandoned quote follow-up',
    trigger: 'When a quote is viewed but not accepted for 3 days',
    actionsCount: 2,
    enabled: true,
    totalTriggers: 58,
    emailsSent: 58,
    conversions: 14,
  },
  {
    id: 'aut_003',
    name: 'Health-score recovery',
    trigger: 'When customer health score drops below 40',
    actionsCount: 4,
    enabled: false,
    totalTriggers: 0,
    emailsSent: 0,
    conversions: 0,
  },
];
