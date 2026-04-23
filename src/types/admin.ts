/**
 * Admin domain types — shared by api/admin.ts, hooks/useAdmin.ts, and
 * the admin screen catalogue. Mobile is the consumer side; the
 * platform's source of truth lives on the backend.
 */

import type { CountryCode } from './country';
import type { UserRole } from './auth';

export type CompanyStatus = 'active' | 'suspended' | 'pending' | 'deleted';
export type PlanTier = 'free' | 'starter' | 'business' | 'enterprise';

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  country: CountryCode;
  plan: PlanTier;
  planId: string;
  status: CompanyStatus;
  usersCount: number;
  customersCount: number;
  mrr: number;
  createdAt: string;
  suspendedAt?: string;
  suspensionReason?: string;
  deletedAt?: string;
  lastActivityAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  status: 'active' | 'deactivated';
  lastLoginAt?: string;
  createdAt: string;
  avatarInitials: string;
}

export interface PlanLimits {
  users: number;
  customers: number;
  storageGB: number;
  apiCallsPerMonth: number;
}

export interface Plan {
  id: string;
  name: string;
  slug: PlanTier;
  priceMonthly: number;
  priceAnnually: number;
  description: string;
  features: string[];
  limits: PlanLimits;
  active: boolean;
  order: number;
  companiesCount: number;
}

export type FeatureCategory =
  | 'sales'
  | 'growth'
  | 'ai'
  | 'operations'
  | 'security'
  | 'taxCompliance'
  | 'integrations'
  | 'platform'
  | 'advanced'
  | 'experience';

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  category: FeatureCategory;
  enabled: boolean;
  defaultEnabledFor: PlanTier | 'all';
  companyOverride?: boolean;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  companyId: string | null;
  companyName: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean>;
  severity: AuditSeverity;
}

export interface SystemStats {
  apiResponseTime: { avg: number; p95: number; p99: number };
  activeSessions: number;
  dbConnections: { active: number; max: number };
  storageUsedGB: number;
  storageQuotaGB: number;
  errorRate: number;
  uptimePercent: number;
  trafficByHour: { hour: string; requests: number }[];
  responseTrend: { time: string; ms: number }[];
  errorTrend: { time: string; rate: number }[];
  incidents: { id: string; title: string; severity: AuditSeverity; date: string }[];
}

export type RetentionEntityType =
  | 'customer'
  | 'audit_log'
  | 'message'
  | 'invoice'
  | 'payment';

export interface RetentionPolicy {
  id: string;
  entityType: RetentionEntityType;
  retentionDays: number;
  legalHoldActive: boolean;
  createdAt: string;
}

export type IPRuleMode = 'all' | 'employees_only' | 'specific_roles';

export interface IPRule {
  id: string;
  companyId: string | null;
  companyName?: string;
  cidr: string;
  description: string;
  mode: IPRuleMode;
  exceptions: UserRole[];
  mobileBypass: boolean;
  createdAt: string;
}

export type SCIMScope = 'read_only' | 'read_write' | 'admin';

export interface SCIMToken {
  id: string;
  companyId: string;
  companyName: string;
  tokenPreview: string;
  scope: SCIMScope;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
}

export type ComplianceExportType = 'gdpr' | 'ccpa' | 'pdpl';
export type ComplianceExportStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'downloaded'
  | 'expired';

export interface ComplianceExport {
  id: string;
  customerId: string;
  customerName: string;
  companyId: string;
  companyName: string;
  type: ComplianceExportType;
  status: ComplianceExportStatus;
  requestedAt: string;
  readyAt?: string;
  downloadUrl?: string;
  expiresAt: string;
  urgency: 'standard' | 'rush';
}

export interface ImpersonationToken {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface AdminSummary {
  totalCompanies: number;
  totalCompaniesDelta: number;
  activeUsers: number;
  monthlyRecurringRevenue: number;
  newSignupsToday: number;
  signupsTrend: { date: string; count: number }[];
  revenueTrend: { month: string; amount: number }[];
  planDistribution: { plan: PlanTier; count: number; share: number }[];
  topCompanies: { id: string; name: string; mrr: number }[];
  alerts: {
    overduePayments: number;
    pendingTickets: number;
    pendingCompliance: number;
  };
  recentActivities: AuditLogEntry[];
}

export interface SCIMTokenInput {
  companyId: string;
  scope: SCIMScope;
  expiresInDays: 30 | 90 | 365 | -1;
}

export interface IPRuleInput {
  companyId: string | null;
  cidr: string;
  description: string;
  mode: IPRuleMode;
  exceptions: UserRole[];
  mobileBypass: boolean;
}

export interface RetentionPolicyInput {
  entityType: RetentionEntityType;
  retentionDays: number;
  legalHoldActive: boolean;
}

export interface ComplianceExportInput {
  customerId: string;
  type: ComplianceExportType;
  urgency: 'standard' | 'rush';
}

export interface SystemNotificationInput {
  audience: 'all' | 'plan' | 'country' | 'company';
  audienceValue?: string;
  channels: ('inApp' | 'email' | 'sms')[];
  title: string;
  body: string;
  scheduleAt?: string;
}
