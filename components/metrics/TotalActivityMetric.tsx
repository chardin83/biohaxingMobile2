import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { WearablePermission } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

import { MetricContainer } from './MetricContainer';
import { getLatestEntryForToday } from './metricDateUtils';

interface TotalActivityMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function TotalActivityMetric({ showDivider = false, onPress, isSelected = false }: TotalActivityMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const { adapter } = useWearable();
  const [hasPermission, setHasPermission] = React.useState(true);

  React.useEffect(() => {
    adapter
      .hasPermission(WearablePermission.workout)
      .then(setHasPermission)
      .catch(() => setHasPermission(false));
  }, [adapter]);

  const latest = React.useMemo(() => getLatestEntryForToday(getMetricHistory('active_minutes')), [getMetricHistory]);

  const activeMinutes = latest?.value;

  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.primary : 'transparent'}>
      <View style={styles.contentContainer}>
        <ThemedText type="label">{t('metrics:activeMinutes.shortName')}</ThemedText>
        {activeMinutes !== undefined && <ThemedText type="title2">{Math.round(activeMinutes)}</ThemedText>}
        <MetricDataStatus recordedAt={latest?.recordedAt} hasPermission={hasPermission} />
      </View>
    </MetricContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    //flex: 1,
  },
});
