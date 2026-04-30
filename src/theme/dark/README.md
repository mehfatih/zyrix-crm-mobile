# Zyrix Mobile — Dark Theme Module (M1 output)

This folder holds the future Deep Navy theme. It is **not yet active**:
existing screens still import from `src/constants/colors.ts` and
`src/theme/zyrixTheme.ts`. Both legacy files stay byte-identical until the
final swap sprint.

## What's here

| File | Purpose |
|---|---|
| `colors.dark.ts` | Drop-in replacement for `constants/colors.ts` — every key mirrored with dark navy values. 161 files will benefit when this is swapped in. |
| `zyrixTheme.dark.ts` | Drop-in replacement for `theme/zyrixTheme.ts` — every key mirrored. 19 files will benefit. |
| `accents.ts` | Per-page accent map (23 pages × 13 accent colors) matching web Sprint 14n. |
| `statusColors.ts` | Universal won/at-risk/lost/AI semantics + AI confidence tier helper. |
| `spacing.ts` | `xs..xxl` scale (unchanged from legacy `zyrixSpacing`). |
| `radius.ts` | `sm..pill` scale (unchanged from legacy `zyrixRadius`). |
| `shadows.ts` | Dark-theme shadow recipes (iOS: shadow props, Android: elevation). |
| `typography.ts` | Tailwind-aligned font scale, system fonts. |
| `index.ts` | Central export — `import { ... } from '@/theme/dark'`. |

## Migration strategy (the audit-driven plan)

The mobile audit (Section 12) revealed that 99% of color usage routes through
two palette modules. Hardcoded `#FFFFFF` literals exist in only 2 lines outside
those modules (in `AIPriorityCard.tsx`).

This means the migration is fundamentally a **token-value swap**:

1. **M1 (this sprint):** build `theme/dark/` with every legacy token mirrored. No screen migrations. No legacy file edits.

2. **M2:** build base primitive components (Card, Button, Pill, IconTile, etc.) under `src/components/ui/` that import from `@/theme/dark`. New work uses these. Old work untouched.

3. **M3+:** migrate screens in waves. Each per-screen sprint changes import sources from `@/constants/colors` → `@/theme/dark` and adopts new primitives. Visual review on phone before merge.

4. **M-final:** when all 166 light-surface files have been migrated, replace the contents of `src/constants/colors.ts` and `src/theme/zyrixTheme.ts` with re-exports from `@/theme/dark`. The two legacy import paths still work — they just resolve to dark values.

## Legacy compatibility

This module **does not delete or modify** anything. The 161 files using `colors`
keep working. The 19 files using `zyrixTheme` keep working. The 21
mobile-exclusive features (biometric, AI agents, ZATCA helpers, etc. —
audit §10.1) are entirely untouched.

## Quick reference

```tsx
import { darkColors, accents, statusColors, getPageAccent } from '@/theme/dark';

const styles = StyleSheet.create({
  container: { backgroundColor: darkColors.background },
  card:      { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  primary:   { color: darkColors.primary },
});

// Per-page accent
const accent = getPageAccent('deals');  // emerald
<View style={{ backgroundColor: accent.bgTint, borderColor: accent.border }} />

// Status pill
<View style={{ backgroundColor: statusColors.won.bgTint }}>
  <Text style={{ color: statusColors.won.text }}>Won</Text>
</View>
```

> **Note on `@/` alias:** The current `tsconfig.json` does not yet define an `@/*` path alias. Until that's added (a one-line change planned for a future sprint), consumer code should use a relative import — e.g. `import { darkColors } from '../../theme/dark'`. The examples above use `@/theme/dark` because that is the intended end-state.

## Adding tokens

If a future sprint needs a new token, add it to `colors.dark.ts` AND to the
legacy `constants/colors.ts` (so the contract stays drop-in compatible).

## Critical rules

- Never modify `constants/colors.ts` or `theme/zyrixTheme.ts` until the M-final swap sprint.
- Never delete tokens. The audit catalogued every key — they all must remain.
- The 21 mobile-exclusive features (audit §10.1) must survive every sprint.
