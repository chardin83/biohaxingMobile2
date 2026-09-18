import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricContainer } from './MetricContainer';
import { getLatestMetricEntry } from './metricDateUtils';

interface DeepSleepMetricProps {
  readonly labelType?: 'label' | 'default';
  readonly valueType?: 'title2' | 'title3';
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function DeepSleepMetric({ labelType = 'label', valueType = 'title2', showDivider = false, onPress, isSelected = false }: DeepSleepMetricProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const deepSleepData = getMetricHistory('deep_sleep');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.sleep)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(deepSleepData), [deepSleepData]);
  const deepSleep = latest?.value;

  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <ThemedText type={labelType}>{t('metrics:sleepStages.deepSleep.title')}</ThemedText>
      {deepSleep !== undefined && (
        <>
          <ThemedText type={valueType}>{Math.round(deepSleep)}</ThemedText>
          <ThemedText type="caption">{t('metrics:sleepStages.deepSleep.minutes')}</ThemedText>
        </>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
    </MetricContainer>
  );
}
