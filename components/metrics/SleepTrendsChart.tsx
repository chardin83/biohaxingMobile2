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
import { SleepConsistencyLabel } from '@/components/metrics/SleepConsistencyLabel';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { MetricId } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';

import { Card } from '../ui/Card';
import { IntenseExerciseBeforeSleepMetric } from './IntenseExerciseBeforeSleep';

export const SLEEP_TREND_METRIC_KEYS = [
  'sleep_duration',
  'deep_sleep',
  'rem_sleep',
  'sleep_bedtime',
  'intense_exercise_before_sleep',
] as const satisfies readonly MetricId[];

export type SleepTrendMetricKey = (typeof SLEEP_TREND_METRIC_KEYS)[number];

const MINUTES_PER_DAY = 1440;
const MIDDAY_MINUTES = 12 * 60;

function normalizeBedtimeForChart(value: number) {
  const normalized = ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return normalized < MIDDAY_MINUTES ? normalized + MINUTES_PER_DAY : normalized;
}

function formatBedtimeChartValue(chartValue: number) {
  const normalized = ((Math.round(chartValue) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function getTrendData(metricId: SleepTrendMetricKey, history: ReturnType<ReturnType<typeof useStorage>['getMetricHistory']>): MetricTrendPoint[] {
  switch (metricId) {
    case 'sleep_duration':
      return buildTrendData(history, (value, unit) => (unit === 'hours' ? Math.round(value * 60) : Math.round(value)));
    case 'sleep_bedtime':
      return buildTrendData(history, normalizeBedtimeForChart);
    default:
      return buildTrendData(history);
  }
}

export function SleepTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedTrendMetric, setSelectedTrendMetric] = React.useState<SleepTrendMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const metricHistory = React.useMemo(
    () =>
      Object.fromEntries(SLEEP_TREND_METRIC_KEYS.map(metricId => [metricId, getMetricHistory(metricId)])) as Record<
        SleepTrendMetricKey,
        ReturnType<typeof getMetricHistory>
      >,
    [getMetricHistory]
  );

  const trendData = React.useMemo(
    () =>
      Object.fromEntries(SLEEP_TREND_METRIC_KEYS.map(metricId => [metricId, getTrendData(metricId, metricHistory[metricId])])) as Record<
        SleepTrendMetricKey,
        MetricTrendPoint[]
      >,
    [metricHistory]
  );

  const toggleMetric = React.useCallback((metric: SleepTrendMetricKey) => {
    setSelectedTrendMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const selectedTrendConfig = React.useMemo(() => {
    if (!selectedTrendMetric) {
      return null;
    }

    switch (selectedTrendMetric) {
      case 'deep_sleep':
        return {
          metricName: t('metrics:deep_sleep.name'),
          unit: 'min',
          data: trendData.deep_sleep,
          accentColor: colors.chart.deepSleep,
        };
      case 'rem_sleep':
        return {
          metricName: t('metrics:rem_sleep.name'),
          unit: 'min',
          data: trendData.rem_sleep,
          accentColor: colors.chart.remSleep,
        };
      case 'sleep_bedtime':
        return {
          metricName: t('metrics:sleep_bedtime.name'),
          unit: undefined,
          valueFormatter: formatBedtimeChartValue,
          data: trendData.sleep_bedtime,
          accentColor: colors.chart.sleepBedtime,
        };
      case 'intense_exercise_before_sleep':
        return {
          metricName: t('metrics:intense_exercise_before_sleep.name'),
          unit: 'min',
          data: trendData.intense_exercise_before_sleep,
          accentColor: colors.chart.intenseExerciseBeforeSleep,
        };
      case 'sleep_duration':
      default:
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: trendData.sleep_duration,
          accentColor: colors.chart.sleepDuration,
        };
    }
  }, [colors.chart, selectedTrendMetric, t, trendData]);

  return (
    <Card title={t('sleepTrendChart.title')}>
      <View style={styles.trendMetricRow}>
        <SleepMetric showDivider onPress={() => toggleMetric('sleep_duration')} isSelected={selectedTrendMetric === 'sleep_duration'} />
        <DeepSleepMetric showDivider onPress={() => toggleMetric('deep_sleep')} isSelected={selectedTrendMetric === 'deep_sleep'} />
        <RemSleepMetric onPress={() => toggleMetric('rem_sleep')} isSelected={selectedTrendMetric === 'rem_sleep'} />
      </View>
      <View style={globalStyles.row}>
        <SleepConsistencyLabel showDivider />
        <View style={globalStyles.col}>
          <SleepConsistencyMetric onPress={() => toggleMetric('sleep_bedtime')} isSelected={selectedTrendMetric === 'sleep_bedtime'} showDivider />
        </View>
        <IntenseExerciseBeforeSleepMetric
          onPress={() => toggleMetric('intense_exercise_before_sleep')}
          isSelected={selectedTrendMetric === 'intense_exercise_before_sleep'}
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
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
        {selectedTrendMetric
          ? t(`sleepTrendChart.explainers.${selectedTrendMetric}`, {
              defaultValue: t('sleepTrendChart.explainer'),
            })
          : t('sleepTrendChart.explainer')}
      </ThemedText>
      <MetricValuesBottomSheet bottomSheetRef={metricValuesBottomSheetRef} metricId={selectedTrendMetric} metricName={selectedTrendConfig?.metricName} />
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
