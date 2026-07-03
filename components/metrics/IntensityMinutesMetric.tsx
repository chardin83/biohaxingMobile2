import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { getUserProfile } from '@/app/context/userProfileEvents';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface IntensityMinutesMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function IntensityMinutesMetric({
  showDivider = false,
  onPress,
  isSelected,
}: Readonly<IntensityMinutesMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const [hasMaxHeartRate, setHasMaxHeartRate] = React.useState(true);

  React.useEffect(() => {
    getUserProfile().then(profile => {
      setHasMaxHeartRate(typeof profile.maxHeartRate === 'number');
    });
  }, []);


  const intensityFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('intensity_minutes')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);

    return latestEntry?.value ?? null;
  }, [getMetricHistory]);

  const intensityMinutes = intensityFromStorage;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={
        isSelected
          ? colors.chart?.mindIntensity || colors.primary
          : 'transparent'
      }
    >
      <ThemedText type="label">
        {t('metrics:intensityMinutes.shortName')}
      </ThemedText>

      <ThemedText type="title2">
        {typeof intensityMinutes === 'number'
          ? Math.round(intensityMinutes)
          : '—'}
      </ThemedText>

      {!hasMaxHeartRate && (
        <ThemedText type="caption" style={{ color: colors.notification }}>
          {t('metrics:intensityMinutes.missingMaxHeartRate')}
        </ThemedText>
      )}
    </MetricContainer>
  );
}