/**
 * Sidebar catalog — single source of truth for the SmartSidebar groups.
 *
 * Groups match the website's 7-group structure (DAILY OPS / CRM CORE /
 * SALES DOCS / FINANCE / GROWTH / INTELLIGENCE / AI & AUTOMATION).
 *
 * Each item has:
 *   - id: unique route key
 *   - labelKey: i18n key for the display label (Sidebar.* namespace)
 *   - icon: Ionicons icon name (rendered via Icon component)
 *   - status: 'real' | 'soon' (controls SOON badge rendering)
 *   - route: navigation target — either a top-level route name string or a
 *     `{ nav, params }` object for nested navigation
 *   - pinnable: whether the item can be pinned to the top section
 *
 * Real items: navigate to actual screens via nested navigation.
 * SOON items: render a SOON badge and show a toast on tap (no navigation).
 *
 * Accent labels ('cyan' | 'violet' | 'sky' | 'emerald' | 'rose') are
 * mapped at render time to the SidebarItem-supported accents:
 *   violet  → lavender (closest violet-ish hue available)
 *   emerald → mint (closest emerald-ish hue available)
 *   rose    → coral (closest rose-ish hue available)
 *   cyan    → cyan (direct match)
 *   sky     → sky (direct match)
 */

import type { AnyIconName } from '../../components/common/Icon';

export type SidebarItemStatus = 'real' | 'soon';
export type SidebarGroupAccent = 'cyan' | 'violet' | 'sky' | 'emerald' | 'rose';

export interface SidebarRouteTarget {
  nav: string;
  params?: Record<string, unknown>;
}

export interface SidebarCatalogItem {
  id: string;
  labelKey: string;
  icon: AnyIconName;
  status: SidebarItemStatus;
  route?: string | SidebarRouteTarget;
  pinnable?: boolean;
}

export interface SidebarCatalogGroup {
  id: string;
  labelKey: string;
  accent: SidebarGroupAccent;
  items: readonly SidebarCatalogItem[];
}

export const SIDEBAR_HOME: SidebarCatalogItem = {
  id: 'home',
  labelKey: 'Sidebar.home',
  icon: 'home-outline',
  status: 'real',
  route: 'Home',
  pinnable: false,
};

