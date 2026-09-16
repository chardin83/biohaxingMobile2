import BottomSheet from '@gorhom/bottom-sheet';
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
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { MetricId } from '@/locales/metrics';

type ValidMetricId<T extends MetricId> = T;

type EnergyProductionMetricKey = ValidMetricId<'vo2_max' | 'resting_hr' | 'hrv'>;

export function EnergyProductionCharts() {
  const { getMetricHistory } = useStorage();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = React.useState<EnergyProductionMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: EnergyProductionMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const toTrendData = React.useCallback(
    (metricId: EnergyProductionMetricKey): MetricTrendPoint[] =>
      getMetricHistory(metricId)
        .map(entry => ({
          date: entry.recordedAt.slice(0, 10),
          value: entry.value,
        }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    [getMetricHistory]
  );

  const vo2MaxTrendData = React.useMemo(() => toTrendData('vo2_max'), [toTrendData]);

  const restingHRTrendData = React.useMemo(() => toTrendData('resting_hr'), [toTrendData]);

  const hrvTrendData = React.useMemo(() => toTrendData('hrv'), [toTrendData]);

  const selectedMetricConfig = React.useMemo(() => {
    if (!selectedMetric) {
      return null;
    }

    switch (selectedMetric) {
      case 'vo2_max':
        return {
          metricName: t('metrics:vo2_max.name'),
          unit: undefined,
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
        return {
          metricName: t('metrics:hrv.name'),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
        };
    }
  }, [selectedMetric, t, vo2MaxTrendData, restingHRTrendData, hrvTrendData, colors.chart.vo2Max, colors.chart.restingHr, colors.chart.hrv]);

  return (
    <>
      <Card title={t('energyProductionCharts.title')}>
        <View style={globalStyles.row}>
          <VO2MaxMetric showDivider onPress={() => toggleMetric('vo2_max')} isSelected={selectedMetric === 'vo2_max'} />
          <RestingHRMetric showDivider onPress={() => toggleMetric('resting_hr')} isSelected={selectedMetric === 'resting_hr'} />
          <HRVMetric onPress={() => toggleMetric('hrv')} isSelected={selectedMetric === 'hrv'} />
        </View>
        {selectedMetricConfig && (
          <MetricTrendChart
            data={selectedMetricConfig.data}
            metricName={selectedMetricConfig.metricName}
            unit={selectedMetricConfig.unit}
            accentColor={selectedMetricConfig.accentColor}
            onViewRegisteredValues={openMetricValuesTable}
          />
        )}
        <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
          {selectedMetric
            ? t(`energyProductionCharts.explainers.${selectedMetric}`, {
                defaultValue: t('energyProductionCharts.explainer'),
              })
            : t('energyProductionCharts.explainer')}
        </ThemedText>
      </Card>
      <MetricValuesBottomSheet bottomSheetRef={metricValuesBottomSheetRef} metricId={selectedMetric} metricName={selectedMetricConfig?.metricName} />
    </>
  );
}
