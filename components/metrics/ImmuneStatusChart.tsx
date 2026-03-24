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

import { BodyBatteryMetric } from './BodyBatteryMetric';
import { DeepSleepMetric } from './DeepSleepMetric';
import { HRVMetric } from './HRVMetric';
import { MetricTrendChart, type MetricTrendPoint } from './MetricTrendChart';
import { RecoveryStatusMetric } from './RecoveryStatusMetric';
import { RestingHRMetric } from './RestingHRMetric';
import { SleepMetric } from './SleepMetric';

type ImmuneTrendMetricKey = 'sleep_duration' | 'deep_sleep' | 'body_battery' | 'resting_hr' | 'hrv';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function ImmuneStatusChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<ImmuneTrendMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: ImmuneTrendMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
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

  const bodyBatteryTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('body_battery'));
  }, [getMetricHistory]);

  const restingHrTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('resting_hr'));
  }, [getMetricHistory]);

  const hrvTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('hrv'));
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
      case 'body_battery':
        return {
          metricName: t('metrics:bodyBattery.name'),
          unit: '%',
          data: bodyBatteryTrendData,
          accentColor: colors.chart.mindBodyBattery,
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
          metricName: t('metrics:hrv.shortName', { defaultValue: t('metrics:hrv.name') }),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
        };
    }
  }, [
    bodyBatteryTrendData,
    colors.chart.deepSleep,
    colors.chart.hrv,
    colors.chart.mindBodyBattery,
    colors.chart.restingHr,
    colors.chart.sleepDuration,
    deepSleepTrendData,
    hrvTrendData,
    restingHrTrendData,
    selectedMetric,
    sleepDurationTrendData,
    t,
  ]);

  return (
    <>
      <Card title={t('immuneOverview.immuneStatus.title')}>
        <View style={globalStyles.row}>
          <SleepMetric
            showDivider={true}
            onPress={() => toggleMetric('sleep_duration')}
            isSelected={selectedMetric === 'sleep_duration'}
          />
          <DeepSleepMetric
            showDivider={true}
            onPress={() => toggleMetric('deep_sleep')}
            isSelected={selectedMetric === 'deep_sleep'}
          />
          <BodyBatteryMetric
            onPress={() => toggleMetric('body_battery')}
            isSelected={selectedMetric === 'body_battery'}
          />
        </View>

        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          <RestingHRMetric
            showDivider={true}
            onPress={() => toggleMetric('resting_hr')}
            isSelected={selectedMetric === 'resting_hr'}
          />
          <HRVMetric
            showDivider={true}
            onPress={() => toggleMetric('hrv')}
            isSelected={selectedMetric === 'hrv'}
          />
          <RecoveryStatusMetric />
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

        <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }] }>
          {selectedMetric
            ? t(`immuneTrendsChart.explainers.${selectedMetric}`, {
              defaultValue: t('immuneTrendsChart.explainer'),
            })
            : t('immuneTrendsChart.explainer')}
        </ThemedText>
      </Card>
      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </>
  );
}
