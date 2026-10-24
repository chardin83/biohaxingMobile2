import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/metrics/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';

import { GlycemicIndexMetric } from './GlycemicIndexMetric';
import { useMetricConfig } from './metricChartConfig';
import { MetricTrendChart } from './MetricTrendChart';

export function LongevityTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = React.useState<'glycemic_index' | null>(null);
  const valuesRef = React.useRef<BottomSheet>(null);
  const selectedConfig = useMetricConfig({ metricId: selectedMetric });

  return (
    <Card title={t('longevityTrendsChart.title')}>
      <View style={globalStyles.row}>
        <GlycemicIndexMetric
          onPress={() => setSelectedMetric(current => current ? null : 'glycemic_index')}
          isSelected={selectedMetric === 'glycemic_index'}
        />
      </View>

      {selectedConfig && (
        <MetricTrendChart
          {...selectedConfig}
          onViewRegisteredValues={() => valuesRef.current?.snapToIndex(1)}
        />
      )}

      <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
        {t(selectedMetric ? 'metrics:glycemic_index.description' : 'longevityTrendsChart.explainer')}
      </ThemedText>

      <MetricValuesBottomSheet bottomSheetRef={valuesRef} metricId={selectedMetric} metricName={selectedConfig?.metricName} />
    </Card>
  );
}
