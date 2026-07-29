import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { HRVMetric } from './HRVMetric';
import {
  type DigestiveTrendMetricKey,
  useMetricConfig,
} from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';
import { SleepMetric } from './SleepMetric';
import { TotalActivityMetric } from './TotalActivityMetric';

export function DigestiveTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedMetric, setSelectedMetric] =
    React.useState<DigestiveTrendMetricKey | null>(null);

  const metricValuesBottomSheetRef =
    React.useRef<BottomSheet>(null);

  const toggleMetric = React.useCallback(
    (metric: DigestiveTrendMetricKey) => {
      setSelectedMetric(current =>
        current === metric ? null : metric,
      );
    },
    [],
  );

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const selectedConfig = useMetricConfig({
    metricId: selectedMetric,
  });

  return (
    <Card title={t('digestiveTrendsChart.title')}>
      <View style={globalStyles.row}>
        <HRVMetric
          showDivider
          onPress={() => toggleMetric('hrv')}
          isSelected={selectedMetric === 'hrv'}
        />

        <SleepMetric
          showDivider
          onPress={() =>
            toggleMetric('sleep_duration')
          }
          isSelected={
            selectedMetric === 'sleep_duration'
          }
        />

        <TotalActivityMetric
          onPress={() =>
            toggleMetric('active_minutes')
          }
          isSelected={
            selectedMetric === 'active_minutes'
          }
        />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          data={selectedConfig.data}
          metricName={selectedConfig.metricName}
          unit={selectedConfig.unit}
          daysToShow={selectedConfig.daysToShow}
          valueFormatter={
            selectedConfig.valueFormatter
          }
          accentColor={
            selectedConfig.accentColor
          }
          xAxisLabelFormatter={
            selectedConfig.xAxisLabelFormatter
          }
          referenceLines={
            selectedConfig.referenceLines
          }
          onViewRegisteredValues={
            openMetricValuesTable
          }
        />
      )}

      <ThemedText
        type="explainer"
        style={[
          globalStyles.explainer,
          {
            borderColor: colors.borderLight,
          },
        ]}
      >
        {selectedMetric
          ? t(
              `digestiveTrendsChart.explainers.${selectedMetric}`,
              {
                defaultValue: t(
                  'digestiveTrendsChart.explainer',
                ),
              },
            )
          : t('digestiveTrendsChart.explainer')}
      </ThemedText>

      <MetricValuesBottomSheet
        bottomSheetRef={
          metricValuesBottomSheetRef
        }
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </Card>
  );
}