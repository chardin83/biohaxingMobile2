import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { MetricValuesBottomSheet } from '@/components/sections/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { metrics } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';

import { HRVMetric } from './HRVMetric';
import { MetricTrendChart } from './MetricTrendChart';
import { SleepMetric } from './SleepMetric';
import { TotalActivityMetric } from './TotalActivityMetric';
import { RegisterMetricSheetPortal, useRegisterMetricSheet } from './useRegisterMetricSheet';

type DigestiveTrendMetricKey = 'hrv' | 'sleep_duration' | 'active_minutes';

function formatSleepDuration(valueInMinutes: number) {
  const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function DigestiveTrendsChart() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory, addMetricEntry } = useStorage();
  const [selectedMetric, setSelectedMetric] = React.useState<DigestiveTrendMetricKey | null>(null);
  const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);
  const registerSheet = useRegisterMetricSheet();
  const selectedMetricDefinition = selectedMetric ? metrics[selectedMetric] : undefined;

  const hrvTrendData = React.useMemo(() => buildTrendData(getMetricHistory('hrv')), [getMetricHistory]);
  const sleepTrendData = React.useMemo(
    () =>
      buildTrendData(getMetricHistory('sleep_duration'), (value, unit) => {
        if (unit === 'hours') {
          return Math.round(value * 60);
        }
        return Math.round(value);
      }),
    [getMetricHistory]
  );
  const activityTrendData = React.useMemo(() => buildTrendData(getMetricHistory('active_minutes')), [getMetricHistory]);

  const toggleMetric = React.useCallback((metric: DigestiveTrendMetricKey) => {
    setSelectedMetric(current => (current === metric ? null : metric));
  }, []);

  const saveManualMetric = React.useCallback(() => {
    if (!selectedMetric || !selectedMetricDefinition || !registerSheet.metricValue) return;
    const parsedValue = Number.parseFloat(registerSheet.metricValue);
    if (Number.isNaN(parsedValue)) return;

    addMetricEntry({
      metricId: selectedMetric,
      value: parsedValue,
      unit: registerSheet.metricUnit || selectedMetricDefinition.canonicalUnit,
      recordedAt: registerSheet.recordedAt.toISOString(),
      notes: registerSheet.metricNotes || undefined,
    });

    registerSheet.close();
  }, [addMetricEntry, registerSheet, selectedMetric, selectedMetricDefinition]);

  const openMetricValuesTable = React.useCallback(() => {
    metricValuesBottomSheetRef.current?.snapToIndex(1);
  }, []);

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
          data: sleepTrendData,
          accentColor: colors.chart.sleepDuration,
          explainer: t('digestiveTrendChart.explainers.sleep_duration'),
        };
      case 'active_minutes':
        return {
          metricName: t('metrics:activeMinutes.name'),
          unit: 'min',
          data: activityTrendData,
          accentColor: colors.chart.activeMinutes,
          explainer: t('digestiveTrendChart.explainers.active_minutes'),
        };
      case 'hrv':
      default:
        return {
          metricName: t('metrics:hrv.name'),
          unit: 'ms',
          data: hrvTrendData,
          accentColor: colors.chart.hrv,
          explainer: t('digestiveTrendChart.explainers.hrv'),
        };
    }
  }, [
    selectedMetric,
    t,
    sleepTrendData,
    activityTrendData,
    hrvTrendData,
    colors.chart.sleepDuration,
    colors.chart.activeMinutes,
    colors.chart.hrv,
  ]);

  return (
    <Card title={t('digestiveTrendChart.title')}>
      <View style={globalStyles.row}>
        <HRVMetric
          showDivider
          onPress={() => toggleMetric('hrv')}
          isSelected={selectedMetric === 'hrv'}
        />
        <SleepMetric
          showDivider
          onPress={() => toggleMetric('sleep_duration')}
          isSelected={selectedMetric === 'sleep_duration'}
        />
        <TotalActivityMetric
          onPress={() => toggleMetric('active_minutes')}
          isSelected={selectedMetric === 'active_minutes'}
        />
      </View>

      {selectedConfig && (
        <>
          <MetricTrendChart
            data={selectedConfig.data}
            metricName={selectedConfig.metricName}
            unit={selectedConfig.unit}
            valueFormatter={selectedConfig.valueFormatter}
            accentColor={selectedConfig.accentColor}
            onAddManualValue={registerSheet.open}
          />

          <AppButton
            onPress={openMetricValuesTable}
            title="Visa registrerade värden"
            variant="secondary"
            style={styles.valuesButton}
          />

          <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
            {selectedConfig.explainer}
          </ThemedText>
        </>
      )}

      {selectedMetric && selectedMetricDefinition && (
        <RegisterMetricSheetPortal
          bottomSheetRef={registerSheet.registerBottomSheetRef}
          isVisible={registerSheet.isVisible}
          metricId={selectedMetric}
          metricName={selectedConfig?.metricName}
          metricValue={registerSheet.metricValue}
          setMetricValue={registerSheet.setMetricValue}
          metricUnit={registerSheet.metricUnit}
          setMetricUnit={registerSheet.setMetricUnit}
          metricNotes={registerSheet.metricNotes}
          setMetricNotes={registerSheet.setMetricNotes}
          recordedAt={registerSheet.recordedAt}
          setRecordedAt={registerSheet.setRecordedAt}
          colors={colors}
          units={selectedMetricDefinition.units}
          onSave={saveManualMetric}
          onClose={registerSheet.close}
        />
      )}

      <MetricValuesBottomSheet
        bottomSheetRef={metricValuesBottomSheetRef}
        metricId={selectedMetric}
        metricName={selectedConfig?.metricName}
      />
    </Card>
  );
}

const styles = {
  valuesButton: {
    marginTop: 12,
  },
};
