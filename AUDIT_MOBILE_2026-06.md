# Zyrix CRM Mobile — Gap Audit (June 2026)

**Repo:** `zyrix-crm-mobile` (Expo SDK 54, React Native 0.81.5, React 19.1, new architecture on)
**Reference:** `zyrix-crm` (web CRM, Next.js App Router)
**Date:** 2026-06-05 · **Type:** Read-only audit (no code changed)
**Scope:** 111 screens, 20 navigation modules, 7 zustand stores, 9 API resource modules.

---

## 0. Executive summary

**The mobile app is, today, a fully self-contained mock/demo build with no real authentication boundary.** It looks like a finished product but talks to the backend almost nowhere. Two findings dominate everything else:

1. **Every data domain is hardcoded to mock.** All 9 API resource modules contain a literal `const USE_MOCKS = true;` (verified — see §2). It is **not** env-gated, **not** `__DEV__`-gated, and **not** a fallback-on-failure. The real `apiGet/apiPost` calls exist but are dead branches. Customers, deals, quotes, contracts, invoices, payments, reports, AI, and the entire platform-admin console all render fabricated, production-realistic records (valid-format Saudi tax IDs, SAR revenue figures, transaction IDs, ZATCA/e-Fatura "submissions" with fake QR codes). This is the exact "mock masquerading as real" failure the web app had — but app-wide rather than in one client.

2. **Authentication is faked.** `LoginScreen` never calls the auth API: it sleeps 450 ms, then accepts **any email + any valid-length password** and logs the user in as `merchant_owner` with a synthetic `mock-…` token (verified, `LoginScreen.tsx:198–234`, `fallbackIdentityFor:116–130`). Registration and 2FA are likewise mocked (`RegisterScreen.tsx:150`, `TwoFactorPromptScreen.tsx:63`). There is no real session boundary.

The **only genuinely live backend paths** are Shopify OAuth (`api/shopifyOauth.ts` → `ShopifyScreen`), the password-reset endpoints (`ForgotPasswordScreen`), and the Help/docs client (`services/docsApi.ts`, which is the *one* module with a correct API-with-fallback pattern).

Consequence: the localization, theming, navigation, and security-UI work that has shipped is real and good, but **the app cannot be put in front of a real merchant** — it would show fake money, fake tax filings, and let anyone in. Closing this is the entire point of the M2–M5 plan in §5.

---

## 1. Feature inventory & data-source reality

Classification: **REAL_API** (hits backend) · **MOCK_DEMO** (fabricated records shown as real) · **PARTIAL** · **PLACEHOLDER** (ComingSoon stub) · **STATIC** (forms/toggles, no fabricated records).

### Tally (111 screens)
| Class | Count | Meaning |
|---|---:|---|
| MOCK_DEMO | ~52 | Fabricated records presented as real — the core risk |
| STATIC | ~38 | Forms, toggles, flow UI, scanners (no fabricated record lists) |
| PLACEHOLDER | 13 | ComingSoon/Placeholder stubs reachable from the drawer |
| REAL_API | 6 | Help (×4 via docsApi), ShopifyScreen, ForgotPasswordScreen |
| PARTIAL | 1 | IntegrationsScreen (real Shopify + stubbed Google/Microsoft) |
| BROKEN | 0 | (dead real-branches don't execute, so they don't throw) |

