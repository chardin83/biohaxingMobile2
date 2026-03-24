import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';

interface StressScoreMetricProps {
  readonly hrvData: HRVSummary[];
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

function getStressLevel(score: number, t: (key: string) => string): string {
  if (score < 30) return t('common.low');
  if (score < 70) return t('common.moderate');
  return t('common.high');
}

export function StressScoreMetric({ hrvData, showDivider = false, onPress, isSelected = false }: StressScoreMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');

  const hrv = hrvData.length > 0 ? calculateHRVMetrics(hrvData).hrv : null;
  const stressScore = hrv ? Math.max(0, Math.min(100, 100 - hrv)) : 50;
  const stressLevel = getStressLevel(stressScore, t);

  const content = (
    <>
      <ThemedText type="label">{t('stressScore.title')}</ThemedText>
      <ThemedText type="title2">{Math.round(stressScore)}</ThemedText>
      <ThemedText type="caption" style={{ color: colors.accentDefault }}>{stressLevel}</ThemedText>
    </>
  );

  const containerStyle = [
    globalStyles.col,
    showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }],
    isSelected && {
      backgroundColor: colors.overlayLight,
      borderColor: colors.accentStrong,
      borderWidth: 1,
      borderRadius: 16,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && !isSelected && { backgroundColor: colors.overlayLight },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={containerStyle}
    >
      {content}
    </View>
  );
}