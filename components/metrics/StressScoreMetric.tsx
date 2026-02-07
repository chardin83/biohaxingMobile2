import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';

interface StressScoreMetricProps {
  readonly hrvData: HRVSummary[];
  readonly showDivider?: boolean;
}

function getStressLevel(score: number, t: (key: string) => string): string {
  if (score < 30) return t('metrics.low');
  if (score < 70) return t('metrics.moderate');
  return t('metrics.high');
}

export function StressScoreMetric({ hrvData, showDivider = false }: StressScoreMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const hrv = hrvData.length > 0 ? calculateHRVMetrics(hrvData).hrv : null;
  const stressScore = hrv ? Math.max(0, Math.min(100, 100 - hrv)) : 50;
  const stressLevel = getStressLevel(stressScore, t);

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]
      ]}
    >
      <ThemedText type="label">{t("metrics.stressScore.title")}</ThemedText>
      <ThemedText type="title2">{Math.round(stressScore)}</ThemedText>
      <ThemedText type="caption" style={{ color: colors.accentDefault }}>{stressLevel}</ThemedText>
    </View>
  );
}