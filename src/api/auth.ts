/**
 * Real authentication module — talks to the live backend `/api/auth/*`
 * endpoints (signin / signup / 2fa-challenge / me / logout).
 *
 * The backend wraps every response in an `ApiEnvelope<T>` (`{ success, data }`)
 * and uses its own user/company shape (company-scoped roles `owner|admin|
 * manager|member`, `fullName`, `company.plan`). `mapBackendSession` adapts
 * that into the mobile app's `User`/`AuthUser` types + permission matrix.
 *
 * Token refresh lives in `client.ts` (response interceptor) to avoid a
 * circular import; this module only performs the explicit auth calls.
 */

import { apiGet, apiPost } from './client';
import { ENDPOINTS } from './endpoints';
import {
  getPermissionsForRole,
  type AuthUser,
  type SupportedPlan,
  type User,
  type UserRole,
} from '../types/auth';

// ── Backend wire shapes ────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  role: string; // owner | admin | manager | member
  companyId: string;
  emailVerified?: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  preferredLocale?: 'en' | 'ar' | 'tr' | null;
  twoFactorEnabled?: boolean;
}

export interface BackendCompany {
  id: string;
  name: string;
  slug: string;
  plan: string; // free | starter | business | enterprise
  country?: string | null;
  baseCurrency?: string | null;
  idleTimeoutMinutes?: number | null;
  enabledFeatures?: Record<string, boolean>;
}

export interface BackendTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
  user: BackendUser;
  company: BackendCompany;
  tokens: BackendTokens;
}

type SigninData =
  | (AuthResponse & { requires2FA?: false })
  | { requires2FA: true; challengeToken: string };

export interface SignupPayload {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

// ── Mapping: backend → mobile domain types ──────────────────────────────────

const ROLE_MAP: Record<string, UserRole> = {
  owner: 'merchant_owner',
  admin: 'merchant_admin',
  manager: 'merchant_manager',
  member: 'merchant_employee',
};

const PLANS: readonly SupportedPlan[] = [
  'free',
  'starter',
  'pro',
  'business',
  'enterprise',
];

const mapRole = (role: string): UserRole =>
  ROLE_MAP[role] ?? 'merchant_employee';

const mapPlan = (plan: string): SupportedPlan =>
  (PLANS as readonly string[]).includes(plan)
    ? (plan as SupportedPlan)
    : 'free';

/** A fully-mapped, ready-to-store session. */
export interface AuthSession {
  authUser: AuthUser;
  user: User;
  company: BackendCompany;
  tokens: BackendTokens;
}

export const mapBackendUser = (
  bu: BackendUser,
  bc: BackendCompany
): { authUser: AuthUser; user: User } => {
  const role = mapRole(bu.role);
  const plan = mapPlan(bc.plan);
  const authUser: AuthUser = {
    id: bu.id,
    email: bu.email,
    name: bu.fullName,
    avatarUrl: bu.avatarUrl ?? null,
    role,
    plan,
    locale: bu.preferredLocale ?? null,
  };
  const user: User = {
    id: bu.id,
    email: bu.email,
    name: bu.fullName,
    role,
    companyId: bu.companyId ?? bc.id ?? null,
    avatar: bu.avatarUrl ?? null,
    phone: bu.phone ?? null,
    country: bc.country ?? null,
    language: bu.preferredLocale ?? null,
    permissions: getPermissionsForRole(role),
  };
  return { authUser, user };
};

const toSession = (r: AuthResponse): AuthSession => {
  const { authUser, user } = mapBackendUser(r.user, r.company);
  return { authUser, user, company: r.company, tokens: r.tokens };
};

// ── Auth calls ───────────────────────────────────────────────────────────

export type SigninOutcome =
  | { kind: 'authenticated'; session: AuthSession }
  | { kind: 'twoFactorRequired'; challengeToken: string };

export const signinApi = async (
  email: string,
  password: string
): Promise<SigninOutcome> => {
  const env = await apiPost<ApiEnvelope<SigninData>>(ENDPOINTS.auth.SIGNIN, {
    email,
    password,
  });
  const data = env.data;
  if ('requires2FA' in data && data.requires2FA) {
    return { kind: 'twoFactorRequired', challengeToken: data.challengeToken };
  }
  return { kind: 'authenticated', session: toSession(data as AuthResponse) };
};

export const signupApi = async (
  payload: SignupPayload
): Promise<AuthSession> => {
  const env = await apiPost<ApiEnvelope<AuthResponse>>(
    ENDPOINTS.auth.SIGNUP,
    payload
  );
  return toSession(env.data);
};

export const twoFactorChallengeApi = async (
  challengeToken: string,
  code: string
): Promise<AuthSession> => {
  const env = await apiPost<ApiEnvelope<AuthResponse>>(
    ENDPOINTS.auth.TWO_FACTOR_CHALLENGE,
    { challengeToken, code }
  );
  return toSession(env.data);
};

export const meApi = async (): Promise<{
  authUser: AuthUser;
  user: User;
  company: BackendCompany;
}> => {
  const env = await apiGet<ApiEnvelope<{ user: BackendUser; company: BackendCompany }>>(
    ENDPOINTS.auth.PROFILE
  );
  const { authUser, user } = mapBackendUser(env.data.user, env.data.company);
  return { authUser, user, company: env.data.company };
};

export const logoutApi = async (refreshToken: string | null): Promise<void> => {
  if (!refreshToken) return;
  try {
    await apiPost(ENDPOINTS.auth.LOGOUT, { refreshToken });
  } catch {
    // Best-effort server-side revocation; local logout proceeds regardless.
  }
};
