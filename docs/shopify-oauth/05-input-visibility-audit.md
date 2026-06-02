# 05 — Input Visibility Audit (Mobile)

## Scope

Audit every React Native `<TextInput>` for the same class of bug as web: typed text or
placeholder invisible on the dark navy theme due to missing explicit `color` /
`placeholderTextColor`.

## Findings

- **Shared primitives are correct.** `components/common/Input.tsx` sets explicit
  `color: colors.textPrimary` + `placeholderTextColor`; `components/ui/Input.tsx` sets
  `color: darkColors.textPrimary` in its style + `placeholderTextColor`. No change needed.
- **`components/forms/TagsInput.tsx`** — already sets `color: colors.textPrimary` and
  `placeholderTextColor`. No change needed.
- Swept all 37 files containing `<TextInput>`. Five used a raw `TextInput` **without**
  `placeholderTextColor`. Of those, **all set an explicit text `color`** in their style
  (typed text was already visible) — only the placeholder relied on the RN default.

## Fix

Added explicit `placeholderTextColor={darkColors.textMuted}` to the four field inputs that
render placeholders:

- `screens/admin/EditPlanScreen.tsx`
- `screens/admin/IPAllowlistAdminScreen.tsx`
- `screens/admin/NetworkRulesScreen.tsx`
- `screens/merchant/settings/IPAllowlistScreen.tsx`

`screens/merchant/growth/LoyaltyRulesScreen.tsx` — reviewed, **no change**: its inputs are
numeric with **no placeholder** and already set explicit `color: darkColors.textPrimary`, so
there is no visibility issue.

## New Shopify screen

`screens/merchant/settings/ShopifyScreen.tsx` uses the shared `common/Input` (explicit color
+ placeholder), `keyboardType="url"`, inline validation, and respects the ScrollView
convention `paddingBottom: layout.tabBarHeight + 24`.

## Verification

- Dark theme: typed store-domain text + placeholder legible. ✓
- RTL (`ar`): `common/Input` applies `textAlign: I18nManager.isRTL ? 'right' : 'left'`; caret
  + alignment correct; placeholder legible.

## Files touched (mobile)

- `screens/admin/EditPlanScreen.tsx`, `screens/admin/IPAllowlistAdminScreen.tsx`,
  `screens/admin/NetworkRulesScreen.tsx`, `screens/merchant/settings/IPAllowlistScreen.tsx`
  — explicit `placeholderTextColor`.
- `screens/merchant/settings/ShopifyScreen.tsx` — new screen on the shared input primitive.
