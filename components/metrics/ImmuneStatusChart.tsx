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
import { buildHRVDailyTrend, getHRVHistory } from '@/utils/hrvHistory';
import { buildTrendData } from '@/utils/metrics';

import { DeepSleepMetric } from './DeepSleepMetric';
import { HRVMetric } from './HRVMetric';
import { MetricTrendChart, type MetricTrendPoint } from './MetricTrendChart';
import { RecoveryStatusMetric } from './RecoveryStatusMetric';
import { RecoveryTrendChart } from './RecoveryTrendChart';
import { RestingHRMetric } from './RestingHRMetric';
import { SleepMetric } from './SleepMetric';

type ImmuneTrendMetricKey = 'sleep_duration' | 'deep_sleep' | 'resting_hr' | 'hrv';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function ImmuneStatusChart() {
  const [recoverySelected, setRecoverySelected] = React.useState(false);
  const hrvTrend = useHRVTrendSelector();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<ImmuneTrendMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: ImmuneTrendMetricKey) => {
    setRecoverySelected(false);
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const sleepDurationTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('sleep_duration'), (value, unit) => {
      if (unit === 'hours') {
        return Math.round(value * 60);
      }
      return Math.round(value);
    });
  }, [getMetricHistory]);

  const deepSleepTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('deep_sleep'));
  }, [getMetricHistory]);

  const restingHrTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('resting_hr'));
  }, [getMetricHistory]);

  const hrvTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildHRVDailyTrend(getHRVHistory(getMetricHistory).entries);
  }, [getMetricHistory]);

  const selectedConfig = React.useMemo(() => {
    if (!selectedMetric) {
      return null;
    }

    switch (selectedMetric) {
      case 'sleep_duration':
        return {
          metricName: t('metrics:sleep_duration.name'),
          unit: undefined,
          valueFormatter: formatSleepDuration,
          data: sleepDurationTrendData,
          accentColor: colors.chart.sleepDuration,
        };
      case 'deep_sleep':
        return {
          metricName: t('metrics:deep_sleep.name'),
          unit: 'min',
          data: deepSleepTrendData,
          accentColor: colors.chart.deepSleep,
        };
      case 'resting_hr':
        return {
          metricName: t('metrics:resting_hr.shortName', { defaultValue: t('metrics:resting_hr.name') }),
          unit: 'bpm',
          data: restingHrTrendData,
          accentColor: colors.chart.restingHr,
        };
      case 'hrv':
      default:
        return {
          metricName: t(`metrics:${getHRVHistory(getMetricHistory).metricId}.shortName`),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
        };
    }
  }, [
    colors.chart.deepSleep,
    colors.chart.hrv,
    colors.chart.restingHr,
    colors.chart.sleepDuration,
    deepSleepTrendData,
    hrvTrendData,
    getMetricHistory,
    restingHrTrendData,
    selectedMetric,
    sleepDurationTrendData,
    t,
  ]);

  let explainer = t('immuneTrendsChart.explainer');
  if (recoverySelected) {
    explainer = t('immuneTrendsChart.explainers.recovery');
  } else if (selectedMetric) {
    explainer = t(`immuneTrendsChart.explainers.${selectedMetric}`, { defaultValue: explainer });
  }

  return (
    <>
      <Card title={t('immuneOverview.immuneStatus.title')}>
        <View style={globalStyles.row}>
          <SleepMetric showDivider={true} onPress={() => toggleMetric('sleep_duration')} isSelected={selectedMetric === 'sleep_duration'} />
          <DeepSleepMetric showDivider={false} onPress={() => toggleMetric('deep_sleep')} isSelected={selectedMetric === 'deep_sleep'} />
        </View>

        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          <RestingHRMetric showDivider={true} onPress={() => toggleMetric('resting_hr')} isSelected={selectedMetric === 'resting_hr'} />
          <HRVMetric showDivider={true} onPress={() => toggleMetric('hrv')} isSelected={selectedMetric === 'hrv'} />
          <RecoveryStatusMetric
            isSelected={recoverySelected}
            onPress={() => {
              setSelectedMetric(null);
              setRecoverySelected(current => !current);
            }}
          />
        </View>

        {recoverySelected && <RecoveryTrendChart />}

        {selectedConfig && (
          <MetricTrendChart
            seriesSelector={selectedMetric === 'hrv' ? hrvTrend.seriesSelector : undefined}
            data={selectedConfig.data}
            metricName={selectedConfig.metricName}
            unit={selectedConfig.unit}
            valueFormatter={selectedConfig.valueFormatter}
            accentColor={selectedConfig.accentColor}
            onViewRegisteredValues={openMetricValuesTable}
          />
        )}

        <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
          {explainer}
        </ThemedText>
      </Card>
      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric === 'hrv' ? hrvTrend.metricId : selectedMetric}
        metricName={selectedMetric === 'hrv' ? hrvTrend.metricName : selectedConfig?.metricName}
      />
    </>
  );
}