export const SIDEBAR_GROUPS: readonly SidebarCatalogGroup[] = [
  {
    id: 'dailyops',
    labelKey: 'Sidebar.groups.dailyOps',
    accent: 'cyan',
    items: [
      { id: 'tasks', labelKey: 'Sidebar.tasks', icon: 'checkmark-done-outline', status: 'soon', pinnable: true },
      { id: 'followup', labelKey: 'Sidebar.followup', icon: 'notifications-outline', status: 'soon', pinnable: true },
      { id: 'teamchat', labelKey: 'Sidebar.teamChat', icon: 'chatbubble-ellipses-outline', status: 'soon', pinnable: true },
    ],
  },
  {
    id: 'crmcore',
    labelKey: 'Sidebar.groups.crmCore',
    accent: 'violet',
    items: [
      {
        id: 'customers',
        labelKey: 'Sidebar.customers',
        icon: 'people-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Customers' } } },
        pinnable: true,
      },
      {
        id: 'deals',
        labelKey: 'Sidebar.deals',
        icon: 'briefcase-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Deals' } } },
        pinnable: true,
      },
      {
        id: 'pipeline',
        labelKey: 'Sidebar.pipeline',
        icon: 'trending-up-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Pipeline' } } },
        pinnable: true,
      },
      { id: 'contacts', labelKey: 'Sidebar.contacts', icon: 'person-outline', status: 'soon', pinnable: true },
      { id: 'companies', labelKey: 'Sidebar.companies', icon: 'business-outline', status: 'soon', pinnable: true },
      {
        id: 'campaigns',
        labelKey: 'Sidebar.campaigns',
        icon: 'megaphone-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'GrowthTab', params: { screen: 'Campaigns' } } },
        pinnable: true,
      },
    ],
  },
  {
    id: 'salesdocs',
    labelKey: 'Sidebar.groups.salesDocs',
    accent: 'sky',
    items: [
      {
        id: 'quotes',
        labelKey: 'Sidebar.quotes',
        icon: 'document-text-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Quotes' } } },
        pinnable: true,
      },
      {
        id: 'contracts',
        labelKey: 'Sidebar.contracts',
        icon: 'document-attach-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Contracts' } } },
        pinnable: true,
      },
      { id: 'whatsapp', labelKey: 'Sidebar.whatsapp', icon: 'logo-whatsapp', status: 'soon', pinnable: true },
    ],
  },
  {
    id: 'finance',
    labelKey: 'Sidebar.groups.finance',
    accent: 'emerald',
    items: [
      { id: 'cashflow', labelKey: 'Sidebar.cashFlow', icon: 'cash-outline', status: 'soon', pinnable: true },
      { id: 'tax', labelKey: 'Sidebar.tax', icon: 'calculator-outline', status: 'soon', pinnable: true },
      {
        id: 'taxinvoices',
        labelKey: 'Sidebar.taxInvoices',
        icon: 'receipt-outline',
        status: 'real',
        route: {
          nav: 'Home',
          params: { screen: 'MoreTab', params: { screen: 'Compliance', params: { screen: 'TaxInvoices' } } },
        },
        pinnable: true,
      },
      {
        id: 'commission',
        labelKey: 'Sidebar.commission',
        icon: 'wallet-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'SalesTab', params: { screen: 'Commissions' } } },
        pinnable: true,
      },
    ],
  },
  {
    id: 'growth',
    labelKey: 'Sidebar.groups.growth',
    accent: 'rose',
    items: [
      {
        id: 'loyalty',
        labelKey: 'Sidebar.loyalty',
        icon: 'gift-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'GrowthTab', params: { screen: 'Loyalty' } } },
        pinnable: true,
      },
    ],
  },
  {
    id: 'intelligence',
    labelKey: 'Sidebar.groups.intelligence',
    accent: 'violet',
    items: [
      { id: 'analytics', labelKey: 'Sidebar.analytics', icon: 'bar-chart-outline', status: 'soon', pinnable: true },
      { id: 'reports', labelKey: 'Sidebar.reports', icon: 'pie-chart-outline', status: 'soon', pinnable: true },
      { id: 'sessionkpis', labelKey: 'Sidebar.sessionKPIs', icon: 'pulse-outline', status: 'soon', pinnable: true },
    ],
  },
  {
    id: 'aiautomation',
    labelKey: 'Sidebar.groups.aiAutomation',
    accent: 'violet',
    items: [
      {
        id: 'aicfo',
        labelKey: 'Sidebar.aiCFO',
        icon: 'sparkles-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'AITab', params: { screen: 'AICFO' } } },
        pinnable: true,
      },
      {
        id: 'aiagents',
        labelKey: 'Sidebar.aiAgents',
        icon: 'hardware-chip-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'AITab', params: { screen: 'AgentInbox' } } },
        pinnable: true,
      },
      {
        id: 'automations',
        labelKey: 'Sidebar.automations',
        icon: 'flash-outline',
        status: 'real',
        route: { nav: 'Home', params: { screen: 'GrowthTab', params: { screen: 'Automation' } } },
        pinnable: true,
      },
      { id: 'templates', labelKey: 'Sidebar.templates', icon: 'duplicate-outline', status: 'soon', pinnable: true },
    ],
  },
];

export const SIDEBAR_FOOTER_ITEMS: readonly SidebarCatalogItem[] = [
  {
    id: 'settings',
    labelKey: 'Sidebar.settings',
    icon: 'settings-outline',
    status: 'real',
    route: { nav: 'Home', params: { screen: 'MoreTab', params: { screen: 'Settings' } } },
  },
  { id: 'help', labelKey: 'Sidebar.help', icon: 'help-buoy-outline', status: 'real', route: 'Help' },
  {
    id: 'profile',
    labelKey: 'Sidebar.profile',
    icon: 'person-circle-outline',
    status: 'real',
    route: { nav: 'Home', params: { screen: 'MoreTab', params: { screen: 'Profile' } } },
  },
];

/** Helper: flatten all sidebar items (home + groups + footer) for search & pinned lookup. */
export function getAllSidebarItems(): SidebarCatalogItem[] {
  return [SIDEBAR_HOME, ...SIDEBAR_GROUPS.flatMap((g) => g.items), ...SIDEBAR_FOOTER_ITEMS];
}

/** Helper: find an item by id across all groups. */
export function findSidebarItem(id: string): SidebarCatalogItem | undefined {
  return getAllSidebarItems().find((item) => item.id === id);
}
