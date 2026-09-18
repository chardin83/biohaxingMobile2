import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricContainer } from './MetricContainer';
import { getLatestEntryForToday } from './metricDateUtils';

interface TodaysIntensityMinutesMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function TodaysIntensityMinutesMetric({ showDivider = false, onPress, isSelected = false }: TodaysIntensityMinutesMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory, userProfile } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);

  React.useEffect(() => {
    Promise.all([adapter.hasPermission(WearablePermission.workout), adapter.hasPermission(WearablePermission.heartRate)])
      .then(([hasWorkoutPermission, hasHeartRatePermission]) => {
        setHasPermission(hasWorkoutPermission && hasHeartRatePermission);
      })
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestEntryForToday(getMetricHistory('intensity_minutes')), [getMetricHistory]);

  const intensityMinutes = latest?.value;
  const hasMaxHeartRate = typeof userProfile.maxHeartRate === 'number';

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.chart?.mindIntensity || colors.primary : 'transparent'}
    >
      <ThemedText type="label">{t('metrics:intensityMinutes.shortName')}</ThemedText>
      {intensityMinutes !== undefined && <ThemedText type="title2">{Math.round(intensityMinutes)}</ThemedText>}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
      {!hasMaxHeartRate && (
        <ThemedText type="caption" style={{ color: colors.notification }}>
          {t('metrics:intensityMinutes.missingMaxHeartRate')}
        </ThemedText>
      )}
    </MetricContainer>
  );
}
