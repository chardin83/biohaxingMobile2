import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface DeepSleepMetricProps {
  labelType?: 'label' | 'default';
  valueType?: 'title2' | 'title3';
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function DeepSleepMetric({
  labelType = 'label',
  valueType = 'title2',
  showDivider = false,
  onPress,
  isSelected = false,
}: Readonly<DeepSleepMetricProps>) {
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();

  const latestDeepSleep = React.useMemo(() => {
    const latestEntry = getMetricHistory('deep_sleep')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);

    if (!latestEntry) {
      return null;
    }

    return Math.round(latestEntry.value);
  }, [getMetricHistory]);

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.accentStrong : 'transparent'}
    >
        <ThemedText type={labelType}>{t('metrics:sleepStages.deepSleep.title')}</ThemedText>
        <ThemedText type={valueType}>{latestDeepSleep ?? '—'}</ThemedText>
        <ThemedText type="caption">{t('metrics:sleepStages.deepSleep.minutes')}</ThemedText>
    </MetricContainer>
  );
}