### MOCK/DEMO data risk — ranked (highest first)
1. **No real auth boundary.** Any credentials log in as `merchant_owner`; token is a fake string (`LoginScreen.tsx:198–234`, `:116–130`; `RegisterScreen.tsx:150`). The bearer token sent to the backend is therefore bogus — moot only because nothing calls the backend.
2. **All financial data is fabricated and production-grade.** Payments (`payments.ts:25` + `paymentsMock.ts`), invoices incl. tax totals (`invoices.ts:33`), revenue/cash-flow dashboards (`reports.ts:62`). Merchants would see fictional SAR amounts, `TXN-…` IDs, and outstanding balances.
3. **Tax-compliance submissions are mocked.** `invoices.ts:208–238` returns fake ZATCA/e-Fatura submissions and a mock QR (`buildMockQRCodeBase64`). `TaxInvoicesScreen` shows "submitted to ZATCA" states that never happened — regulatory-confusion risk.
4. **CRM records fabricated** (`mockData.ts`): named companies, valid-format tax IDs, health scores — surfaced by Customers/Deals/Pipeline/HealthScores via `customers.ts:32` / `deals.ts:35`.
5. **Platform-admin data fabricated** (`admin.ts:44` + `adminMock.ts`): fake tenants, users, audit trail, system stats, plans, and even minted SCIM tokens (`admin.ts:419–443`).
6. **Security/device screens show fabricated trust data.** Hardcoded login history (`SecurityLogScreen.tsx:44`), hardcoded "active devices" with no-op revoke (`DeviceManagementScreen.tsx:44`), audit events only `console.info`'d (`securityEvents.ts:39`), mock current IP (`ipDetection.ts:19`). Users may make security decisions on fake data.
7. **AI output is canned text presented as model results** (`ai.ts:36`; agents `baseAgent.ts:31/83`, `aiRevenueBrain.ts:22/89`, `aiMemoryService`, `aiCommandService`). `AICFOScreen` answers financial questions with invented numbers; AI services additionally **catch backend errors and silently return mock** even if `USE_MOCKS` were false (`baseAgent.ts:83`, `aiRevenueBrain.ts:89`).
8. **Inline mock arrays in chrome/growth screens:** `MOCK_CAMPAIGNS/AUTOMATIONS/LOYALTY_MEMBERS/REPS/TERRITORIES`, seeded notifications (`NotificationsScreen.tsx:67`), and the sidebar's hardcoded identity — `SmartSidebar.tsx:201` always shows company **"Levana Cosmetics"** and `:202` forces plan **"business"** regardless of the logged-in user (verified).

### What is genuinely real
- **Shopify** connect/status/disconnect (`shopifyOauth.ts`, `ShopifyScreen.tsx`) — live against `/api/integrations/shopify/*`.
- **Password reset / magic-link / OTP** (`ForgotPasswordScreen.tsx`) — real `apiPost` to `/api/auth/*`.
- **Help/Docs** (`docsApi.ts:88–158`) — real `/api/docs/*` with a correct in-memory fixture fallback (the model the rest of the app should follow).
- **Device features:** camera/QR scan (`ScanScreen`), audio capture (`VoiceNoteScreen`) are real device integrations (no fabricated records).

---

## 2. API parity, auth & error handling

### Network layer (`src/api/client.ts`) — solid skeleton, real gaps
- Base URL: `EXPO_PUBLIC_API_URL` → default `https://api.crm.zyrix.co` (`client.ts:35–39`); `.env`/`.env.example` set the same host.
- Headers: `Authorization: Bearer`, `X-Client-Type`, `X-App-Version`, `X-App-Platform`, `Accept-Language` (`client.ts:55–70`). Timeout 20 s.
- Interceptor: 401 → logout-only; 403 `IP_NOT_ALLOWED` → listener + audit; 5xx → `console.warn` + reject; network error → single retry w/ ~600 ms backoff (`client.ts:149–189`). Errors normalized to `{code,message,details}`.
- **Gaps:** (a) **no token refresh** despite a `/api/auth/refresh` endpoint and a `refreshToken` secure-store key existing — both defined, neither used; 401 just logs out. (b) Retry only on network errors, not 5xx/429; no `Retry-After`. (c) No offline queue / cancellation / connectivity awareness. (d) Interceptor never surfaces errors to the UI (only `console.warn`).

### MOCK WIRING VERDICT (verified)
`const USE_MOCKS = true;` is hardcoded in **all 9 modules**: `customers.ts:32`, `deals.ts:35`, `quotes.ts:21`, `contracts.ts:22`, `invoices.ts:33`, `payments.ts:25`, `reports.ts:62`, `ai.ts:36`, `admin.ts:44`. No `process.env`/`__DEV__`/`EXPO_PUBLIC` reference gates any of them (grep confirmed). Flipping to live requires a **source edit + rebuild per module**, plus replacing the mock-auth blocks in Login/Register. Several services/utils carry the same constant (`aiDecisionEngine.ts:29`, `aiRevenueBrain.ts:22`, `aiCommandService.ts:41`, `aiMemoryService.ts:40`, `baseAgent.ts:31`, `securityEvents.ts:39`, `pdfGenerator.ts:15`, `ipDetection.ts:19`).

