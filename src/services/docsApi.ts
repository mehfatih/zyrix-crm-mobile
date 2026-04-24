/**
 * docsApi — client for the Knowledge Hub endpoints at /api/docs/:lang/*.
 *
 * Mirrors the docs sprint contract:
 *   GET /api/docs/:lang/index                        -> category tree + article list
 *   GET /api/docs/:lang/:category                    -> articles in category
 *   GET /api/docs/:lang/:category/:slug              -> single article (markdown + meta)
 *   GET /api/docs/:lang/search?q=...                 -> search hits with snippets
 *   POST /api/docs/feedback { articleSlug, helpful } -> telemetry
 *
 * When the real API is unreachable (network error, 404 during local dev,
 * backend not yet shipped) the helpers fall back to an in-memory fixture
 * so the Help Center screens still render meaningful content. That keeps
 * the mobile build unblocked while the web team finalises the route.
 */

import { apiGet, apiPost } from '../api/client';
import type { SupportedLanguage } from '../i18n';

export type DocsCategoryId =
  | 'sales'
  | 'growth'
  | 'ai'
  | 'operations'
  | 'security'
  | 'tax'
  | 'integrations'
  | 'platform'
  | 'advanced'
  | 'experience';

export type DocsAccent =
  | 'mint'
  | 'coral'
  | 'lavender'
  | 'sky'
  | 'teal'
  | 'peach'
  | 'sunshine'
  | 'rose';

export interface DocsArticleMeta {
  slug: string;
  title: string;
  category: DocsCategoryId;
  order: number;
  plans: readonly string[];
  readTime: string;
  updatedAt: string;
  snippet?: string;
  views?: number;
}

export interface DocsArticle extends DocsArticleMeta {
  markdown: string;
  prevSlug?: string | null;
  nextSlug?: string | null;
}

export interface DocsCategory {
  id: DocsCategoryId;
  title: string;
  description: string;
  accent: DocsAccent;
  icon: string;
  articleCount: number;
}

export interface DocsIndex {
  lang: SupportedLanguage;
  categories: readonly DocsCategory[];
  popular: readonly DocsArticleMeta[];
}

export interface DocsSearchHit {
  slug: string;
  category: DocsCategoryId;
  title: string;
  snippet: string;
}

const baseUrl = (lang: SupportedLanguage): string => `/api/docs/${lang}`;

export const docsApi = {
  async getIndex(lang: SupportedLanguage): Promise<DocsIndex> {
    try {
      return await apiGet<DocsIndex>(`${baseUrl(lang)}/index`);
    } catch {
      return fallbackIndex(lang);
    }
  },

  async getCategory(
    lang: SupportedLanguage,
    category: DocsCategoryId
  ): Promise<readonly DocsArticleMeta[]> {
    try {
      return await apiGet<readonly DocsArticleMeta[]>(
        `${baseUrl(lang)}/${category}`
      );
    } catch {
      return fallbackArticles(lang).filter((a) => a.category === category);
    }
  },

  async getArticle(
    lang: SupportedLanguage,
    category: DocsCategoryId,
    slug: string
  ): Promise<DocsArticle> {
    try {
      return await apiGet<DocsArticle>(`${baseUrl(lang)}/${category}/${slug}`);
    } catch {
      return fallbackArticle(lang, category, slug);
    }
  },

  async search(
    lang: SupportedLanguage,
    query: string
  ): Promise<readonly DocsSearchHit[]> {
    const q = query.trim();
    if (!q) return [];
    try {
      return await apiGet<readonly DocsSearchHit[]>(
        `${baseUrl(lang)}/search?q=${encodeURIComponent(q)}`
      );
    } catch {
      const needle = q.toLowerCase();
      return fallbackArticles(lang)
        .filter(
          (a) =>
            a.title.toLowerCase().includes(needle) ||
            (a.snippet ?? '').toLowerCase().includes(needle)
        )
        .map((a) => ({
          slug: a.slug,
          category: a.category,
          title: a.title,
          snippet: a.snippet ?? '',
        }));
    }
  },

  async submitFeedback(
    articleSlug: string,
    helpful: boolean,
    comment?: string
  ): Promise<void> {
    try {
      await apiPost('/api/docs/feedback', { articleSlug, helpful, comment });
    } catch {
      // Swallow telemetry errors — shouldn't block the user.
    }
  },
};

