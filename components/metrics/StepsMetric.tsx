import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface StepsMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function StepsMetric({ showDivider = false, onPress, isSelected }: Readonly<StepsMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const stepsFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('steps')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);
    return latestEntry?.value ?? null;
  }, [getMetricHistory]);

  const steps = stepsFromStorage;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.chart?.mindSteps || colors.primary : 'transparent'}
    >
      <ThemedText type="label">{t("metrics:todaysSteps.name")}</ThemedText>
       <View style={globalStyles.metricValueContainer}>
          <ThemedText type="title2">{typeof steps === 'number' ? Math.round(steps).toLocaleString() : '—'}</ThemedText>
       </View>
    </MetricContainer>
  );
}

// No styles needed