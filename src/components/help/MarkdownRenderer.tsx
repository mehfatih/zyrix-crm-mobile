/**
 * MarkdownRenderer — native Help Center markdown renderer.
 *
 * Supports the subset our docs authors use:
 *   - Headings (# .. ######)
 *   - Paragraphs with **bold**, *italic*, `inline code`, [links](url)
 *   - Ordered and unordered lists (1. / - / *)
 *   - Fenced code blocks ```lang ... ```
 *   - Blockquotes (> text) rendered as info callouts
 *   - Callout shortcodes: "> [!info] title" / [!warning] / [!success] / [!tip]
 *   - Horizontal rules (---)
 *   - Tables (simple pipe syntax)
 *
 * No external markdown libraries — keeps the bundle small and avoids
 * pulling in a web-oriented renderer. If authors need advanced syntax
 * later we can swap this for react-native-markdown-display without
 * touching call sites.
 */

import React, { useMemo } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '../common/Icon';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

type CalloutKind = 'info' | 'warning' | 'success' | 'tip';

type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; lang: string | null; code: string }
  | { type: 'callout'; kind: CalloutKind; title: string | null; text: string }
  | { type: 'divider' }
  | { type: 'table'; headers: string[]; rows: string[][] };

const detectCallout = (line: string): { kind: CalloutKind; title: string | null } | null => {
  const match = /^\[!(info|warning|success|tip)\](.*)$/i.exec(line.trim());
  if (!match) return null;
  const kind = match[1].toLowerCase() as CalloutKind;
  const title = match[2].trim();
  return { kind, title: title.length > 0 ? title : null };
};

const parseBlocks = (markdown: string): Block[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim().length === 0) {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || null;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      blocks.push({ type: 'divider' });
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        buf.push(lines[i].trimStart().slice(2).trim());
        i += 1;
      }
      const first = buf[0] ?? '';
      const callout = detectCallout(first);
      if (callout) {
        const text = buf.slice(1).join('\n').trim();
        blocks.push({
          type: 'callout',
          kind: callout.kind,
          title: callout.title,
          text: text.length > 0 ? text : callout.title ?? '',
        });
      } else {
        blocks.push({
          type: 'callout',
          kind: 'info',
          title: null,
          text: buf.join('\n').trim(),
        });
      }
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+\.\s+/.test(lines[i]) : /^\s*[-*]\s+/.test(lines[i]))
      ) {
        const m = pattern.exec(lines[i]);
        if (m) items.push(m[1].trim());
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const headerCells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().length > 0) {
        const cells = lines[i]
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        rows.push(cells);
        i += 1;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^-{3,}\s*$/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
};

interface InlineToken {
  kind: 'text' | 'bold' | 'italic' | 'code' | 'link';
  value: string;
  href?: string;
}

