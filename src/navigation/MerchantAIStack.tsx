/**
 * MerchantAIStack — stack for the "AI Tools" tab.
 *
 * Placeholders for Sprint 2; the actual AI features (CFO co-pilot,
 * lead scoring, meeting/conversation intelligence) arrive in Sprint 6.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '../screens/common/PlaceholderScreen';
import type { MerchantAIStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantAIStackParamList>();

const AICFOScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.aiCfo')}
      sprintNumber={6}
      icon="analytics-outline"
    />
  );
};

const AIWorkflowsScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.aiWorkflows')}
      sprintNumber={6}
      icon="flash-outline"
    />
  );
};

const AIBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.aiBuilder')}
      sprintNumber={6}
      icon="construct-outline"
    />
  );
};

const LeadScoringScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.leadScoring')}
      sprintNumber={6}
      icon="trending-up-outline"
    />
  );
};

const ConversationIntelScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.conversationIntel')}
      sprintNumber={6}
      icon="chatbubbles-outline"
    />
  );
};

const MeetingIntelScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('navigation.meetingIntel')}
      sprintNumber={6}
      icon="videocam-outline"
    />
  );
};

export const MerchantAIStack: React.FC = () => (
  <Stack.Navigator initialRouteName="AICFO" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AICFO" component={AICFOScreen} />
    <Stack.Screen name="AIWorkflows" component={AIWorkflowsScreen} />
    <Stack.Screen name="AIBuilder" component={AIBuilderScreen} />
    <Stack.Screen name="LeadScoring" component={LeadScoringScreen} />
    <Stack.Screen name="ConversationIntel" component={ConversationIntelScreen} />
    <Stack.Screen name="MeetingIntel" component={MeetingIntelScreen} />
  </Stack.Navigator>
);

export default MerchantAIStack;
