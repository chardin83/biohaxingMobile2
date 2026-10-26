import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { WeeklyWeightedTrainingMinutesMetric } from './WeeklyWeightedTrainingMinutesMetric';

export function WeeklyTrainingCard() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showExplanation, setShowExplanation] = React.useState(false);

  return (
    <Card title={t('areas:cardioFitness.thisWeeksTraining')}>
      <View style={globalStyles.row}>
        <WeeklyWeightedTrainingMinutesMetric onPress={() => setShowExplanation(current => !current)} isSelected={showExplanation} />
      </View>
      {showExplanation && (
        <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
          {t('metrics:weightedTrainingMinutes.weeklyExplanation')}
        </ThemedText>
      )}
    </Card>
  );
}
