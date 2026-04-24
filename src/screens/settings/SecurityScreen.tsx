/**
 * Security entry-point used by App Sprint 2.
 *
 * Re-exports the merchant SecurityScreen (already wired up to the
 * `useBiometric` hook in Sprint 9) so the new sidebar can navigate to
 * `Security` without duplicating the underlying logic.
 */

export { SecurityScreen } from '../../screens/merchant/settings/SecurityScreen';
export { default } from '../../screens/merchant/settings/SecurityScreen';
