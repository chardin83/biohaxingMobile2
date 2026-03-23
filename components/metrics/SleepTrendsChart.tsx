import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { DeepSleepMetric } from '@/components/metrics/DeepSleepMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { RemSleepMetric } from '@/components/metrics/RemSleepMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { MetricValuesBottomSheet } from '@/components/sections/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { buildTrendData } from '@/utils/metrics';

import { Card } from '../ui/Card';

export type SleepTrendMetricKey = 'sleep_duration' | 'deep_sleep' | 'rem_sleep';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function SleepTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedTrendMetric, setSelectedTrendMetric] = React.useState<SleepTrendMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: SleepTrendMetricKey) => {
    setSelectedTrendMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const sleepDurationTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(
      getMetricHistory('sleep_duration'),
      (value, unit) => {
        if (unit === 'hours') {
          return Math.round(value * 60);
        }
        return Math.round(value);
      }
    );
  }, [getMetricHistory]);

  const deepSleepTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('deep_sleep'));
  }, [getMetricHistory]);

  const remSleepTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('rem_sleep'));
  }, [getMetricHistory]);

  const selectedTrendConfig = React.useMemo(() => {
    if (!selectedTrendMetric) {
      return null;
    }

    switch (selectedTrendMetric) {
      case 'deep_sleep':
        return {
          metricName: t('metrics:deep_sleep.name'),
          unit: 'min',
          data: deepSleepTrendData,
          accentColor: colors.chart.deepSleep,
        };
      case 'rem_sleep':
        return {
          metricName: t('metrics:rem_sleep.name'),
          unit: 'min',
          data: remSleepTrendData,
          accentColor: colors.chart.remSleep,
        };
      case 'sleep_duration':
      default:
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: sleepDurationTrendData,
          accentColor: colors.chart.sleepDuration,
        };
    }
  }, [colors.chart.deepSleep, colors.chart.remSleep, colors.chart.sleepDuration, deepSleepTrendData, remSleepTrendData, selectedTrendMetric, sleepDurationTrendData, t]);

  return (
     <Card title={t('sleepTrendChart.title')}>
      <View style={styles.trendMetricRow}>
        <SleepMetric
          showDivider={true}
          onPress={() => toggleMetric('sleep_duration')}
          isSelected={selectedTrendMetric === 'sleep_duration'}
        />
        <DeepSleepMetric
          showDivider={true}
          onPress={() => toggleMetric('deep_sleep')}
          isSelected={selectedTrendMetric === 'deep_sleep'}
        />
        <RemSleepMetric
          onPress={() => toggleMetric('rem_sleep')}
          isSelected={selectedTrendMetric === 'rem_sleep'}
        />
      </View>
      {selectedTrendConfig && (
        <MetricTrendChart
          data={selectedTrendConfig.data}
          metricName={selectedTrendConfig.metricName}
          unit={selectedTrendConfig.unit}
          valueFormatter={selectedTrendConfig.valueFormatter}
          accentColor={selectedTrendConfig.accentColor}
          onViewRegisteredValues={openMetricValuesTable}
        />
      )}
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }] }>
        {selectedTrendMetric
          ? t(`sleepTrendChart.explainers.${selectedTrendMetric}`, {
            defaultValue: t('sleepTrendChart.explainer'),
          })
          : t('sleepTrendChart.explainer')}
      </ThemedText>
      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedTrendMetric}
        metricName={selectedTrendConfig?.metricName}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  trendMetricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
});
