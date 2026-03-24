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
import { useStoredHRVData } from '@/hooks/useStoredHRVData';
import { buildTrendData } from '@/utils/metrics';

import { BodyBatteryMetric } from './BodyBatteryMetric';
import { HRVMetric } from './HRVMetric';
import { MetricTrendChart, type MetricTrendPoint } from './MetricTrendChart';
import { RecoveryStatusMetric } from './RecoveryStatusMetric';
import { RestingHRMetric } from './RestingHRMetric';
import { StressScoreMetric } from './StressScoreMetric';

type NervousMetricKey = 'hrv' | 'stress_score' | 'body_battery' | 'resting_hr';

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function NervousSystemStatusChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const hrvData = useStoredHRVData();
  const [selectedMetric, setSelectedMetric] = React.useState<NervousMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback((metric: NervousMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const hrvTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('hrv'));
  }, [getMetricHistory]);

  const restingHrTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('resting_hr'));
  }, [getMetricHistory]);

  const bodyBatteryTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('body_battery'));
  }, [getMetricHistory]);

  const stressScoreTrendData = React.useMemo<MetricTrendPoint[]>(() => {
    return buildTrendData(getMetricHistory('hrv'), value => clampScore(100 - Math.round(value)));
  }, [getMetricHistory]);

  const selectedConfig = React.useMemo(() => {
    if (!selectedMetric) {
      return null;
    }

    switch (selectedMetric) {
      case 'stress_score':
        return {
          metricName: t('metrics:stressScore.title'),
          unit: undefined,
          data: stressScoreTrendData,
          accentColor: colors.warmDefault,
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
          metricName: t('metrics:resting_hr.name'),
          unit: 'bpm',
          data: restingHrTrendData,
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
  }, [
    bodyBatteryTrendData,
    colors.chart.hrv,
    colors.chart.mindBodyBattery,
    colors.chart.restingHr,
    colors.warmDefault,
    hrvTrendData,
    restingHrTrendData,
    selectedMetric,
    stressScoreTrendData,
    t,
  ]);

  const selectedMetricId = selectedMetric === 'stress_score' ? 'hrv' : selectedMetric;

  return (
    <>
      <Card title={t('nervousSystemOverview.autonomicNervousSystem.title')}>
        <View style={globalStyles.row}>
          <HRVMetric showDivider onPress={() => toggleMetric('hrv')} isSelected={selectedMetric === 'hrv'} />
          <StressScoreMetric
            hrvData={hrvData}
            showDivider
            onPress={() => toggleMetric('stress_score')}
            isSelected={selectedMetric === 'stress_score'}
          />
          <BodyBatteryMetric onPress={() => toggleMetric('body_battery')} isSelected={selectedMetric === 'body_battery'} />
        </View>

        <View style={[globalStyles.row, globalStyles.marginTop16]}>
          <RestingHRMetric
            showDivider
            onPress={() => toggleMetric('resting_hr')}
            isSelected={selectedMetric === 'resting_hr'}
          />
          <RecoveryStatusMetric />
        </View>

        {selectedConfig && (
          <MetricTrendChart
            data={selectedConfig.data}
            metricName={selectedConfig.metricName}
            unit={selectedConfig.unit}
            accentColor={selectedConfig.accentColor}
            onViewRegisteredValues={openMetricValuesTable}
          />
        )}

        <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }] }>
          {selectedMetric
            ? t(`nervousTrendsChart.explainers.${selectedMetric}`)
            : t('nervousTrendsChart.explainer')}
        </ThemedText>
      </Card>

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetricId}
        metricName={selectedConfig?.metricName}
      />
    </>
  );
}