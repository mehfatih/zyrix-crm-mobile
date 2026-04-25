/**
 * featureFlags — single source of truth for "is this module visible?"
 *
 * Spec §14.11: instead of rendering a "Coming Soon" placeholder, we hide
 * any module whose flag is `false`. Features flagged as beta keep a tiny
 * "Beta" badge on their entry points, but remain fully navigable.
 *
 * Keep these flags client-side for now. When the backend exposes a
 * tenant-aware flag API, replace the object literal with a hook that
 * merges server flags on top of these defaults.
 */

export const featureFlags = {
  aiCommandCenter: true,
  aiAgents: true,
  aiRevenueBrain: true,
  googleDriveSync: true,
  microsoftSync: true,
  voiceFirstAr: false,
  whatsappAutomation: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * Beta-labelled flags stay visible but get a "Beta" badge next to their
 * entry point. Anything not in this set but flagged `true` ships without
 * a badge. Anything flagged `false` is hidden entirely — NO "Coming Soon"
 * placeholder.
 */
const BETA_FLAGS: ReadonlySet<FeatureFlagKey> = new Set([
  'voiceFirstAr',
  'whatsappAutomation',
]);

export const isFeatureEnabled = (key: FeatureFlagKey): boolean =>
  featureFlags[key] === true;

export const isFeatureBeta = (key: FeatureFlagKey): boolean =>
  BETA_FLAGS.has(key);
