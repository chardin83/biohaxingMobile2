import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { BodyBatteryMetric } from '@/components/metrics/BodyBatteryMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { ThemedText } from '@/components/ThemedText';
import { buildTrendData } from '@/utils/metrics';

import { RegisterMetricSheetPortal,useRegisterMetricSheet } from './useRegisterMetricSheet';

export type MindMetricKey = 'body_battery' | 'sleep_duration' | 'steps' | 'intensity_minutes';

function formatSleepDuration(valueInMinutes: number) {
    const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function MindTrendsChart() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { getMetricHistory, addMetricEntry } = useStorage();
    const [selectedMetric, setSelectedMetric] = React.useState<MindMetricKey>('body_battery');
    const registerSheet = useRegisterMetricSheet();

    const metricDefinitions: Record<MindMetricKey, {
        metricId: string;
        metricName: string;
        canonicalUnit: string;
        units: Array<{ unit: string; system: string }>;
    }> = React.useMemo(() => ({
        body_battery: {
            metricId: 'body_battery',
            metricName: t('metrics.bodyBattery.title'),
            canonicalUnit: '%',
            units: [{ unit: '%', system: 'EU' }, { unit: '%', system: 'US' }],
        },
        sleep_duration: {
            metricId: 'sleep_duration',
            metricName: t('metrics:sleep_duration.name'),
            canonicalUnit: 'min',
            units: [{ unit: 'min', system: 'EU' }, { unit: 'min', system: 'US' }],
        },
        steps: {
            metricId: 'steps',
            metricName: t('metrics.todaysSteps.title'),
            canonicalUnit: 'count',
            units: [{ unit: 'count', system: 'EU' }, { unit: 'count', system: 'US' }],
        },
        intensity_minutes: {
            metricId: 'intensity_minutes',
            metricName: t('metrics.intensityMinutes.title'),
            canonicalUnit: 'min',
            units: [{ unit: 'min', system: 'EU' }, { unit: 'min', system: 'US' }],
        },
    }), [t]);

    const bodyBatteryTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory(metricDefinitions.body_battery.metricId));
    }, [getMetricHistory, metricDefinitions.body_battery.metricId]);

    const sleepDurationTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(
            getMetricHistory(metricDefinitions.sleep_duration.metricId),
            (value, unit) => {
                if (unit === 'hours') {
                    return Math.round(value * 60);
                }
                return Math.round(value);
            }
        );
    }, [getMetricHistory, metricDefinitions.sleep_duration.metricId]);

    const stepsTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory(metricDefinitions.steps.metricId));
    }, [getMetricHistory, metricDefinitions.steps.metricId]);

    const intensityTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return buildTrendData(getMetricHistory(metricDefinitions.intensity_minutes.metricId));
    }, [getMetricHistory, metricDefinitions.intensity_minutes.metricId]);

    const selectedMetricDefinition = metricDefinitions[selectedMetric];

    const selectedMetricConfig = React.useMemo(() => {
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
                    metricName: t('metrics.todaysSteps.title'),
                    unit: undefined,
                    valueFormatter: (value: number) => Math.round(value).toLocaleString(),
                    data: stepsTrendData,
                    accentColor: colors.chart.mindSteps,
                };
            case 'intensity_minutes':
                return {
                    metricName: t('metrics.intensityMinutes.title'),
                    unit: 'min',
                    valueFormatter: undefined,
                    data: intensityTrendData,
                    accentColor: colors.chart.mindIntensity,
                };
            case 'body_battery':
            default:
                return {
                    metricName: t('metrics.bodyBattery.title'),
                    unit: '%',
                    valueFormatter: undefined,
                    data: bodyBatteryTrendData,
                    accentColor: colors.chart.mindBodyBattery,
                };
        }
    }, [bodyBatteryTrendData, colors.chart.mindBodyBattery, colors.chart.mindIntensity, colors.chart.mindSteps, colors.chart.sleepDuration, intensityTrendData, selectedMetric, sleepDurationTrendData, stepsTrendData, t]);

    return (
        <>
            <View style={styles.metricRow}>
                <BodyBatteryMetric
                    showDivider={true}
                    onPress={() => setSelectedMetric('body_battery')}
                    isSelected={selectedMetric === 'body_battery'}
                />
                <SleepMetric
                    showDivider={false}
                    onPress={() => setSelectedMetric('sleep_duration')}
                    isSelected={selectedMetric === 'sleep_duration'}
                />
            </View>
            <View style={styles.metricRow}>
                <StepsMetric
                    showDivider={true}
                    onPress={() => setSelectedMetric('steps')}
                    isSelected={selectedMetric === 'steps'}
                />
                <IntensityMinutesMetric
                    showDivider={false}
                    onPress={() => setSelectedMetric('intensity_minutes')}
                    isSelected={selectedMetric === 'intensity_minutes'}
                />
            </View>
            <MetricTrendChart
                data={selectedMetricConfig.data}
                metricName={selectedMetricConfig.metricName}
                unit={selectedMetricConfig.unit}
                valueFormatter={selectedMetricConfig.valueFormatter}
                accentColor={selectedMetricConfig.accentColor}
                onAddManualValue={registerSheet.open}
            />
            <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }] }>
                {t(`mindOverview.mindMetrics.explainers.${selectedMetric}`)}
            </ThemedText>
            <RegisterMetricSheetPortal
                bottomSheetRef={registerSheet.registerBottomSheetRef}
                isVisible={registerSheet.isVisible}
                metricId={selectedMetricDefinition.metricId}
                metricName={selectedMetricDefinition.metricName}
                metricValue={registerSheet.metricValue}
                setMetricValue={registerSheet.setMetricValue}
                metricUnit={registerSheet.metricUnit}
                setMetricUnit={registerSheet.setMetricUnit}
                metricNotes={registerSheet.metricNotes}
                setMetricNotes={registerSheet.setMetricNotes}
                recordedAt={registerSheet.recordedAt}
                setRecordedAt={registerSheet.setRecordedAt}
                colors={colors}
                units={selectedMetricDefinition.units.map(u => u.unit)}
                onSave={() => {
                    const value = Number.parseFloat(registerSheet.metricValue);
                    if (Number.isNaN(value)) {
                        // Optionally show error/validation
                        return;
                    }
                    addMetricEntry({
                        metricId: selectedMetricDefinition.metricId,
                        value,
                        unit: registerSheet.metricUnit || selectedMetricDefinition.canonicalUnit,
                        recordedAt: registerSheet.recordedAt?.toISOString?.() || new Date().toISOString(),
                        notes: registerSheet.metricNotes || undefined,
                    });
                    registerSheet.close();
                }}
                onClose={registerSheet.close}
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