/* --------------------------- fallback fixtures -------------------------- */

const CATEGORY_META: readonly Omit<DocsCategory, 'articleCount'>[] = [
  { id: 'sales', title: 'Sales', description: 'Quotes, contracts, commission, forecasting.', accent: 'mint', icon: 'briefcase-outline' },
  { id: 'growth', title: 'Growth', description: 'Loyalty and marketing automation.', accent: 'coral', icon: 'trending-up-outline' },
  { id: 'ai', title: 'AI', description: 'AI CFO, lead scoring, meeting intelligence.', accent: 'lavender', icon: 'sparkles-outline' },
  { id: 'operations', title: 'Operations', description: 'Portal, payments, collaboration.', accent: 'sky', icon: 'cog-outline' },
  { id: 'security', title: 'Security', description: 'RBAC, audit log, retention, SCIM.', accent: 'teal', icon: 'shield-checkmark-outline' },
  { id: 'tax', title: 'Tax', description: 'Native tax invoices and compliance.', accent: 'peach', icon: 'receipt-outline' },
  { id: 'integrations', title: 'Integrations', description: 'Google Docs, Slack, Teams.', accent: 'sunshine', icon: 'link-outline' },
  { id: 'platform', title: 'Platform', description: 'Network controls and infra.', accent: 'sky', icon: 'server-outline' },
  { id: 'advanced', title: 'Advanced', description: 'Multi-brand and analytics.', accent: 'rose', icon: 'layers-outline' },
  { id: 'experience', title: 'Experience', description: 'Onboarding wizard and mobile web.', accent: 'mint', icon: 'sparkles-outline' },
];

