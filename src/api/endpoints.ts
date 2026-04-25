/**
 * Central catalogue of every backend route the mobile app talks to.
 *
 * Resource helpers (e.g. `ENDPOINTS.customers.GET(id)`) return the
 * path with the id interpolated so callers don't build URLs by hand.
 */

export const ENDPOINTS = {
  auth: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    // Spec §14.3 — 3 recovery methods.
    PASSWORD_RESET: '/api/auth/password-reset',
    MAGIC_LINK: '/api/auth/magic-link',
    OTP_REQUEST: '/api/auth/otp-request',
    OTP_VERIFY: '/api/auth/otp-verify',
  },
  onboarding: {
    PROGRESS: '/api/onboarding/progress',
  },
  customers: {
    LIST: '/api/customers',
    GET: (id: string) => `/api/customers/${id}`,
    CREATE: '/api/customers',
    UPDATE: (id: string) => `/api/customers/${id}`,
    DELETE: (id: string) => `/api/customers/${id}`,
    SEARCH: '/api/customers/search',
  },
  deals: {
    LIST: '/api/deals',
    GET: (id: string) => `/api/deals/${id}`,
    CREATE: '/api/deals',
    UPDATE: (id: string) => `/api/deals/${id}`,
    DELETE: (id: string) => `/api/deals/${id}`,
    MOVE_STAGE: (id: string) => `/api/deals/${id}/stage`,
    CLOSE: (id: string) => `/api/deals/${id}/close`,
  },
  quotes: {
    LIST: '/api/quotes',
    GET: (id: string) => `/api/quotes/${id}`,
    CREATE: '/api/quotes',
    UPDATE: (id: string) => `/api/quotes/${id}`,
    SEND: (id: string) => `/api/quotes/${id}/send`,
    CONVERT: (id: string) => `/api/quotes/${id}/convert`,
    DOWNLOAD: (id: string) => `/api/quotes/${id}/download`,
  },
  contracts: {
    LIST: '/api/contracts',
    GET: (id: string) => `/api/contracts/${id}`,
    CREATE: '/api/contracts',
    RENEW: (id: string) => `/api/contracts/${id}/renew`,
    TERMINATE: (id: string) => `/api/contracts/${id}/terminate`,
  },
  invoices: {
    LIST: '/api/invoices',
    GET: (id: string) => `/api/invoices/${id}`,
    CREATE: '/api/invoices',
    SEND: (id: string) => `/api/invoices/${id}/send`,
    VOID: (id: string) => `/api/invoices/${id}/void`,
  },
  payments: {
    LIST: '/api/payments',
    GET: (id: string) => `/api/payments/${id}`,
    RECORD: '/api/payments',
    REFUND: (id: string) => `/api/payments/${id}/refund`,
  },
  reports: {
    DASHBOARD: '/api/reports/dashboard',
    SALES: '/api/reports/sales',
    CUSTOMERS: '/api/reports/customers',
    CASH_FLOW: '/api/reports/cash-flow',
    COMMISSIONS: '/api/reports/commissions',
    QUOTAS: '/api/reports/quotas',
    HEALTH: '/api/reports/health',
  },
  ai: {
    FORECAST: '/api/ai/forecast',
    SCORE_LEAD: '/api/ai/score-lead',
    SUMMARIZE: '/api/ai/summarize',
    CONVERSATION_INTEL: '/api/ai/conversation-intel',
  },
  admin: {
    COMPANIES: '/api/admin/companies',
    USERS: '/api/admin/users',
    FEATURE_FLAGS: '/api/admin/feature-flags',
    AUDIT_LOG: '/api/admin/audit-log',
    PLANS: '/api/admin/plans',
  },
} as const;

export type Endpoints = typeof ENDPOINTS;
