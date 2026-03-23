import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { buildTrendData } from '@/utils/metrics';
import { SleepSummary } from '@/wearables/types';

import { HRVMetric } from './HRVMetric';
import { MetricTrendChart } from './MetricTrendChart';
import { SleepConsistencyMetric } from './SleepConsistencyMetric';
import { SleepMetric } from './SleepMetric';

type StrengthRecoveryMetricKey = 'sleep_duration' | 'sleep_bedtime' | 'hrv';

type StrengthRecoveryTrendsChartProps = {
  sleepData?: SleepSummary[];
};

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatTimeFromMinutes(value: number) {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function StrengthRecoveryTrendsChart({ sleepData }: Readonly<StrengthRecoveryTrendsChartProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<StrengthRecoveryMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const sleepDurationTrendData = React.useMemo(
    () =>
      buildTrendData(getMetricHistory('sleep_duration'), (value, unit) => {
        if (unit === 'hours') {
          return Math.round(value * 60);
        }
        return Math.round(value);
      }),
    [getMetricHistory]
  );
  const sleepBedtimeTrendData = React.useMemo(() => buildTrendData(getMetricHistory('sleep_bedtime')), [getMetricHistory]);
  const hrvTrendData = React.useMemo(() => buildTrendData(getMetricHistory('hrv')), [getMetricHistory]);

  const toggleMetric = React.useCallback((metric: StrengthRecoveryMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const selectedConfig = React.useMemo(() => {
    if (!selectedMetric) return null;

    switch (selectedMetric) {
      case 'sleep_bedtime':
        return {
          metricName: t('metrics:sleep_bedtime.name'),
          unit: undefined,
          valueFormatter: formatTimeFromMinutes,
          data: sleepBedtimeTrendData,
          accentColor: colors.chart.deepSleep,
          explainer: t('strengthOverview.recoveryFactors.explainers.sleep_bedtime'),
        };
      case 'hrv':
        return {
          metricName: t('metrics:hrv.name'),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
          explainer: t('strengthOverview.recoveryFactors.explainers.hrv'),
        };
      case 'sleep_duration':
      default:
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: sleepDurationTrendData,
          accentColor: colors.chart.sleepDuration,
          explainer: t('strengthOverview.recoveryFactors.explainers.sleep_duration'),
        };
    }
  }, [
    selectedMetric,
    t,
    sleepBedtimeTrendData,
    hrvTrendData,
    sleepDurationTrendData,
    colors.chart.deepSleep,
    colors.chart.hrv,
    colors.chart.sleepDuration,
  ]);

  return (
    <Card title={t('strengthOverview.recoveryFactors.title')}>
      <View style={globalStyles.row}>
        <SleepMetric
          showDivider
          onPress={() => toggleMetric('sleep_duration')}
          isSelected={selectedMetric === 'sleep_duration'}
        />
        <SleepConsistencyMetric
          sleepData={sleepData?.[0] ? { ...sleepData[0], targetBedtime: '' } : undefined}
          showDivider
          onPress={() => toggleMetric('sleep_bedtime')}
          isSelected={selectedMetric === 'sleep_bedtime'}
        />
        <HRVMetric
          showDivider={false}
          onPress={() => toggleMetric('hrv')}
          isSelected={selectedMetric === 'hrv'}
        />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit}
          valueFormatter={selectedConfig.valueFormatter}
          accentColor={selectedConfig.accentColor}
          onViewRegisteredValues={openMetricValuesTable}
        />
      )}

      <View style={globalStyles.infoSection}>
        <ThemedText type="explainer" style={[globalStyles.topBorder, { borderColor: colors.borderLight }]}> 
          {selectedConfig?.explainer ?? t('strengthOverview.recoveryFactors.explainer')}
        </ThemedText>
      </View>

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </Card>
  );
}
