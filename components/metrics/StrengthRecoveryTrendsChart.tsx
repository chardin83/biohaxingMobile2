import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useHRVTrendSelector } from '@/hooks/useHRVTrendSelector';
import { buildHRVDailyTrend } from '@/utils/hrvHistory';
import { buildTrendData } from '@/utils/metrics';

import { HRVMetric } from './HRVMetric';
import { MetricTrendChart } from './MetricTrendChart';
import { SleepConsistencyMetric } from './SleepConsistencyMetric';
import { SleepMetric } from './SleepMetric';

type StrengthRecoveryMetricKey = 'sleep_duration' | 'sleep_bedtime' | 'hrv_rmssd' | 'hrv_sdnn';

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

export function StrengthRecoveryTrendsChart() {
  const hrvTrend = useHRVTrendSelector();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<StrengthRecoveryMetricKey | null>(null);
  const isHRVSelected = selectedMetric === 'hrv_rmssd' || selectedMetric === 'hrv_sdnn';
  const toggleHRV = () => {
    setSelectedMetric(isHRVSelected ? null : hrvTrend.metricId);
  };
  const hrvSelector = {
    ...hrvTrend.seriesSelector,
    onChange: (value: string) => {
      if (value !== 'hrv_rmssd' && value !== 'hrv_sdnn') return;
      hrvTrend.seriesSelector.onChange(value);
      setSelectedMetric(value);
    },
  };
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
  const hrvTrendData = React.useMemo(() => selectedMetric === 'hrv_rmssd' || selectedMetric === 'hrv_sdnn' ? buildHRVDailyTrend(getMetricHistory(selectedMetric)) : [], [getMetricHistory, selectedMetric]);

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
          explainer: t('areas:strength.recoveryFactors.explainers.sleep_bedtime'),
        };
      case 'hrv_rmssd':
      case 'hrv_sdnn':
        return {
          metricName: t(`metrics:${selectedMetric}.name`),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
          explainer: t('areas:strength.recoveryFactors.explainers.hrv'),
        };
      case 'sleep_duration':
      default:
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: sleepDurationTrendData,
          accentColor: colors.chart.sleepDuration,
          explainer: t('areas:strength.recoveryFactors.explainers.sleep_duration'),
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
    <Card title={t('areas:strength.recoveryFactors.title')}>
      <View style={globalStyles.row}>
        <SleepMetric showDivider onPress={() => toggleMetric('sleep_duration')} isSelected={selectedMetric === 'sleep_duration'} />
        <SleepConsistencyMetric showDivider onPress={() => toggleMetric('sleep_bedtime')} isSelected={selectedMetric === 'sleep_bedtime'} />
        <HRVMetric showDivider={false} onPress={toggleHRV} isSelected={isHRVSelected} />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          seriesSelector={isHRVSelected ? hrvSelector : undefined}
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
          {selectedConfig?.explainer ?? t('areas:strength.recoveryFactors.explainer')}
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
