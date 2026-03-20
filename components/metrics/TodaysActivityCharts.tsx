import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { metrics } from '@/locales/metrics';

import { IntensityMinutesMetric } from './IntensityMinutesMetric';
import { StepsMetric } from './StepsMetric';
import { TotalActivityMetric } from './TotalActivityMetric';
import { RegisterMetricSheetPortal, useRegisterMetricSheet } from './useRegisterMetricSheet';

// Vilka metrik-nycklar som ska visas
export type ActivityMetricKey = 'active_minutes' | 'steps' | 'intensity_minutes';

export function TodaysActivityCharts() {
  const { getMetricHistory, addMetricEntry } = useStorage();
  // TODO: Replace with real activityData from wearables or context if available
  const activityData = undefined;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = React.useState<ActivityMetricKey>('active_minutes');
  const selectedMetricDefinition = metrics[selectedMetric];
  const registerSheet = useRegisterMetricSheet();

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

  const saveManualMetric = React.useCallback(() => {
    if (!registerSheet.metricValue) return;
    const parsedValue = Number.parseFloat(registerSheet.metricValue);
    if (Number.isNaN(parsedValue)) return;
    addMetricEntry({
      metricId: selectedMetric,
      value: parsedValue,
      unit: registerSheet.metricUnit || selectedMetricDefinition?.canonicalUnit || '',
      recordedAt: registerSheet.recordedAt.toISOString(),
      notes: registerSheet.metricNotes || undefined,
    });
    registerSheet.close();
  }, [addMetricEntry, registerSheet, selectedMetric, selectedMetricDefinition?.canonicalUnit]);

  return (
    <Card title={t('todaysActivityCharts.title')}>
      {/* Metric selection UI */}
      <View style={globalStyles.row}>
        <TotalActivityMetric activityData={activityData} showDivider onPress={() => setSelectedMetric('active_minutes')} isSelected={selectedMetric === 'active_minutes'} />
        <StepsMetric activityData={activityData} showDivider onPress={() => setSelectedMetric('steps')} isSelected={selectedMetric === 'steps'} />
        <IntensityMinutesMetric activityData={activityData} onPress={() => setSelectedMetric('intensity_minutes')} isSelected={selectedMetric === 'intensity_minutes'} />
      </View>
      <MetricTrendChart
        data={selectedMetricConfig.data}
        metricName={selectedMetricConfig.metricName}
        unit={selectedMetricConfig.unit || undefined}
        accentColor={selectedMetricConfig.accentColor}
        onAddManualValue={registerSheet.open}
      />
      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}> 
        {t(`todaysActivityCharts.explainers.${selectedMetric}`, {
          defaultValue: t('todaysActivityCharts.explainer'),
        })}
      </ThemedText>
      <RegisterMetricSheetPortal
        bottomSheetRef={registerSheet.registerBottomSheetRef}
        isVisible={registerSheet.isVisible}
        metricId={selectedMetric}
        metricName={selectedMetricConfig.metricName}
        metricValue={registerSheet.metricValue}
        setMetricValue={registerSheet.setMetricValue}
        metricUnit={registerSheet.metricUnit}
        setMetricUnit={registerSheet.setMetricUnit}
        metricNotes={registerSheet.metricNotes}
        setMetricNotes={registerSheet.setMetricNotes}
        recordedAt={registerSheet.recordedAt}
        setRecordedAt={registerSheet.setRecordedAt}
        colors={colors}
        units={selectedMetricDefinition?.units}
        onSave={saveManualMetric}
        onClose={registerSheet.close}
      />
    </Card>
  );
}
