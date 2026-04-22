/**
 * Shared auth-related type definitions.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  plan?: 'free' | 'starter' | 'pro' | 'business' | 'enterprise' | null;
  locale?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}
