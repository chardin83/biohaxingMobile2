
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { metrics } from '@/locales/metrics';

import { RegisterMetricSheetPortal, useRegisterMetricSheet } from './useRegisterMetricSheet';

type EnergyProductionMetricKey = 'vo2_max' | 'resting_hr' | 'hrv';


export function EnergyProductionCharts() {
  const { getMetricHistory, addMetricEntry } = useStorage();
  const hrvData = useStoredHRVData();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = React.useState<EnergyProductionMetricKey>('vo2_max');
  const selectedMetricDefinition = metrics[selectedMetric];
  // RegisterMetricSheet state
  const registerSheet = useRegisterMetricSheet();

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

  const hrvTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return hrvData
      .filter(entry => typeof entry.rmssdMs === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.rmssdMs as number,
      }));
  }, [hrvData]);

  const restingHRTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return hrvData
      .filter(entry => typeof entry.avgRestingHrBpm === 'number')
      .map(entry => ({
        date: entry.date,
        value: entry.avgRestingHrBpm as number,
      }));
  }, [hrvData]);

  const vo2MaxTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return getMetricHistory('vo2_max')
      .map(entry => ({
        date: entry.recordedAt.slice(0, 10),
        value: entry.value,
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [getMetricHistory]);

  const selectedMetricConfig = React.useMemo(() => {
    switch (selectedMetric) {
      case 'vo2_max':
        return {
          metricName: t('metrics:vo2_max.name'),
          unit: '',
          data: vo2MaxTrendData,
          accentColor: colors.chart.vo2Max,
        };
      case 'resting_hr':
        return {
          metricName: t('metrics:resting_hr.name'),
          unit: 'bpm',
          data: restingHRTrendData,
          accentColor: colors.chart.restingHr,
        };
      case 'hrv':
      default:
        return {
          metricName: t('metrics:hrv.name'),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
        };
    }
  }, [colors.chart.hrv, colors.chart.restingHr, colors.chart.vo2Max, hrvTrendData, restingHRTrendData, selectedMetric, t, vo2MaxTrendData]);

  return (
    <>
      <Card title={t('energyProductionCharts.title')}>
        <View style={globalStyles.row}>
          <VO2MaxMetric
            showDivider
            onPress={() => setSelectedMetric('vo2_max')}
            isSelected={selectedMetric === 'vo2_max'}
          />
          <RestingHRMetric
            hrvData={hrvData}
            showDivider
            onPress={() => setSelectedMetric('resting_hr')}
            isSelected={selectedMetric === 'resting_hr'}
          />
          <HRVMetric
            hrvData={hrvData}
            onPress={() => setSelectedMetric('hrv')}
            isSelected={selectedMetric === 'hrv'}
          />
        </View>
        <MetricTrendChart
          data={selectedMetricConfig.data}
          metricName={selectedMetricConfig.metricName}
          unit={selectedMetricConfig.unit || undefined}
          accentColor={selectedMetricConfig.accentColor}
          onAddManualValue={registerSheet.open}
        />
        <ThemedText type="explainer" style ={[globalStyles.explainer, { borderColor: colors.borderLight }]}> 
          {t(`energyProductionCharts.explainers.${selectedMetric}`, {
            defaultValue: t('energyProductionCharts.explainer'),
          })}
        </ThemedText>
      </Card>
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
    </>
  );
}
