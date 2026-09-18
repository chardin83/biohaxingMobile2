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
import { DEFAULT_TARGET_BEDTIME_MINUTES, getBedtimeDeviation, minutesToTimeString } from './sleepConsistency';

interface SleepConsistencyMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function SleepConsistencyMetric({ showDivider = false, onPress, isSelected = false }: SleepConsistencyMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);
  const bedtimeData = getMetricHistory('sleep_bedtime');

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.sleep)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestMetricEntry(bedtimeData), [bedtimeData]);
  const actualMinutes = typeof latest?.value === 'number' ? latest.value : undefined;
  const startTime = actualMinutes !== undefined ? minutesToTimeString(actualMinutes) : undefined;
  const nightlyDeviation = actualMinutes !== undefined ? getBedtimeDeviation(DEFAULT_TARGET_BEDTIME_MINUTES, actualMinutes) : undefined;
  const isPerfect = nightlyDeviation?.isPerfect === true;
  const isGood = nightlyDeviation?.isGood === true;

  let accentColor = colors.warmColor;

  if (isPerfect) {
    accentColor = colors.accentStrong;
  } else if (isGood) {
    accentColor = colors.goldSoft;
  }

  let differenceLabel: string | undefined;

  if (isPerfect) {
    differenceLabel = t('sleep_bedtime.perfect');
  } else if (nightlyDeviation) {
    differenceLabel = t('sleep_bedtime.bedtimeDifference', {
      minutes: Math.abs(Math.round(nightlyDeviation.differenceMinutes)),
      direction: nightlyDeviation.direction === 'earlier' ? t('sleep_bedtime.earlier') : t('sleep_bedtime.late'),
    });
  }

  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <ThemedText type="label">{t('sleep_bedtime.name')}</ThemedText>
      {startTime !== undefined && (
        <View style={globalStyles.metricValueContainer}>
          <ThemedText type="title2">{startTime}</ThemedText>
        </View>
      )}
      <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
      {differenceLabel !== undefined && (
        <ThemedText type="explainer" style={{ color: accentColor }}>
          {differenceLabel}
        </ThemedText>
      )}
    </MetricContainer>
  );
}
