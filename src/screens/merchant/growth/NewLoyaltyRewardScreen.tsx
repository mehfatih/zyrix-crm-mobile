/**
 * NewLoyaltyRewardScreen — create a reward that customers can redeem
 * for points. Wires image upload, point cost, category, stock, expiry,
 * and eligible tier toggles.
 */

import React, { useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/forms/DatePicker';
import { FileUploader, type UploadedFile } from '../../../components/forms/FileUploader';
import { Header } from '../../../components/common/Header';
import { Icon } from '../../../components/common/Icon';
import { Input } from '../../../components/common/Input';
import { colors } from '../../../constants/colors';
import { radius, shadows, spacing } from '../../../constants/spacing';
import { textStyles } from '../../../constants/typography';
import { useToast } from '../../../hooks/useToast';

type Category = 'product' | 'service' | 'discount' | 'experience';
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

const CATEGORIES: readonly Category[] = [
  'product',
  'service',
  'discount',
  'experience',
];

const TIERS: readonly Tier[] = ['bronze', 'silver', 'gold', 'platinum'];

export const NewLoyaltyRewardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pointCost, setPointCost] = useState('');
  const [category, setCategory] = useState<Category>('product');
  const [limitedStock, setLimitedStock] = useState(false);
  const [stockCount, setStockCount] = useState('');
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [tiers, setTiers] = useState<Record<Tier, boolean>>({
    bronze: false,
    silver: true,
    gold: true,
    platinum: true,
  });

  const toggleTier = (tier: Tier): void => {
    setTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  const save = (): void => {
    if (!name.trim() || !pointCost) {
      toast.error(t('forms.required'));
      return;
    }
    toast.success(t('common.success'));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('loyalty.newReward')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Input
            label={t('loyalty.rewardName')}
            value={name}
            onChangeText={setName}
            required
          />
          <Text style={styles.fieldLabel}>
            {t('quoteBuilder.customerNotes')}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('quoteBuilder.customerNotes')}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.textarea,
              { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          />
        </View>

        <FileUploader
          label={t('files.tapToUpload')}
          value={files}
          onUpload={(file) => setFiles((prev) => [...prev, file])}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          acceptedTypes={['image/*']}
        />

        <View style={styles.card}>
          <Input
            label={`${t('loyalty.pointCost')}`}
            value={pointCost}
            onChangeText={(next) =>
              setPointCost(next.replace(/[^0-9]/g, ''))
            }
            keyboardType="number-pad"
            required
          />
          <Text style={styles.fieldLabel}>{t('loyalty.category')}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  category === cat ? styles.categoryChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat ? { color: colors.textInverse } : null,
                  ]}
                >
                  {t(`loyaltyCategories.${cat}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.fieldLabel}>{t('loyalty.stock')}</Text>
            <Switch
              value={limitedStock}
              onValueChange={setLimitedStock}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.stockHint}>
            {limitedStock ? t('loyalty.limited') : t('loyalty.unlimited')}
          </Text>
          {limitedStock ? (
            <Input
              value={stockCount}
              onChangeText={(next) => setStockCount(next.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              label={t('loyalty.stock')}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <DatePicker
            label={t('forms.required')}
            value={expiry}
            onChange={setExpiry}
            minDate={new Date()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('loyalty.eligibleTiers')}</Text>
          {TIERS.map((tier) => (
            <Pressable
              key={tier}
              onPress={() => toggleTier(tier)}
              style={styles.tierRow}
            >
              <View
                style={[
                  styles.checkbox,
                  tiers[tier] ? styles.checkboxChecked : null,
                ]}
              >
                {tiers[tier] ? (
                  <Icon name="checkmark" size={12} color={colors.textInverse} />
                ) : null}
              </View>
              <Text style={styles.tierText}>{t(`loyalty.${tier}`)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('common.save')} onPress={save} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    rowGap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.lg,
    rowGap: spacing.sm,
    ...shadows.xs,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  textarea: {
    ...textStyles.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    padding: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockHint: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tierText: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NewLoyaltyRewardScreen;
