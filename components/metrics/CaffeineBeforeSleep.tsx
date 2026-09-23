import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { MetricDataStatus } from '@/components/metrics/MetricDataStatus';
import { ThemedText } from '@/components/ThemedText';
import { CaffeineBeforeSleepStatus } from '@/types/metricStatuses';
import { getLatestMetricEntry } from '@/utils/metricDateUtils';
import {} from '@/wearables/types';

import { MetricContainer } from './MetricContainer';
import { MetricStatusLabel } from './MetricStatusLabel';

interface CaffeineBeforeSleepMetricProps {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

function getCaffeineBeforeSleepStatus(minutes?: number): CaffeineBeforeSleepStatus {
  if (minutes == null) {
    return 'unknown';
  }
  if (minutes < 360) {
    return 'tooCloseToBedtime';
  }
  if (minutes < 480) {
    return 'closeToBedtime';
  }
  return 'optimal';
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} min`;
}

export function CaffeineBeforeSleepMetric({ showDivider = false, onPress, isSelected = false }: Readonly<CaffeineBeforeSleepMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const entry = React.useMemo(() => getLatestMetricEntry(getMetricHistory('caffeine_before_sleep')), [getMetricHistory]);
  const status = getCaffeineBeforeSleepStatus(entry?.value);
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <View style={styles.contentContainer}>
        <ThemedText type="label" numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
          {t('metrics:caffeine_before_sleep.shortName')}
        </ThemedText>
        {entry?.value != null && (
          <>
            <MetricStatusLabel status={status} />
            <View style={styles.valueRow}>
              <ThemedText type="caption">{formatDuration(Math.abs(entry.value))}</ThemedText>
              <ThemedText type="caption" style={styles.description}>
                {t(entry.value < 0 ? 'metrics:caffeine_before_sleep.afterSleep' : 'metrics:caffeine_before_sleep.beforeSleep')}
              </ThemedText>
            </View>
          </>
        )}
        <MetricDataStatus recordedAt={entry?.recordedAt} hasPermission />
      </View>
    </MetricContainer>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
    },
    label: {
      flexShrink: 1,
      marginRight: 8,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'nowrap',
    },
    description: {
      marginLeft: 4,
      color: colors.textSecondary,
    },
  });