const FALLBACK_ARTICLES: readonly DocsArticleMeta[] = [
  { slug: 'quotes-proposals', category: 'sales', title: 'Quotes & Proposals', order: 1, plans: ['free', 'starter', 'business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Send branded quotes in under a minute and convert them to invoices in one tap.', views: 482 },
  { slug: 'contracts', category: 'sales', title: 'Contracts', order: 2, plans: ['starter', 'business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Create, renew, and terminate contracts. Track active vs expiring at a glance.', views: 312 },
  { slug: 'commission-engine', category: 'sales', title: 'Commission Engine', order: 3, plans: ['business', 'enterprise'], readTime: '6 min', updatedAt: '2026-04-24', snippet: 'Split commissions across reps automatically based on your rules.', views: 198 },
  { slug: 'territory', category: 'sales', title: 'Territory Management', order: 4, plans: ['business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Assign reps to regions with a map-first view.', views: 142 },
  { slug: 'quota-forecasting', category: 'sales', title: 'Quota & Forecasting', order: 5, plans: ['business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'AI-backed quarterly forecasts you can trust.', views: 256 },
  { slug: 'e-signature', category: 'sales', title: 'E-Signature', order: 6, plans: ['starter', 'business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Legally-binding signatures without leaving Zyrix.', views: 221 },
  { slug: 'customer-health-score', category: 'sales', title: 'Customer Health Score', order: 7, plans: ['business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Flag accounts at risk before they churn.', views: 172 },

  { slug: 'loyalty-program', category: 'growth', title: 'Loyalty Program', order: 1, plans: ['starter', 'business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Bronze / Silver / Gold / Platinum tiers with instant rewards.', views: 298 },
  { slug: 'marketing-automation', category: 'growth', title: 'Marketing Automation', order: 2, plans: ['business', 'enterprise'], readTime: '6 min', updatedAt: '2026-04-24', snippet: 'Drip campaigns across WhatsApp, email, and SMS from one canvas.', views: 344 },

  { slug: 'ai-cfo', category: 'ai', title: 'AI CFO', order: 1, plans: ['business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Ask cash flow, late-payment, and forecast questions in plain language.', views: 512 },
  { slug: 'ai-workflow', category: 'ai', title: 'AI Workflow', order: 2, plans: ['business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Describe an automation — Zyrix builds it.', views: 287 },
  { slug: 'ai-architect', category: 'ai', title: 'AI Architect', order: 3, plans: ['enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Let AI configure your CRM based on your business type.', views: 134 },
  { slug: 'lead-scoring', category: 'ai', title: 'Predictive Lead Scoring', order: 4, plans: ['business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Hot / warm / cold signals scored every hour.', views: 401 },
  { slug: 'conversation-intelligence', category: 'ai', title: 'Conversation Intelligence', order: 5, plans: ['business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Sentiment and intent detection across calls, WhatsApp, and email.', views: 223 },
  { slug: 'duplicate-detection', category: 'ai', title: 'Smart Duplicate Detection', order: 6, plans: ['starter', 'business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Catches Arabic name variants and near-duplicates automatically.', views: 186 },
  { slug: 'meeting-intelligence', category: 'ai', title: 'Meeting Intelligence', order: 7, plans: ['business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Upload recordings — get summary, transcript, and action items.', views: 267 },

  { slug: 'customer-portal', category: 'operations', title: 'Customer Portal', order: 1, plans: ['starter', 'business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Your customers log in to self-serve quotes, invoices, and support.', views: 174 },
  { slug: 'integrated-payments', category: 'operations', title: 'Integrated Payments', order: 2, plans: ['free', 'starter', 'business', 'enterprise'], readTime: '6 min', updatedAt: '2026-04-24', snippet: 'Mada, STC Pay, iyzico, KNET — all in one payment link.', views: 389 },
  { slug: 'team-collaboration', category: 'operations', title: 'Team Collaboration', order: 3, plans: ['starter', 'business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Mentions, shared notes, and task handoffs inside every record.', views: 143 },

  { slug: 'rbac', category: 'security', title: 'Role-Based Access Control', order: 1, plans: ['business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Owner / Admin / Manager / Employee — plus custom roles.', views: 236 },
  { slug: 'ip-allowlist', category: 'security', title: 'IP Allowlist', order: 2, plans: ['enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Restrict logins to office IP ranges with a mobile bypass.', views: 152 },
  { slug: 'retention', category: 'security', title: 'Data Retention', order: 3, plans: ['business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Auto-purge old records on a schedule you control.', views: 97 },
  { slug: 'compliance-api', category: 'security', title: 'Compliance API', order: 4, plans: ['enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'GDPR / CCPA / PDPL export and erasure with one API call.', views: 78 },
  { slug: 'scim', category: 'security', title: 'SCIM Provisioning', order: 5, plans: ['enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Sync users from Okta, Azure AD, Google Workspace.', views: 64 },
  { slug: 'audit-log', category: 'security', title: 'Audit Log', order: 6, plans: ['business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Every action is logged, searchable, and exportable.', views: 124 },

  { slug: 'tax-invoices', category: 'tax', title: 'Native Tax Invoices', order: 1, plans: ['free', 'starter', 'business', 'enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'ZATCA, e-Fatura, and GCC formats generated natively.', views: 318 },

  { slug: 'google-docs', category: 'integrations', title: 'Google Docs Integration', order: 1, plans: ['starter', 'business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Attach Google Docs to records and co-edit in-app.', views: 112 },
  { slug: 'slack-teams', category: 'integrations', title: 'Slack & Teams', order: 2, plans: ['business', 'enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Push deal and invoice events to your team channels.', views: 98 },

  { slug: 'network-controls', category: 'platform', title: 'Network Controls', order: 1, plans: ['enterprise'], readTime: '4 min', updatedAt: '2026-04-24', snippet: 'Rate limiting, geo-blocking, and DDoS protection.', views: 57 },

  { slug: 'multi-brand', category: 'advanced', title: 'Multi-Brand', order: 1, plans: ['enterprise'], readTime: '5 min', updatedAt: '2026-04-24', snippet: 'Run several brands under one Zyrix tenant.', views: 84 },
  { slug: 'analytics', category: 'advanced', title: 'Advanced Analytics', order: 2, plans: ['business', 'enterprise'], readTime: '6 min', updatedAt: '2026-04-24', snippet: 'Cohort, funnel, and revenue analytics in one dashboard.', views: 203 },

  { slug: 'onboarding-wizard', category: 'experience', title: 'Onboarding Wizard', order: 1, plans: ['free', 'starter', 'business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Pick your country, language, and business type in under 2 minutes.', views: 267 },
  { slug: 'mobile-web', category: 'experience', title: 'Mobile Web Experience', order: 2, plans: ['free', 'starter', 'business', 'enterprise'], readTime: '3 min', updatedAt: '2026-04-24', snippet: 'Zyrix on mobile web is full-featured — no download needed.', views: 156 },
];

const localizeMeta = (
  article: DocsArticleMeta,
  lang: SupportedLanguage
): DocsArticleMeta => {
  if (lang === 'en') return article;
  const suffix = lang === 'ar' ? ' — دليل' : ' — Rehber';
  return {
    ...article,
    title: `${article.title}${suffix}`,
  };
};

const fallbackArticles = (lang: SupportedLanguage): readonly DocsArticleMeta[] =>
  FALLBACK_ARTICLES.map((a) => localizeMeta(a, lang));

const fallbackIndex = (lang: SupportedLanguage): DocsIndex => {
  const all = fallbackArticles(lang);
  const categories = CATEGORY_META.map((c) => ({
    ...c,
    articleCount: all.filter((a) => a.category === c.id).length,
  }));
  const popular = [...all]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5);
  return { lang, categories, popular };
};

const fallbackArticle = (
  lang: SupportedLanguage,
  category: DocsCategoryId,
  slug: string
): DocsArticle => {
  const all = fallbackArticles(lang).filter((a) => a.category === category);
  const idx = all.findIndex((a) => a.slug === slug);
  const meta =
    idx >= 0
      ? all[idx]
      : ({ ...all[0], slug, title: slug, category } as DocsArticleMeta);
  const markdown = buildFallbackMarkdown(meta, lang);
  return {
    ...meta,
    markdown,
    prevSlug: idx > 0 ? all[idx - 1].slug : null,
    nextSlug: idx >= 0 && idx < all.length - 1 ? all[idx + 1].slug : null,
  };
};

const buildFallbackMarkdown = (
  meta: DocsArticleMeta,
  lang: SupportedLanguage
): string => {
  const overview =
    lang === 'ar'
      ? 'نظرة عامة'
      : lang === 'tr'
      ? 'Genel bakış'
      : 'Overview';
  const howTo =
    lang === 'ar' ? 'كيف تعمل' : lang === 'tr' ? 'Nasıl çalışır' : 'How it works';
  const tip = lang === 'ar' ? 'نصيحة' : lang === 'tr' ? 'İpucu' : 'Tip';
  return [
    `# ${meta.title}`,
    '',
    meta.snippet ?? '',
    '',
    `## ${overview}`,
    '',
    meta.snippet ?? '',
    '',
    `## ${howTo}`,
    '',
    '1. Open the feature from the sidebar.',
    '2. Configure defaults the first time.',
    '3. Invite your team to start using it.',
    '',
    '```bash',
    'zyrix --help',
    '```',
    '',
    `> ${tip}: plans — ${meta.plans.join(', ')}`,
    '',
  ].join('\n');
};
