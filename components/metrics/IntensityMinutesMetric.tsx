import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { DailyActivity } from '@/wearables/types';

interface IntensityMinutesMetricProps {
  activityData: DailyActivity[];
  showDivider?: boolean;
}

export function IntensityMinutesMetric({ activityData, showDivider = false }: Readonly<IntensityMinutesMetricProps>) {
  const { t } = useTranslation();

  const today = activityData[0];
  const intensityMinutes = today?.intensityMinutes;

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider],
      ]}
    >
      <ThemedText type="label">{t("metrics.intensityMinutes.title")}</ThemedText>
      <ThemedText type="title2">{typeof intensityMinutes === 'number' ? intensityMinutes : '—'}</ThemedText>
    </View>
  );
}