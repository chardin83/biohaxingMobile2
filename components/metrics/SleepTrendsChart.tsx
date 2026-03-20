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
import { ThemedText } from '@/components/ThemedText';
import { metrics } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';

import { Card } from '../ui/Card';
import { RegisterMetricSheetPortal,useRegisterMetricSheet } from './useRegisterMetricSheet';

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
  const [selectedTrendMetric, setSelectedTrendMetric] = React.useState<SleepTrendMetricKey>('sleep_duration');
  const selectedTrendMetricDefinition = metrics[selectedTrendMetric];

  // RegisterMetricSheet state
  const registerSheet = useRegisterMetricSheet();

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
          onPress={() => setSelectedTrendMetric('sleep_duration')}
          isSelected={selectedTrendMetric === 'sleep_duration'}
        />
        <DeepSleepMetric
          showDivider={true}
          onPress={() => setSelectedTrendMetric('deep_sleep')}
          isSelected={selectedTrendMetric === 'deep_sleep'}
        />
        <RemSleepMetric
          onPress={() => setSelectedTrendMetric('rem_sleep')}
          isSelected={selectedTrendMetric === 'rem_sleep'}
        />
      </View>
      <MetricTrendChart
        data={selectedTrendConfig.data}
        metricName={selectedTrendConfig.metricName}
        unit={selectedTrendConfig.unit}
        valueFormatter={selectedTrendConfig.valueFormatter}
        accentColor={selectedTrendConfig.accentColor}
        onAddManualValue={registerSheet.open}
      />
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }] }>
        {t(`sleepTrendChart.explainers.${selectedTrendMetric}`)}
      </ThemedText>
      <RegisterMetricSheetPortal
        bottomSheetRef={registerSheet.registerBottomSheetRef}
        isVisible={registerSheet.isVisible}
        metricId={selectedTrendMetric}
        metricName={t(`metrics:${selectedTrendMetricDefinition?.nameKey}`)}
        metricValue={registerSheet.metricValue}
        setMetricValue={registerSheet.setMetricValue}
        metricUnit={registerSheet.metricUnit}
        setMetricUnit={registerSheet.setMetricUnit}
        metricNotes={registerSheet.metricNotes}
        setMetricNotes={registerSheet.setMetricNotes}
        recordedAt={registerSheet.recordedAt}
        setRecordedAt={registerSheet.setRecordedAt}
        colors={colors}
        units={selectedTrendMetricDefinition?.units?.map(u => u.unit)}
        onSave={() => {
          // TODO: implement save logic for manual metric entry
          registerSheet.close();
        }}
        onClose={registerSheet.close}
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
