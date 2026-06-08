import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert,TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import HealthKitAdapter from '@/wearables/healthkitAdapter';

import { MetricContainer } from './MetricContainer';
import { getLatestEntryForToday } from './metricDateUtils';

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
  const { getMetricHistory, upsertMetricEntries, healthSyncEnabled, setErrorMessage } = useStorage();
  const { colors } = useTheme();

  const latestDeepSleep = React.useMemo(() => {
    const latestEntry = getLatestEntryForToday(getMetricHistory('deep_sleep'));

    if (!latestEntry) {
      return null;
    }

    return Math.round(latestEntry.value);
  }, [getMetricHistory]);

  const handleSyncFromHealth = React.useCallback(async () => {
    try {
      if (!healthSyncEnabled) {
        const msg = 'Health sync is disabled in settings';
        setErrorMessage?.(msg);
        Alert.alert('Health sync', msg);
        return;
      }
      const adapter = new HealthKitAdapter();
      const status = await adapter.getStatus();
      if (status.state === 'error') {
        const msg = `Health adapter error: ${status.message ?? 'unknown'}`;
        Alert.alert('Health sync unavailable', msg);
        return;
      }

      const range = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };
      const sleep = await adapter.getSleep(range);

      const entries = sleep
        .filter(s => typeof s.durationMinutes === 'number')
        .map(s => ({
          metricId: 'deep_sleep' as const,
          value: s.stages?.deepMinutes ?? 0,
          unit: 'min' as const,
          // Use the sample endTime (wake time) if available so the metric is recorded
          // on the waking date. Fall back to startTime or midnight of the summary date.
          recordedAt: s.endTime ?? s.startTime ?? `${s.date}T00:00:00.000Z`,
          notes: 'healthkit_sync',
        }));

      // Small debug output to inspect what's being imported (can be removed later)
       
      console.debug('[DeepSleepMetric] imported entries preview', entries.slice(0, 5));

      if (entries.length > 0) {
        upsertMetricEntries(entries as any);
        Alert.alert('Sync complete', `Imported ${entries.length} entries from Health`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sync failed', message);
    }
  }, [upsertMetricEntries, healthSyncEnabled, setErrorMessage]);

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
        <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={handleSyncFromHealth}
              accessibilityLabel="Sync from Health"
              accessibilityRole="button"
              testID="deepSleepSyncButton"
            >
              <ThemedText type="label">{t('metrics:sleepStages.deepSleep.syncFromHealth')}</ThemedText>
            </TouchableOpacity>
        </View>
    </MetricContainer>
  );
}