### Endpoint inventory (defined in `endpoints.ts`; mostly **defined-but-never-called** today)
| Domain | Paths | Module |
|---|---|---|
| auth | `/api/auth/login,register,refresh,logout,me,forgot-password,reset-password,magic-link,otp-request,otp-verify` | (no `api/auth.ts`; only ForgotPassword calls these) |
| onboarding | `/api/onboarding/progress` | — |
| customers | `/api/customers(/:id,/search)` | `customers.ts` |
| deals | `/api/deals(/:id,/:id/stage,/:id/close)` | `deals.ts` |
| quotes | `/api/quotes(/:id,/send,/convert,/download)` | `quotes.ts` |
| contracts | `/api/contracts(/:id,/renew,/terminate)` | `contracts.ts` |
| invoices | `/api/invoices(/:id,/send,/void,/pay,/pdf,/zatca,/efatura,/summary)` | `invoices.ts` |
| payments | `/api/payments(/:id,/refund,/link,/links,/refunds,/summary)` | `payments.ts` |
| reports | `/api/reports/{dashboard,sales,customers,cash-flow,commissions,quotas,health}` | `reports.ts` |
| ai | `/api/ai/{forecast,score-lead,summarize,conversation-intel,cfo,workflow,revenue/*}` | `ai.ts`, services |
| admin | `/api/admin/{companies,users,feature-flags,audit-log,plans}` | `admin.ts` |
| shopify | `/api/integrations/shopify/{connect,status,disconnect}` | `shopifyOauth.ts` (**live**) |

