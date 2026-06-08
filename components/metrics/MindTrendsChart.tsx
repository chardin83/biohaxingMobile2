import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { BodyBatteryMetric } from '@/components/metrics/BodyBatteryMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { MetricValuesBottomSheet } from '@/components/sections/MetricValuesBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { MetricId } from '@/locales/metrics';
import { buildTrendData } from '@/utils/metrics';

import { Card } from '../ui/Card';


export type MindMetricKey = Extract<MetricId, 'body_battery' | 'sleep_duration' | 'steps' | 'intensity_minutes'>;

function formatSleepDuration(valueInMinutes: number) {
    const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function MindTrendsChart() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { getMetricHistory } = useStorage();
    const [selectedMetric, setSelectedMetric] = React.useState<MindMetricKey | null>(null);
    const metricValuesBottomSheetRef = React.useRef<BottomSheet>(null);

    const toggleMetric = React.useCallback((metric: MindMetricKey) => {
        setSelectedMetric(current => (current === metric ? null : metric));
    }, []);

    const openMetricValuesTable = React.useCallback(() => {
        metricValuesBottomSheetRef.current?.snapToIndex(1);
    }, []);

    const bodyBatteryTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory('body_battery'));
    }, [getMetricHistory]);

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

    const stepsTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory('steps'));
    }, [getMetricHistory]);

    const intensityTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory('intensity_minutes'));
    }, [getMetricHistory]);

    const selectedMetricConfig = React.useMemo(() => {
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
            case 'steps':
                return {
                    metricName: t('metrics:todaysSteps.name'),
                    unit: undefined,
                    valueFormatter: (value: number) => Math.round(value).toLocaleString(),
                    data: stepsTrendData,
                    accentColor: colors.chart.mindSteps,
                };
            case 'intensity_minutes':
                return {
                    metricName: t('metrics:intensityMinutes.name'),
                    unit: 'min',
                    data: intensityTrendData,
                    accentColor: colors.chart.mindIntensity,
                };
            case 'body_battery':
            default:
                return {
                    metricName: t('metrics:bodyBattery.name'),
                    unit: '%',
                    data: bodyBatteryTrendData,
                    accentColor: colors.chart.mindBodyBattery,
                };
        }
    }, [bodyBatteryTrendData, colors.chart.mindBodyBattery, colors.chart.mindIntensity, colors.chart.mindSteps, colors.chart.sleepDuration, intensityTrendData, selectedMetric, sleepDurationTrendData, stepsTrendData, t]);

    return (
        <>
            <Card title={t("mindTrendsChart.title")}>
                <View style={styles.metricRow}>
                    <BodyBatteryMetric
                        showDivider={true}
                        onPress={() => toggleMetric('body_battery')}
                        isSelected={selectedMetric === 'body_battery'}
                    />
                    <SleepMetric
                        showDivider={false}
                        onPress={() => toggleMetric('sleep_duration')}
                        isSelected={selectedMetric === 'sleep_duration'}
                    />
                </View>
                <View style={styles.metricRow}>
                    <StepsMetric
                        showDivider={true}
                        onPress={() => toggleMetric('steps')}
                        isSelected={selectedMetric === 'steps'}
                    />
                    <IntensityMinutesMetric
                        showDivider={false}
                        onPress={() => toggleMetric('intensity_minutes')}
                        isSelected={selectedMetric === 'intensity_minutes'}
                    />
                </View>
                {selectedMetricConfig && (
                    <MetricTrendChart
                        data={selectedMetricConfig.data}
                        metricName={selectedMetricConfig.metricName}
                        unit={selectedMetricConfig.unit}
                        valueFormatter={selectedMetricConfig.valueFormatter}
                        accentColor={selectedMetricConfig.accentColor}
                        onViewRegisteredValues={openMetricValuesTable}
                    />
                )}
                <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
                    {selectedMetric
                        ? t(`mindTrendsChart.explainers.${selectedMetric}`)
                        : t('mindTrendsChart.explainer')}
                </ThemedText>
            </Card>
            <MetricValuesBottomSheet
                bottomSheetRef={metricValuesBottomSheetRef}
                metricId={selectedMetric}
                metricName={selectedMetricConfig?.metricName}
            />
        </>
    );
}

const styles = StyleSheet.create({
    metricRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
});
