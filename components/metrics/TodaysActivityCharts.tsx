import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { IntensityMinutesMetric } from './IntensityMinutesMetric';
import { StepsMetric } from './StepsMetric';
import { TotalActivityMetric } from './TotalActivityMetric';

// Vilka metrik-nycklar som ska visas
export type ActivityMetricKey = 'active_minutes' | 'steps' | 'intensity_minutes';

export function TodaysActivityCharts() {
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = React.useState<ActivityMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

   const toggleMetric = React.useCallback((metric: ActivityMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);
  // Trenddata för varje metrik
  const activeMinutesTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return getMetricHistory('active_minutes').map(entry => ({
      date: entry.recordedAt.slice(0, 10),
      value: entry.value,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [getMetricHistory]);

  const stepsTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return getMetricHistory('steps').map(entry => ({
      date: entry.recordedAt.slice(0, 10),
      value: entry.value,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [getMetricHistory]);

  const intensityMinutesTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return getMetricHistory('intensity_minutes').map(entry => ({
      date: entry.recordedAt.slice(0, 10),
      value: entry.value,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [getMetricHistory]);

  const selectedMetricConfig = React.useMemo(() => {
    if (!selectedMetric) {
      return null;
    }

    switch (selectedMetric) {
      case 'steps':
        return {
          metricName: t('metrics:todaysSteps.name'),
          unit: '',
          data: stepsTrendData,
          accentColor: colors.chart.steps,
        };
      case 'intensity_minutes':
        return {
          metricName: t('metrics:intensityMinutes.name'),
          unit: '',
          data: intensityMinutesTrendData,
          accentColor: colors.chart.intensityMinutes,
        };
      case 'active_minutes':
      default:
        return {
          metricName: t('metrics:activeMinutes.name'),
          unit: '',
          data: activeMinutesTrendData,
          accentColor: colors.chart.activeMinutes,
        };
    }
  }, [selectedMetric, t, activeMinutesTrendData, stepsTrendData, intensityMinutesTrendData, colors.chart]);

  return (
    <Card title={t('todaysActivityCharts.title')}>
      {/* Metric selection UI */}
      <View style={globalStyles.row}>
        <TotalActivityMetric showDivider onPress={() => toggleMetric('active_minutes')} isSelected={selectedMetric === 'active_minutes'} />
        <StepsMetric showDivider onPress={() => toggleMetric('steps')} isSelected={selectedMetric === 'steps'} />
        <IntensityMinutesMetric onPress={() => toggleMetric('intensity_minutes')} isSelected={selectedMetric === 'intensity_minutes'} />
      </View>
      {selectedMetricConfig && (
        <MetricTrendChart
          data={selectedMetricConfig.data}
          metricName={selectedMetricConfig.metricName}
          unit={selectedMetricConfig.unit || undefined}
          accentColor={selectedMetricConfig.accentColor}
          onViewRegisteredValues={openMetricValuesTable}
        />
      )}
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}> 
        {selectedMetric
          ? t(`todaysActivityCharts.explainers.${selectedMetric}`, {
              defaultValue: t('todaysActivityCharts.explainer'),
            })
          : t('todaysActivityCharts.explainer')}
      </ThemedText>
      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedMetricConfig?.metricName}
      />
    </Card>
  );
}