### Auth / session
- Token in **expo-secure-store** (`zyrix.auth.token`); profile/role in a separate AsyncStorage blob (`userStore`). Split means a corrupt profile can strand a tokened user on `LoadingScreen` with no fallback (`RootNavigator.tsx:43`).
- 15-min inactivity timeout via singleton `sessionManager` (30 s poll + AppState grace) → `ReAuthScreen` overlay. Biometric enrolment gates first login; jailbreak/root check replaces the tree with `SecurityBlockScreen`.
- **No refresh token stored or used.** 2FA verify accepts any code (`TwoFactorPromptScreen.tsx:63`).
- `.env` keys: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_VERSION`, empty `EXPO_PUBLIC_GOOGLE_MAPS_KEY`, empty `EXPO_PUBLIC_SENTRY_DSN`. No mock-toggle key exists.

### Error handling — quality: **weak (≈4/10)**
- **No React error boundary anywhere** — a render throw white-screens the app; Sentry DSN present but empty/unwired.
- Errors surface only via a manual per-screen toast store; the interceptor never bridges to UI. react-query `retry:1` gives silent one-shot retries, no global error/empty/retry states.
- Because mocks are always on (and AI catches→mock), **live-API error paths are essentially untested dead code.**

---

## 3. Missing vs the web CRM

The web app (`zyrix-crm`) is a far broader product. Capabilities it has that mobile **lacks entirely or only stubs**:

**Communication**
- **Unified multi-channel Inbox** (WhatsApp + Messenger + Instagram, templated replies) — mobile has only `ComingSoon` `Conversations`.
- **WhatsApp CRM** (Meta Cloud API, chat→deal, broadcasts) — absent on mobile.
- **Team Chat** (internal DMs/channels/@mentions) — absent.
- **In-app Notifications** that actually work — mobile screen is stubbed/local (`NotificationsScreen.tsx:286–312` TODOs); **push** (`expo-notifications` is installed) is not wired.

**Automation & AI**
- **Workflows/Automations engine** (triggers, execution history) — mobile shows `MOCK_AUTOMATIONS` only.
- **AI Agents** wired to a real Gemini backend with an approve/edit/dismiss queue — mobile agents are canned (`aiAgents.ts:26` TODO).

**Finance / sales docs** — mobile has the screens but on mock data; web additionally has a real **Tax engine**, **Commission engine**, **public quote acceptance with e-sign**, **cash-flow forecast**.

**Growth / lead capture**
- **Meta Lead Ads** and **Google Ads lead forms** ingestion — absent on mobile.
- **Loyalty / Campaigns** — mobile is mock-only.

**Integrations**
- **Google Drive & Sheets** (export/import) and **Microsoft/OneDrive** file storage — mobile `IntegrationsScreen` stubs these.
- **E-commerce platform marketplace**, **payment checkout (iyzico/hyperpay)** — absent/mock on mobile.

**Data & platform**
- **Products / catalog / inventory** (deal line items) — no mobile screen.
- **Customer Portal** (magic-link, invoices, quote acceptance, tickets) — mobile customer tabs are all `PlaceholderScreen`.
- **Analytics builder + scheduled reports**, **cohort/funnel/e-commerce reports**, **Export to CSV/XLSX/PDF/Sheets** — absent on mobile.
- **RBAC custom roles**, **SCIM**, **API keys/webhooks**, **Custom fields**, **Bulk actions**, **advanced filters**, **global search**, **custom branding/white-label** — absent on mobile (admin SCIM/flags screens exist but mock).
- **Smart Follow-up**, **Territories** (real), **Session KPIs** — mobile has mock equivalents at best.

**Mobile-only strengths (web parity the other way):** device QR/business-card scan, voice notes, biometric login, jailbreak detection, on-device inactivity lock. These are genuine mobile advantages to preserve.

---

## 4. Technical health

### Navigation
- One `NavigationContainer` → `RootNavigator` switches by role (`RootNavigator.tsx:30–45`): admin → `AdminNavigator`, merchant → `MerchantRootNavigator`, customer → `CustomerNavigator`, else `AuthNavigator`.
- Merchant branch is deep: Drawer (`SmartSidebar`) → 5 bottom tabs → per-tab native stacks (`MerchantSalesStack` alone = 18 screens), nesting ~4 levels. **Same screens are reachable via both tab stacks and drawer top-level routes** — two parallel route identities (`MerchantRootNavigator.tsx:82–97`), a real maintenance hazard.
- **No lazy loading** — `RootNavigator` eagerly imports all four role trees and every screen, so a merchant login pulls Admin + Customer code into the graph. Untyped `navigation as unknown as {navigate}` casts in `SmartSidebar` defeat the typed param lists.

### State management (7 hand-rolled zustand stores, manual persistence)
| Store | Responsibility | Persistence | Issue |
|---|---|---|---|
| authStore | token, isAuthenticated, 2FA flags, biometric, session timers | secure-store (token only) | `biometricEnabled` & session fields duplicate other sources |
| userStore | profile, role, permissions | AsyncStorage blob | corrupt blob → stranded on LoadingScreen |
| uiStore | language, RTL, onboarded | secure-store | language in secure-store is odd (not a secret) |
| countryConfigStore | country + config | AsyncStorage (code) | — |
| pinnedStore | sidebar pins | AsyncStorage | **not awaited** in startup hydration |
| aiStore | ranked actions, command center, pending agents | in-memory | — |
| toastStore | toast queue | in-memory | — |
- `biometricEnabled` lives in **two** stores (auth + user) → divergent truth. Mixed secure-store/AsyncStorage backends for similar data. react-query: single client, `retry:1`, `staleTime 30s` — reasonable.

### Startup & performance
- **Synchronous jailbreak check on first render** (`App.tsx:93` `isCompromised()` → 3 native `jail-monkey` calls) blocks time-to-interactive; should be async/deferred.
- `setTimeout(()=>setReady(true),0)` gate renders an empty `<View>` first (`App.tsx:96,124–126`) — an extra empty frame for no benefit.
- Inactivity timer + AppState listener start even when unauthenticated (`App.tsx:106–112`).
- App blocks on 4 store hydrations before any UI (`RootNavigator.tsx:67`).
- `app.json`: `newArchEnabled:true`; **`userInterfaceStyle:"dark"` but the app uses `MD3LightTheme`** (mismatch). Hermes default-on (SDK 54).

### Dependency risks
| Dep | Version | Risk |
|---|---|---|
| `expo-av` | ~16 | **Deprecated in SDK 54** (→ expo-audio/expo-video); still used in `VoiceNoteScreen`. Migrate. |
| `react-native-maps` | 1.20.1 | **Unused** (comment-only) — native build weight + key surface for nothing. Remove. |
| `victory-native` | ^41 | **Unused** — charts use `react-native-svg` directly. Remove (pulls Skia/reanimated). |
| `react-native-reanimated` | ~4.1 | v4 requires new arch (ok) + Worklets plugin; hard break from v3. |
| `jail-monkey` | ^2.8 | Native; runs synchronously at startup (see above). |
| `react` | 19.1 | Young on RN 0.81; some lib peer/types may lag. |
| `zod` | ^4 | v4 breaking changes; ensure `@hookform/resolvers ^5` matches (it does). |

Healthy: `@react-navigation` v7 consistent, react-query v5, no version skew.

### Debt markers
- 6 real `TODO`s (5 in `NotificationsScreen` for unimplemented API calls; 1 `aiAgents.ts:26` "dispatch to real Gemini agent"). No FIXME/HACK.
- **46 placeholder/"coming soon" occurrences across 17 files** — the entire `crm/`, `engage/`, `grow/` drawer destinations and the whole Customer portal are stubs. The drawer advertises ~13 routes that aren't real screens.
- Pervasive "Sprint N" header comments — journal noise, signals a mid-buildout codebase.

---

## 5. Prioritized proposal — Sprints M2–M5

Ordering principle: **nothing about breadth matters until the app stops showing fake data and gains a real auth boundary.** Fix the existential issues first, make the core trustworthy, then add parity, then long-tail + polish.

### Sprint M2 — "Make it real": backend integration + real auth *(highest priority, ship before any external exposure)*
**Why:** The app currently authenticates no one and shows fabricated money and tax filings. This is a correctness/trust/legal blocker, not a feature gap.
- Replace the 9 hardcoded `USE_MOCKS = true` literals with a single env-gated switch (`EXPO_PUBLIC_USE_MOCKS`, default **false** in production; mocks become an explicit dev/demo opt-in). Build a CI check that fails if a literal `USE_MOCKS = true` is committed.
- Implement **real auth**: wire `LoginScreen`/`RegisterScreen` to `/api/auth/login|register`, delete the `MOCK_USERS`/`fallbackIdentityFor`/`mockTokenFor` path, store the **refresh token**, and add **refresh-and-retry** on 401 in the interceptor (endpoint + secure key already exist). Wire real 2FA verify.
- Replace inline fabricated chrome with real or empty states: `SmartSidebar` company/plan (`:201–202`), `SecurityLogScreen`/`DeviceManagementScreen` arrays, `NotificationsScreen` seed, `ipDetection` mock IP, `securityEvents` swallow.
- Verify each domain end-to-end against the real backend (customers, deals, invoices, payments first — the money paths). Confirm tax/ZATCA submissions are real or clearly disabled (no fake "submitted" states).
**Exit:** a real user logs in against the backend; no fabricated record can reach a production build; money/tax screens show real or honestly-empty data.

### Sprint M3 — Core CRM hardening on real data
**Why:** Once live, the core flows must handle reality (loading/empty/error), not just happy-path mock.
- Add a **global error boundary** + wire **Sentry** (DSN slot already present). Bridge interceptor errors → toast/centralized handler. Add loading/empty/error/retry states to every list+detail (Customers, Deals, Pipeline, Quotes, Contracts, Invoices, Payments).
- Fix the auth/user hydration fragility (corrupt-profile fallback; consolidate duplicated `biometricEnabled`). Make jailbreak check async; drop the 0 ms ready gate; start the inactivity timer only when authenticated.
- Dependency hygiene: **remove `victory-native` and `react-native-maps`** (unused), plan **`expo-av` → expo-audio** migration, fix the dark/light theme mismatch.
**Exit:** core CRM is robust on real data with graceful failures; bundle/native surface trimmed; crash telemetry live.

### Sprint M4 — Communication, notifications & growth parity
**Why:** The biggest day-to-day product gaps vs web that mobile users will expect on a phone.
- **Push + in-app notifications** (finish `NotificationsScreen` TODOs; wire `expo-notifications` registration + deep-links) — the most mobile-native missing capability.
- **Unified Inbox** (WhatsApp/Messenger/Instagram) and **WhatsApp CRM** read/reply — phones are where merchants actually answer messages.
- **Automations/Workflows** real (list/toggle/execution history) and **AI agents** wired to the real Gemini backend (remove canned `aiAgents.ts`/`baseAgent` mock fallbacks).
- **Campaigns & Loyalty** on real data.
**Exit:** mobile is a viable daily driver for messaging + notifications + automation, not just records.

### Sprint M5 — Integrations, breadth & long-tail parity
**Why:** Round out parity and remove the misleading placeholder surface.
- Integrations: **Google Drive/Sheets**, **Meta/Google Ads lead capture**, deepen Shopify; **payment checkout** (iyzico/hyperpay).
- New domains: **Products/catalog**, **Customer Portal** screens (replace the stub tabs), **Analytics/reports + export**, **bulk actions**, **advanced filters**, **global search**, **custom fields**, **RBAC roles**.
- Navigation/perf: introduce **lazy navigators** (split admin/customer/merchant trees), collapse the dual tab-vs-drawer routing, add typed navigation in `SmartSidebar`.
- **Decide and act on the ~13 ComingSoon drawer routes**: build or remove them — don't ship a menu of dead ends.
**Exit:** feature parity with web on the capabilities that make sense on mobile; no placeholder routes advertised as real.

---

### Cross-cutting recommendations
- Adopt `docsApi.ts`'s **API-with-honest-fallback** pattern as the house style; ban silent mock fallbacks (AI services currently hide backend failures).
- Add a **demo mode** that is explicit and labelled in-app (banner) rather than indistinguishable mock — so sales demos stay possible without risking a real merchant seeing fake data.
- Treat M2 as a release gate: **do not distribute a build (TestFlight/Play internal) to any non-team user until M2 exits.**

*End of audit.*
