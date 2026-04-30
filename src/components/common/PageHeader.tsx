/**
 * PageHeader — wraps the existing `<Header>` and adds the per-page
 * identity strip (eyebrow text + icon tile) introduced in M23.
 *
 * Use this when a screen wants the full Sprint 14n identity treatment:
 *
 *   <PageHeader
 *     title={t('customers.title')}
 *     accent={getPageAccent('customers')}
 *     eyebrow={t('Pages.customers.eyebrow')}
 *     iconName="people-outline"
 *   />
 *
 * If no `eyebrow` and no `iconName` are supplied the identity strip
 * is omitted and the component renders the bare Header — useful for
 * minimal screens that just want the accent on the header bar.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header, type HeaderProps } from './Header';
import { Icon, type AnyIconName } from './Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import type { AccentShade } from '../../theme/dark/accents';

export interface PageHeaderProps extends Omit<HeaderProps, 'accent'> {
  /** Page accent (from `getPageAccent('pageId')`). */
  accent: AccentShade;
  /** Optional eyebrow text shown in the identity strip below the bar. */
  eyebrow?: string;
  /** Optional Ionicons name for the icon tile in the identity strip. */
  iconName?: AnyIconName;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  accent,
  eyebrow,
  iconName,
  title,
  ...rest
}) => {
  const showStrip = Boolean(eyebrow || iconName);

  return (
    <View>
      <Header title={title} accent={accent} {...rest} />
      {showStrip ? (
        <View
          style={[
            styles.identityRow,
            {
              backgroundColor: accent.bgSoft,
              borderBottomColor: accent.border,
            },
          ]}
        >
          {iconName ? (
            <View
              style={[
                styles.iconTile,
                {
                  backgroundColor: accent.bgTint,
                  borderColor: accent.border,
                },
              ]}
            >
              <Icon name={iconName} color={accent.base} size={20} />
            </View>
          ) : null}
          {eyebrow ? (
            <Text style={[textStyles.overline, styles.eyebrow, { color: accent.base }]}>
              {eyebrow}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    columnGap: spacing.sm,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    flex: 1,
    letterSpacing: 1.2,
  },
});

export default PageHeader;
