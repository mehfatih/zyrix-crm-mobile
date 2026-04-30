/**
 * Dark navy palette — drop-in replacement for src/constants/colors.ts.
 *
 * EVERY KEY in the legacy `colors` object is mirrored here with a dark-theme
 * value. The shape is identical so a future "swap" sprint can replace the
 * legacy module's content with `export { darkColors as colors } from './...'`
 * and 161 files migrate atomically.
 *
 * The audit (Section 1.2) lists every legacy key. This file mirrors all of
 * them: primary cyan ramp → primary violet ramp; light backgrounds → dark
 * navy; vibrant accent ramps → dark-readable accents; plan badges, gradients,
 * country badges all preserved.
 */

export const darkColors = {
  // ─── Primary brand ramp (was cyan; now violet to match web) ───────────────
  primary:        '#7A60FA',   // hsl(250 95% 68%) — bright violet
  primaryDark:    '#6849F5',   // pressed state
  primaryLight:   '#9580FB',   // hover/light variant
  primaryLighter: '#A78BFA',   // very light variant (for tinted surfaces)
  primarySoft:    'rgba(122, 96, 250, 0.12)',  // tinted background

  // ─── Backgrounds (dark hierarchy) ─────────────────────────────────────────
  background:  '#0C162C',   // app root — Deep Navy
  surface:     '#1A2440',   // primary card surface — Lifted Navy
  surfaceAlt:  '#242F4A',   // alt / nested surfaces
  overlay:     'rgba(122, 96, 250, 0.12)',   // primary tint overlay

  // ─── Text (foreground hierarchy) ──────────────────────────────────────────
  textPrimary:    '#F1F4F9',   // primary text — near-white
  textHeading:    '#FFFFFF',   // bright headings on dark surfaces
  textSecondary:  '#C9CDD4',   // secondary text
  textMuted:      '#9DA1A8',   // muted / disabled
  textInverse:    '#0C162C',   // for use on light surfaces (rare)
  textOnPrimary:  '#FFFFFF',   // text on violet buttons
  textLink:       '#A78BFA',   // links — light violet

  // ─── Borders & dividers ───────────────────────────────────────────────────
  border:        '#33405A',   // visible card borders
  borderStrong:  '#445273',    // emphasized border (focus, selected)
  borderFocus:   '#7A60FA',    // focus ring color (primary)
  divider:       'rgba(255, 255, 255, 0.08)',  // subtle horizontal line

  // ─── Semantic (won/at-risk/lost/info) — universal across pages ────────────
  success:     '#34D399',  successSoft: 'rgba(52, 211, 153, 0.12)',
  warning:     '#FBBF24',  warningSoft: 'rgba(251, 191, 36, 0.12)',
  error:       '#FB7185',  errorSoft:   'rgba(251, 113, 133, 0.12)',
  info:        '#22D3EE',  infoSoft:    'rgba(34, 211, 238, 0.12)',

  // ─── Vibrant accents (preserved — names match legacy for drop-in safety) ──
  // Each accent has the bright base value (light enough on dark) + a tinted soft variant
  coral:    '#FB7185',  coralSoft:    'rgba(251, 113, 133, 0.15)',
  peach:    '#FDBA74',  peachSoft:    'rgba(253, 186, 116, 0.15)',
  mint:     '#34D399',  mintSoft:     'rgba(52, 211, 153, 0.15)',
  lavender: '#A78BFA',  lavenderSoft: 'rgba(167, 139, 250, 0.15)',
  sunshine: '#FCD34D',  sunshineSoft: 'rgba(252, 211, 77, 0.15)',
  sky:      '#7DD3FC',  skySoft:      'rgba(125, 211, 252, 0.15)',
  rose:     '#F9A8D4',  roseSoft:     'rgba(249, 168, 212, 0.15)',
  teal:     '#5EEAD4',  tealSoft:     'rgba(94, 234, 212, 0.15)',

  // ─── Plan badges (preserved — light hex on dark surface) ──────────────────
  planFree:        '#94A3B8',  planFreeSoft:        'rgba(148, 163, 184, 0.15)',
  planStarter:     '#67E8F9',  planStarterSoft:     'rgba(103, 232, 249, 0.15)',
  planPro:         '#22D3EE',  planProSoft:         'rgba(34, 211, 238, 0.15)',
  planBusiness:    '#A78BFA',  planBusinessSoft:    'rgba(167, 139, 250, 0.15)',
  planEnterprise:  '#FCD34D',  planEnterpriseSoft:  'rgba(252, 211, 77, 0.15)',

  // ─── Gradient stops (preserved — dark navy variants) ──────────────────────
  // Old: cyan ramp (#22D3EE → #0891B2 → #0E7490)
  // New: violet/cyan glow on dark navy
  gradientStart: '#7A60FA',   // primary violet
  gradientMid:   '#6849F5',
  gradientEnd:   '#4F31E0',

  // ─── Utility ──────────────────────────────────────────────────────────────
  transparent: 'transparent',
  black:       '#000000',
  white:       '#FFFFFF',
  shadow:      'rgba(0, 0, 0, 0.45)',           // dark theme shadow base
  disabled:    '#445273',
  disabledText:'#9DA1A8',

  // ─── Country badges (unchanged — flag colors are international) ────────────
  saudiBadge:  '#006C35',   // Saudi green flag color
  turkeyBadge: '#E30A17',   // Turkey red flag color
} as const;

export const darkGradients = {
  hero:        ['#7A60FA', '#22D3EE'] as const,   // violet → cyan glow
  success:     ['#34D399', '#5EEAD4'] as const,   // emerald → teal
  warning:     ['#FDBA74', '#FCD34D'] as const,   // peach → sunshine
  premium:     ['#A78BFA', '#7DD3FC'] as const,   // lavender → sky (premium feel)
  celebration: ['#FB7185', '#FDBA74'] as const,   // coral → peach (celebration unchanged)
  soft:        ['#F9A8D4', '#A78BFA'] as const,   // rose → lavender
} as const;

export type DarkColors = typeof darkColors;
export type DarkGradients = typeof darkGradients;
