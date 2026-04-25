/**
 * socialAuth — Google + Apple Sign-In entry points (spec §14.2).
 *
 * The real implementation needs two native packages:
 *   npx expo install expo-auth-session expo-apple-authentication
 *
 * Until those are wired into the development build we keep this file
 * dependency-free so the app still compiles on Expo Go. Each function
 * returns a discriminated result that UI code can branch on without
 * throwing — so enabling the buttons early doesn't crash the app.
 *
 * When the native modules arrive, swap the `unavailable` branches for
 * real OAuth flows — the return shape must stay the same so LoginScreen
 * / RegisterScreen don't need to change.
 */

import { Platform } from 'react-native';

export interface SocialUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export type SocialAuthResult =
  | { ok: true; token: string; user: SocialUser; provider: 'google' | 'apple' }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'failed'; message?: string };

/**
 * Google sign-in via expo-auth-session. Returns `unavailable` until the
 * native module is installed and the OAuth client IDs are configured in
 * `app.json > extra.googleClientIds`.
 */
export const googleSignIn = async (): Promise<SocialAuthResult> => {
  return {
    ok: false,
    reason: 'unavailable',
    message:
      'Google Sign-In is not yet configured. Install expo-auth-session and add OAuth client IDs.',
  };
};

/**
 * Apple sign-in via expo-apple-authentication. Always `unavailable` on
 * Android. On iOS, returns `unavailable` until the native module is
 * installed and the capability is enabled in Xcode.
 */
export const appleSignIn = async (): Promise<SocialAuthResult> => {
  if (Platform.OS !== 'ios') {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Apple Sign-In is iOS only.',
    };
  }
  return {
    ok: false,
    reason: 'unavailable',
    message:
      'Apple Sign-In is not yet configured. Install expo-apple-authentication and enable Sign in with Apple in Xcode.',
  };
};

export const isAppleSignInSupported = (): boolean => Platform.OS === 'ios';
