import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricContainer } from './MetricContainer';
import { getLatestMetricEntry } from './metricDateUtils';

interface StepsMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function StepsMetric({ showDivider = false, onPress, isSelected = false }: StepsMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const stepsData = getMetricHistory('steps');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.steps)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(stepsData), [stepsData]);

  const steps = latest?.value;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.chart?.mindSteps || colors.primary : 'transparent'}
    >
      <ThemedText type="label">{t('metrics:todaysSteps.name')}</ThemedText>
      {steps !== undefined && (
        <View style={globalStyles.metricValueContainer}>
          <ThemedText type="title2">{Math.round(steps).toLocaleString()}</ThemedText>
        </View>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
    </MetricContainer>
  );
}
