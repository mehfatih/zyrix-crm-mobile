/**
 * Runtime configuration flags resolved from the build environment.
 *
 * `USE_MOCKS` gates whether the app serves built-in demo/mock data instead
 * of talking to the real backend. It is **OFF by default** — a release build
 * with the env var unset never reaches any mock code path. Set
 * `EXPO_PUBLIC_USE_MOCKS=true` in a local `.env` for offline demos only.
 *
 * This replaces the per-module `const USE_MOCKS = true` literals that
 * previously shipped mock data into production (see AUDIT_MOBILE_2026-06.md).
 * Keep this the single source of truth; a CI grep guards against
 * re-introducing a hardcoded `USE_MOCKS = true`.
 */
export const USE_MOCKS: boolean = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
