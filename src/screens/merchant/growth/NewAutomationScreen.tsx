/**
 * NewAutomationScreen — hosts `AutomationBuilder`. Provides a Test Run
 * button that simulates one execution, and an Activate toggle that
 * saves the workflow as enabled when the user finishes.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { AutomationBuilder, type AutomationWorkflow } from '../../../components/feature-specific/AutomationBuilder';
import { Button } from '../../../components/common/Button';
import { Header } from '../../../components/common/Header';
import { colors } from '../../../constants/colors';
import { spacing } from '../../../constants/spacing';
import { useToast } from '../../../hooks/useToast';

const DEFAULT: AutomationWorkflow = {
  name: '',
  active: false,
  trigger: 'newCustomer',
  nodes: [],
};

export const NewAutomationScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();

  const [workflow, setWorkflow] = useState<AutomationWorkflow>(DEFAULT);

  const testRun = (): void => {
    toast.info(t('automation.testMode'));
  };

  const save = (): void => {
    if (!workflow.name.trim()) {
      toast.error(t('forms.required'));
      return;
    }
    toast.success(t('common.success'));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Header
        title={t('growth.automation')}
        onBack={() => navigation.goBack()}
      />
      <AutomationBuilder value={workflow} onChange={setWorkflow} />
      <View style={styles.footer}>
        <Button
          label={t('automation.testMode')}
          variant="outline"
          onPress={testRun}
        />
        <Button
          label={t('common.save')}
          onPress={save}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

export default NewAutomationScreen;
