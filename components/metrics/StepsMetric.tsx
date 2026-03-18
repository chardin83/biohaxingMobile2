import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { DailyActivity } from '@/wearables/types';

interface StepsMetricProps {
  activityData: DailyActivity[];
  showDivider?: boolean;
}

export function StepsMetric({ activityData, showDivider = false }: Readonly<StepsMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const today = activityData[0];
  const steps = today?.steps;

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider],
        { borderColor: colors.borderLight }
      ]}
    >
      <ThemedText type="label">{t("metrics.todaysSteps.title")}</ThemedText>
      <ThemedText type="title2">{typeof steps === 'number' ? steps.toLocaleString() : '—'}</ThemedText>
    </View>
  );
}