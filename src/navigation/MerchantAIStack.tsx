/**
 * MerchantAIStack — stack for the "AI Tools" tab.
 *
 * Sprint 6 swaps the placeholders for the real AI screens: CFO,
 * Workflows + Workflow Builder, Builder (Architect/Builder/Reports),
 * Lead scoring list + detail, Conversation intelligence list + detail,
 * Duplicate detection list + review, Meeting intelligence list +
 * detail + uploader.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AIBuilderScreen } from '../screens/merchant/ai/AIBuilderScreen';
import { AICFOScreen } from '../screens/merchant/ai/AICFOScreen';
import { AIWorkflowBuilderScreen } from '../screens/merchant/ai/AIWorkflowBuilderScreen';
import { AIWorkflowsScreen } from '../screens/merchant/ai/AIWorkflowsScreen';
import { ConversationAnalysisScreen } from '../screens/merchant/ai/ConversationAnalysisScreen';
import { ConversationIntelScreen } from '../screens/merchant/ai/ConversationIntelScreen';
import { DuplicateDetectionScreen } from '../screens/merchant/ai/DuplicateDetectionScreen';
import { DuplicateReviewScreen } from '../screens/merchant/ai/DuplicateReviewScreen';
import { LeadScoreDetailScreen } from '../screens/merchant/ai/LeadScoreDetailScreen';
import { LeadScoringScreen } from '../screens/merchant/ai/LeadScoringScreen';
import { MeetingDetailScreen } from '../screens/merchant/ai/MeetingDetailScreen';
import { MeetingIntelScreen } from '../screens/merchant/ai/MeetingIntelScreen';
import { UploadMeetingScreen } from '../screens/merchant/ai/UploadMeetingScreen';
import type { MerchantAIStackParamList } from './types';

const Stack = createNativeStackNavigator<MerchantAIStackParamList>();

export const MerchantAIStack: React.FC = () => (
  <Stack.Navigator
    initialRouteName="AICFO"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="AICFO" component={AICFOScreen} />
    <Stack.Screen name="AIWorkflows" component={AIWorkflowsScreen} />
    <Stack.Screen
      name="AIWorkflowBuilder"
      component={AIWorkflowBuilderScreen}
    />
    <Stack.Screen name="AIBuilder" component={AIBuilderScreen} />
    <Stack.Screen name="LeadScoring" component={LeadScoringScreen} />
    <Stack.Screen name="LeadScoreDetail" component={LeadScoreDetailScreen} />
    <Stack.Screen name="ConversationIntel" component={ConversationIntelScreen} />
    <Stack.Screen
      name="ConversationAnalysis"
      component={ConversationAnalysisScreen}
    />
    <Stack.Screen name="DuplicateDetection" component={DuplicateDetectionScreen} />
    <Stack.Screen name="DuplicateReview" component={DuplicateReviewScreen} />
    <Stack.Screen name="MeetingIntel" component={MeetingIntelScreen} />
    <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} />
    <Stack.Screen name="UploadMeeting" component={UploadMeetingScreen} />
  </Stack.Navigator>
);

export default MerchantAIStack;
