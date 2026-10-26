import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { WeeklyWeightedTrainingMinutesMetric } from './WeeklyWeightedTrainingMinutesMetric';

export function WeeklyTrainingCard() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Card title={t('areas:cardioFitness.thisWeeksTraining')}>
      <WeeklyWeightedTrainingMinutesMetric />
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
        {t('metrics:weightedTrainingMinutes.weeklyExplanation')}
      </ThemedText>
    </Card>
  );
}
