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
import { buildWeeklyTrainingLoadTrendData, getIsoWeekInfo } from '@/utils/trainingLoad';

import { MetricTrendChart } from './MetricTrendChart';
import { RestingHRMetric } from './RestingHRMetric';
import { TrainingLoadMetric } from './TrainingLoadMetric';
import { VO2MaxMetric } from './VO2MaxMetric';

type CardioTrendMetricKey = 'vo2_max' | 'resting_hr' | 'training_load';

function formatWeekLabel(date: string) {
  const { isoYear, isoWeek } = getIsoWeekInfo(date);
  const shortYear = String(isoYear).slice(-2);
  return `v${isoWeek} '${shortYear}`;
}

export function CardioTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<CardioTrendMetricKey | null>(null);
  const toggleMetric = React.useCallback(
    (metric: CardioTrendMetricKey) => setSelectedMetric(c => (c === metric ? null : metric)),
    []
  );
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const vo2TrendData = React.useMemo(() => buildTrendData(getMetricHistory('vo2_max')), [getMetricHistory]);
  const restingHrTrendData = React.useMemo(() => buildTrendData(getMetricHistory('resting_hr')), [getMetricHistory]);

  const trainingLoadTrendData = React.useMemo(
    () =>
      buildWeeklyTrainingLoadTrendData(
        getMetricHistory('active_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit })),
        getMetricHistory('intensity_minutes').map(entry => ({ recordedAt: entry.recordedAt, value: entry.value, unit: entry.unit }))
      ),
    [getMetricHistory]
  );

  const selectedConfig = React.useMemo(() => {
    if (!selectedMetric) return null;
    switch (selectedMetric) {
      case 'resting_hr':
        return {
          metricName: t('metrics:resting_hr.shortName'),
          unit: 'bpm',
          data: restingHrTrendData,
          accentColor: colors.chart.restingHr,
        };
      case 'training_load':
        return {
          metricName: t('metrics:trainingLoad.name'),
          unit: '',
          daysToShow: 35,
          data: trainingLoadTrendData,
          xAxisLabelFormatter: formatWeekLabel,
          accentColor: colors.area.cardio,
          referenceLines: [
            { value: 150, label: '150', color: colors.infoColor },
            { value: 300, label: '300', color: colors.successColor },
          ],
        };
      case 'vo2_max':
        return {
          metricName: t('metrics:vo2_max.shortName'),
          unit: '',
          data: vo2TrendData,
          accentColor: colors.chart.vo2Max,
        };
      default:
        return null;
    }
  }, [
    selectedMetric,
    t,
    vo2TrendData,
    restingHrTrendData,
    trainingLoadTrendData,
    colors.chart.restingHr,
    colors.chart.vo2Max,
    colors.area.cardio,
    colors.infoColor,
    colors.successColor,
  ]);

  return (
    <Card title={t('cardioOverview.yourCardioPerformance')}>
      <View style={globalStyles.row}>
        <VO2MaxMetric showDivider onPress={() => toggleMetric('vo2_max')} isSelected={selectedMetric === 'vo2_max'} />
        <RestingHRMetric
          showDivider
          onPress={() => toggleMetric('resting_hr')}
          isSelected={selectedMetric === 'resting_hr'}
        />
        <TrainingLoadMetric onPress={() => toggleMetric('training_load')} isSelected={selectedMetric === 'training_load'} />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit || undefined}
          daysToShow={selectedConfig.daysToShow}
          accentColor={selectedConfig.accentColor}
          xAxisLabelFormatter={selectedConfig.xAxisLabelFormatter}
          referenceLines={selectedConfig.referenceLines}
          onViewRegisteredValues={openMetricValuesTable}
        />
      )}

      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
        {selectedMetric
          ? t(`cardioTrendsChart.explainers.${selectedMetric}`)
          : t('cardioTrendsChart.explainer')}
      </ThemedText>

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </Card>
  );
}