const parseInline = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let remaining = text;
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;

  while (remaining.length > 0) {
    const match = regex.exec(remaining);
    if (!match) {
      tokens.push({ kind: 'text', value: remaining });
      break;
    }
    const before = remaining.slice(0, match.index);
    if (before.length > 0) tokens.push({ kind: 'text', value: before });

    const raw = match[0];
    if (raw.startsWith('**')) {
      tokens.push({ kind: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('*')) {
      tokens.push({ kind: 'italic', value: raw.slice(1, -1) });
    } else if (raw.startsWith('`')) {
      tokens.push({ kind: 'code', value: raw.slice(1, -1) });
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(raw);
      if (linkMatch) {
        tokens.push({ kind: 'link', value: linkMatch[1], href: linkMatch[2] });
      } else {
        tokens.push({ kind: 'text', value: raw });
      }
    }
    remaining = remaining.slice(match.index + raw.length);
  }

  return tokens;
};

const InlineText: React.FC<{ text: string; style?: object }> = ({ text, style }) => {
  const tokens = useMemo(() => parseInline(text), [text]);
  return (
    <Text style={[styles.paragraph, style]}>
      {tokens.map((t, idx) => {
        switch (t.kind) {
          case 'bold':
            return (
              <Text key={idx} style={styles.bold}>
                {t.value}
              </Text>
            );
          case 'italic':
            return (
              <Text key={idx} style={styles.italic}>
                {t.value}
              </Text>
            );
          case 'code':
            return (
              <Text key={idx} style={styles.inlineCode}>
                {t.value}
              </Text>
            );
          case 'link':
            return (
              <Text
                key={idx}
                style={styles.link}
                onPress={() => {
                  if (t.href) void Linking.openURL(t.href);
                }}
              >
                {t.value}
              </Text>
            );
          case 'text':
          default:
            return (
              <Text key={idx} style={style}>
                {t.value}
              </Text>
            );
        }
      })}
    </Text>
  );
};

const CALLOUT_STYLES: Record<
  CalloutKind,
  { bg: string; border: string; icon: string; fg: string }
> = {
  info: { bg: colors.infoSoft, border: colors.info, icon: 'information-circle-outline', fg: colors.primaryDark },
  warning: { bg: colors.warningSoft, border: colors.warning, icon: 'warning-outline', fg: '#92400E' },
  success: { bg: colors.successSoft, border: colors.success, icon: 'checkmark-circle-outline', fg: '#065F46' },
  tip: { bg: colors.lavenderSoft, border: colors.lavender, icon: 'bulb-outline', fg: '#5B21B6' },
};

interface MarkdownRendererProps {
  source: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ source }) => {
  const blocks = useMemo(() => parseBlocks(source), [source]);

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const headingStyle =
              block.level === 1
                ? styles.h1
                : block.level === 2
                ? styles.h2
                : block.level === 3
                ? styles.h3
                : styles.h4;
            return (
              <View key={idx} style={styles.headingWrap}>
                <InlineText text={block.text} style={headingStyle} />
              </View>
            );
          }
          case 'paragraph':
            return <InlineText key={idx} text={block.text} style={styles.paragraph} />;
          case 'list':
            return (
              <View key={idx} style={styles.list}>
                {block.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.listItem}>
                    <Text style={styles.listBullet}>
                      {block.ordered ? `${itemIdx + 1}.` : '•'}
                    </Text>
                    <View style={styles.listItemBody}>
                      <InlineText text={item} style={styles.paragraph} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'code':
            return (
              <ScrollView
                key={idx}
                horizontal
                style={styles.codeBlock}
                contentContainerStyle={styles.codeBlockContent}
                showsHorizontalScrollIndicator={false}
              >
                <Text style={styles.code}>{block.code}</Text>
              </ScrollView>
            );
          case 'callout': {
            const palette = CALLOUT_STYLES[block.kind];
            return (
              <View
                key={idx}
                style={[
                  styles.callout,
                  { backgroundColor: palette.bg, borderLeftColor: palette.border },
                ]}
              >
                <Icon name={palette.icon as never} size={18} color={palette.border} />
                <View style={styles.calloutBody}>
                  {block.title ? (
                    <Text style={[styles.calloutTitle, { color: palette.fg }]}>
                      {block.title}
                    </Text>
                  ) : null}
                  <InlineText
                    text={block.text}
                    style={[styles.paragraph, { color: palette.fg }]}
                  />
                </View>
              </View>
            );
          }
          case 'divider':
            return <View key={idx} style={styles.divider} />;
          case 'table':
            return (
              <ScrollView
                key={idx}
                horizontal
                style={styles.tableScroll}
                showsHorizontalScrollIndicator={false}
              >
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    {block.headers.map((h, hIdx) => (
                      <Text key={hIdx} style={styles.tableHeader} numberOfLines={2}>
                        {h}
                      </Text>
                    ))}
                  </View>
                  {block.rows.map((row, rIdx) => (
                    <View key={rIdx} style={styles.tableRow}>
                      {row.map((cell, cIdx) => (
                        <View key={cIdx} style={styles.tableCell}>
                          <InlineText text={cell} style={styles.tableCellText} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
          default:
            return null;
        }
      })}
    </View>
  );
};

const LINE_HEIGHT = 1.7;

const styles = StyleSheet.create({
  container: {
    rowGap: spacing.md,
  },
  headingWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  h1: {
    ...textStyles.h1,
    color: colors.textHeading,
    lineHeight: textStyles.h1.fontSize * 1.3,
  },
  h2: {
    ...textStyles.h2,
    color: colors.textHeading,
    lineHeight: textStyles.h2.fontSize * 1.3,
  },
  h3: {
    ...textStyles.h3,
    color: colors.textHeading,
    lineHeight: textStyles.h3.fontSize * 1.3,
  },
  h4: {
    ...textStyles.h4,
    color: colors.textHeading,
    lineHeight: textStyles.h4.fontSize * 1.3,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHT,
    color: colors.textPrimary,
  },
  bold: {
    fontWeight: '700',
    color: colors.textHeading,
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    paddingHorizontal: 4,
    borderRadius: radius.xs,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  list: {
    rowGap: spacing.xs,
    marginStart: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  listBullet: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHT,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 20,
  },
  listItemBody: {
    flex: 1,
  },
  codeBlock: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  codeBlockContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 13 * 1.5,
  },
  callout: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  calloutBody: {
    flex: 1,
    rowGap: spacing.xxs,
  },
  calloutTitle: {
    ...textStyles.bodyMedium,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  tableScroll: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  table: {
    minWidth: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tableHeader: {
    ...textStyles.label,
    color: colors.textHeading,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 120,
  },
  tableCell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 120,
  },
  tableCellText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
});

export default MarkdownRenderer;
