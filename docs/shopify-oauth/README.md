# Shopify OAuth + Input Audit — Mobile

This repo's slice of the sprint. Full architecture docs live in
`zyrix-crm-backend/docs/shopify-oauth/`.

## What shipped here

- **Connect Shopify screen** — `src/screens/merchant/settings/ShopifyScreen.tsx`:
  domain-only field → `POST /api/integrations/shopify/connect?platform=mobile` →
  `WebBrowser.openAuthSessionAsync(authorizeUrl, 'zyrix://shopify/connected')`. Parses the
  deep-link return (`?status=connected|error&code=…`), then refreshes `/status`. **No token
  field.**
- **Status + reconnect** — connection rows (status dot, last sync), `needs_reauth` reconnect,
  disconnect, and legacy `legacy_manual` stores with "Reconnect via Shopify".
- **Navigation** — registered `Shopify` in `MerchantSettingsStackParamList` +
  `MerchantSettingsStack` with a settings-home entry.
- **Input audit** — see `05-input-visibility-audit.md` (explicit `placeholderTextColor` added
  to four field inputs; shared primitives already correct).
- **API client** — `src/api/shopifyOauth.ts`.
- **i18n** — `shopifyIntegration.*` + `integrationErrors.*` in
  `src/i18n/locales/{en,ar,tr}.json`.

## Decisions (per sprint Q&A)

- Deep-link scheme stays **`zyrix`** (`app.json` unchanged) — return URL
  `zyrix://shopify/connected`.
- Targets the installed **Expo SDK 54** as-is.

## Verify

`npx tsc --noEmit` is clean.
