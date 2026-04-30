/**
 * Per-page accent identity — mirrors crm.zyrix.co's Sprint 14n accent map.
 *
 * Each web page has one canonical accent color. Mobile screens that map to
 * a web page must use the same accent so the brand identity is consistent
 * across both surfaces.
 *
 * Status colors (won/at-risk/lost/AI) are SEPARATE — see statusColors.ts.
 */

const SHADES = {
  cyan:    { base: '#22D3EE', text: '#67E8F9', bgTint: 'rgba(34, 211, 238, 0.15)',  bgSoft: 'rgba(34, 211, 238, 0.08)',  border: 'rgba(34, 211, 238, 0.40)' },
  violet:  { base: '#7A60FA', text: '#A78BFA', bgTint: 'rgba(122, 96, 250, 0.15)',  bgSoft: 'rgba(122, 96, 250, 0.08)',  border: 'rgba(122, 96, 250, 0.40)' },
  emerald: { base: '#10B981', text: '#6EE7B7', bgTint: 'rgba(16, 185, 129, 0.15)',  bgSoft: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.40)' },
  sky:     { base: '#0EA5E9', text: '#7DD3FC', bgTint: 'rgba(14, 165, 233, 0.15)',  bgSoft: 'rgba(14, 165, 233, 0.08)',  border: 'rgba(14, 165, 233, 0.40)' },
  indigo:  { base: '#6366F1', text: '#A5B4FC', bgTint: 'rgba(99, 102, 241, 0.15)',  bgSoft: 'rgba(99, 102, 241, 0.08)',  border: 'rgba(99, 102, 241, 0.40)' },
  rose:    { base: '#F43F5E', text: '#FDA4AF', bgTint: 'rgba(244, 63, 94, 0.15)',   bgSoft: 'rgba(244, 63, 94, 0.08)',   border: 'rgba(244, 63, 94, 0.40)' },
  amber:   { base: '#F59E0B', text: '#FCD34D', bgTint: 'rgba(245, 158, 11, 0.15)',  bgSoft: 'rgba(245, 158, 11, 0.08)',  border: 'rgba(245, 158, 11, 0.40)' },
  teal:    { base: '#14B8A6', text: '#5EEAD4', bgTint: 'rgba(20, 184, 166, 0.15)',  bgSoft: 'rgba(20, 184, 166, 0.08)',  border: 'rgba(20, 184, 166, 0.40)' },
  lime:    { base: '#84CC16', text: '#BEF264', bgTint: 'rgba(132, 204, 22, 0.15)',  bgSoft: 'rgba(132, 204, 22, 0.08)',  border: 'rgba(132, 204, 22, 0.40)' },
  pink:    { base: '#EC4899', text: '#F9A8D4', bgTint: 'rgba(236, 72, 153, 0.15)',  bgSoft: 'rgba(236, 72, 153, 0.08)',  border: 'rgba(236, 72, 153, 0.40)' },
  slate:   { base: '#64748B', text: '#94A3B8', bgTint: 'rgba(148, 163, 184, 0.15)', bgSoft: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.40)' },
  fuchsia: { base: '#D946EF', text: '#F0ABFC', bgTint: 'rgba(217, 70, 239, 0.15)',  bgSoft: 'rgba(217, 70, 239, 0.08)',  border: 'rgba(217, 70, 239, 0.40)' },
  orange:  { base: '#F97316', text: '#FDBA74', bgTint: 'rgba(249, 115, 22, 0.15)',  bgSoft: 'rgba(249, 115, 22, 0.08)',  border: 'rgba(249, 115, 22, 0.40)' },
} as const;

export type AccentColor = keyof typeof SHADES;
export type AccentShade = typeof SHADES[AccentColor];

export const accents = SHADES;

export const pageAccentMap = {
  dashboard:    'cyan',
  customers:    'violet',
  deals:        'emerald',
  pipeline:     'cyan',
  quotes:       'sky',
  contracts:    'indigo',
  loyalty:      'rose',
  tax:          'amber',
  taxInvoices:  'teal',
  commission:   'lime',
  cashFlow:     'emerald',
  reports:      'sky',
  analytics:    'violet',
  followUp:     'amber',
  campaigns:    'pink',
  aiCfo:        'violet',
  tasks:        'cyan',
  templates:    'indigo',
  automations:  'violet',
  aiAgents:     'violet',
  teamChat:     'sky',
  whatsapp:     'emerald',
  settings:     'slate',
} as const;

export type PageId = keyof typeof pageAccentMap;

export function getPageAccent(page: PageId): AccentShade {
  return accents[pageAccentMap[page]];
}

/**
 * Top-5 hero rank palette — universal, ranks 1-5 always use these colors
 * regardless of which page hosts the hero strip. Mirrors web Sprint 14r/14s.
 */
export const rankPalette = [
  { rank: 1, accent: 'amber',   label: 'Gold',   hex: '#FBBF24' },
  { rank: 2, accent: 'cyan',    label: 'Silver', hex: '#22D3EE' },
  { rank: 3, accent: 'emerald', label: 'Bronze', hex: '#34D399' },
  { rank: 4, accent: 'violet',  label: 'Violet', hex: '#A78BFA' },
  { rank: 5, accent: 'pink',    label: 'Pink',   hex: '#F472B6' },
] as const;
