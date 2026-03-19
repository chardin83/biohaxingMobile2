import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { BodyBatteryMetric } from '@/components/metrics/BodyBatteryMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { MetricTrendChart, type MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

type MindMetricKey = 'body_battery' | 'sleep_duration' | 'steps' | 'intensity_minutes';

function formatSleepDuration(valueInMinutes: number) {
    const roundedMinutes = Math.max(0, Math.round(valueInMinutes));
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export default function MindOverviewScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { adapter, status } = useWearable();
    const { addMetricEntry, getMetricHistory, upsertMetricEntries } = useStorage();
    const registerBottomSheetRef = React.useRef<BottomSheet>(null);

    const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [energyData, setEnergyData] = useState<EnergySignal[]>([]);
    const [activityData, setActivityData] = useState<DailyActivity[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<MindMetricKey>('body_battery');
    const [isRegisterSheetVisible, setIsRegisterSheetVisible] = useState(false);
    const [metricValue, setMetricValue] = useState('');
    const [metricUnit, setMetricUnit] = useState('');
    const [metricNotes, setMetricNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState(() => new Date());

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

    const sortedEnergyData = React.useMemo(() => {
        return [...energyData].sort((left, right) => left.date.localeCompare(right.date));
    }, [energyData]);

    const sortedSleepData = React.useMemo(() => {
        return [...sleepData].sort((left, right) => left.date.localeCompare(right.date));
    }, [sleepData]);

    const sleepDurationManualEntries = React.useMemo(() => {
        return getMetricHistory(metricDefinitions.sleep_duration.metricId).map(entry => {
            const valueInMinutes = entry.unit === 'hours' ? Math.round(entry.value * 60) : Math.round(entry.value);

            return {
                date: entry.recordedAt.slice(0, 10),
                durationMinutes: valueInMinutes,
            };
        });
    }, [getMetricHistory, metricDefinitions.sleep_duration.metricId]);

    const mergedSleepData = React.useMemo<SleepSummary[]>(() => {
        const byDate = new Map<string, SleepSummary>();

        sortedSleepData.forEach(entry => {
            byDate.set(entry.date, entry);
        });

        sleepDurationManualEntries.forEach(entry => {
            const existing = byDate.get(entry.date);

            if (existing) {
                byDate.set(entry.date, {
                    ...existing,
                    durationMinutes: entry.durationMinutes,
                });
            } else {
                byDate.set(entry.date, {
                    source: 'none',
                    date: entry.date,
                    durationMinutes: entry.durationMinutes,
                });
            }
        });

        return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date));
    }, [sleepDurationManualEntries, sortedSleepData]);

    const sortedActivityData = React.useMemo(() => {
        return [...activityData].sort((left, right) => left.date.localeCompare(right.date));
    }, [activityData]);

    const mergeWithManualEntries = React.useCallback((wearablePoints: MetricTrendPoint[], metricId: string) => {
        const byDate = new Map<string, MetricTrendPoint>();

        wearablePoints.forEach(point => {
            byDate.set(point.date, point);
        });

        getMetricHistory(metricId)
            .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
            .forEach(entry => {
                byDate.set(entry.recordedAt.slice(0, 10), {
                    date: entry.recordedAt.slice(0, 10),
                    value: entry.value,
                });
            });

        return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date));
    }, [getMetricHistory]);

    const bodyBatteryTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        const wearablePoints = sortedEnergyData
            .filter(entry => typeof entry.bodyBatteryLevel === 'number')
            .map(entry => ({ date: entry.date, value: entry.bodyBatteryLevel as number }));

        return mergeWithManualEntries(wearablePoints, metricDefinitions.body_battery.metricId);
    }, [mergeWithManualEntries, metricDefinitions.body_battery.metricId, sortedEnergyData]);

    const sleepDurationTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        return mergedSleepData
            .filter(entry => typeof entry.durationMinutes === 'number')
            .map(entry => ({ date: entry.date, value: entry.durationMinutes }));
    }, [mergedSleepData]);

    const stepsTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        const wearablePoints = sortedActivityData
            .filter(entry => typeof entry.steps === 'number')
            .map(entry => ({ date: entry.date, value: entry.steps as number }));

        return mergeWithManualEntries(wearablePoints, metricDefinitions.steps.metricId);
    }, [mergeWithManualEntries, metricDefinitions.steps.metricId, sortedActivityData]);

    const intensityTrendData = React.useMemo<MetricTrendPoint[]>(() => {
        const wearablePoints = sortedActivityData
            .filter(entry => typeof entry.intensityMinutes === 'number')
            .map(entry => ({ date: entry.date, value: entry.intensityMinutes as number }));

        return mergeWithManualEntries(wearablePoints, metricDefinitions.intensity_minutes.metricId);
    }, [mergeWithManualEntries, metricDefinitions.intensity_minutes.metricId, sortedActivityData]);

    const selectedMetricDefinition = metricDefinitions[selectedMetric];

    const openManualMetricSheet = React.useCallback(() => {
        const defaultUnit = selectedMetricDefinition?.units?.[0]?.unit ?? '';
        setMetricUnit(defaultUnit);
        setMetricValue('');
        setMetricNotes('');
        setRecordedAt(new Date());
        setIsRegisterSheetVisible(true);
    }, [selectedMetricDefinition]);

    const closeManualMetricSheet = React.useCallback(() => {
        setIsRegisterSheetVisible(false);
        setMetricValue('');
        setMetricNotes('');
        setRecordedAt(new Date());
    }, []);

    const saveManualMetric = React.useCallback(() => {
        if (!metricValue) {
            return;
        }

        const parsedValue = Number.parseFloat(metricValue);
        if (Number.isNaN(parsedValue)) {
            return;
        }

        addMetricEntry({
            metricId: selectedMetricDefinition.metricId,
            value: parsedValue,
            unit: metricUnit || selectedMetricDefinition.canonicalUnit,
            recordedAt: recordedAt.toISOString(),
            notes: metricNotes || undefined,
        });

        closeManualMetricSheet();
    }, [addMetricEntry, closeManualMetricSheet, metricNotes, metricUnit, metricValue, recordedAt, selectedMetricDefinition]);

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

    useEffect(() => {
        const loadHRV = async () => {
            try {
                setLoading(true);
                const range: TimeRange = {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                };
                const [sleep, activity, energy] = await Promise.all([
                    adapter.getSleep(range),
                    adapter.getDailyActivity(range),
                    adapter.getEnergySignal(range),
                ]);

                const wearableMetricEntries = [
                    ...sleep
                        .filter(entry => typeof entry.durationMinutes === 'number')
                        .map(entry => ({
                            metricId: metricDefinitions.sleep_duration.metricId,
                            value: entry.durationMinutes,
                            unit: 'min',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                    ...activity
                        .filter(entry => typeof entry.steps === 'number')
                        .map(entry => ({
                            metricId: metricDefinitions.steps.metricId,
                            value: entry.steps as number,
                            unit: 'count',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                    ...activity
                        .filter(entry => typeof entry.intensityMinutes === 'number')
                        .map(entry => ({
                            metricId: metricDefinitions.intensity_minutes.metricId,
                            value: entry.intensityMinutes as number,
                            unit: 'min',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                    ...energy
                        .filter(entry => typeof entry.bodyBatteryLevel === 'number')
                        .map(entry => ({
                            metricId: metricDefinitions.body_battery.metricId,
                            value: entry.bodyBatteryLevel as number,
                            unit: '%',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                    ...sleep
                        .filter(entry => typeof entry.stages?.deepMinutes === 'number')
                        .map(entry => ({
                            metricId: 'deep_sleep',
                            value: entry.stages?.deepMinutes as number,
                            unit: 'min',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                    ...sleep
                        .filter(entry => typeof entry.stages?.remMinutes === 'number')
                        .map(entry => ({
                            metricId: 'rem_sleep',
                            value: entry.stages?.remMinutes as number,
                            unit: 'min',
                            recordedAt: `${entry.date}T00:00:00.000Z`,
                            notes: 'wearable_sync',
                        })),
                ];

                upsertMetricEntries(wearableMetricEntries);

                setSleepData(sleep);
                setActivityData(activity);
                setEnergyData(energy);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        if (adapter) loadHRV();
    }, [adapter, metricDefinitions.body_battery.metricId, metricDefinitions.intensity_minutes.metricId, metricDefinitions.sleep_duration.metricId, metricDefinitions.steps.metricId, upsertMetricEntries]);

    if (loading) {
        return <ThemedText type="default">{t('general.loading')}</ThemedText>;
    }
    if (error) {
        return <ThemedText type="default">{error}</ThemedText>;
    }

    return (
        <>
            <ThemedText type="title" style={{ color: colors.accentStrong }}>
                {t("mindOverview.title")}
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
                {t("mindOverview.description")}
            </ThemedText>

            <WearableStatus status={status} />

            {/* Overview card - Main mind metrics */}
            <Card title={t("mindOverview.mindMetrics.title")}>
                <View style={globalStyles.row}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedMetric('body_battery')}
                        style={({ pressed }) => [
                            styles.metricPressable,
                            selectedMetric === 'body_battery' && {
                                backgroundColor: colors.overlayLight,
                                borderColor: colors.chart.mindBodyBattery,
                            },
                            pressed && selectedMetric !== 'body_battery' && { backgroundColor: colors.overlayLight },
                        ]}
                    >
                        <BodyBatteryMetric energyData={energyData} showDivider={false} />
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedMetric('sleep_duration')}
                        style={({ pressed }) => [
                            styles.metricPressable,
                            selectedMetric === 'sleep_duration' && {
                                backgroundColor: colors.overlayLight,
                                borderColor: colors.chart.sleepDuration,
                            },
                            pressed && selectedMetric !== 'sleep_duration' && { backgroundColor: colors.overlayLight },
                        ]}
                    >
                        <SleepMetric sleepData={mergedSleepData} showDivider={false} />
                    </Pressable>
                </View>
                <View style={globalStyles.row}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedMetric('steps')}
                        style={({ pressed }) => [
                            styles.metricPressable,
                            selectedMetric === 'steps' && {
                                backgroundColor: colors.overlayLight,
                                borderColor: colors.chart.mindSteps,
                            },
                            pressed && selectedMetric !== 'steps' && { backgroundColor: colors.overlayLight },
                        ]}
                    >
                        <StepsMetric activityData={activityData} showDivider={false} />
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedMetric('intensity_minutes')}
                        style={({ pressed }) => [
                            styles.metricPressable,
                            selectedMetric === 'intensity_minutes' && {
                                backgroundColor: colors.overlayLight,
                                borderColor: colors.chart.mindIntensity,
                            },
                            pressed && selectedMetric !== 'intensity_minutes' && { backgroundColor: colors.overlayLight },
                        ]}
                    >
                        <IntensityMinutesMetric activityData={activityData} showDivider={false} />
                    </Pressable>
                </View>

                <MetricTrendChart
                    data={selectedMetricConfig.data}
                    metricName={selectedMetricConfig.metricName}
                    unit={selectedMetricConfig.unit}
                    valueFormatter={selectedMetricConfig.valueFormatter}
                    accentColor={selectedMetricConfig.accentColor}
                    onAddManualValue={openManualMetricSheet}
                />

                <ThemedText type="explainer" style={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
                    {t(`mindOverview.mindMetrics.explainers.${selectedMetric}`)}
                </ThemedText>
            </Card>

            {/* Information card */}
            <Card title={t("mindOverview.informationCard.title")}>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🧠 {t("mindOverview.informationCard.focus.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.focus.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">😰 {t("mindOverview.informationCard.stress.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.stress.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🙂 {t("mindOverview.informationCard.mood.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.mood.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">💤 {t("mindOverview.informationCard.sleepQuality.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.sleepQuality.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🚶‍♂️ {t("mindOverview.informationCard.steps.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.steps.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🧬 {t("mindOverview.informationCard.bdnf.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.bdnf.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🧬 {t("mindOverview.informationCard.ketones.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.ketones.description")}</ThemedText>
                </View>
                <View style={globalStyles.infoSection}>
                    <ThemedText type="title3">🧬 {t("mindOverview.informationCard.lactate.title")}</ThemedText>
                    <ThemedText type="default">{t("mindOverview.informationCard.lactate.description")}</ThemedText>
                </View>
            </Card>

            <GenesListCard areaId="mind" />

            {/* Tips card */}
            <TipsList areaId={mainGoalId} />

            <Portal>
                <RegisterMetricBottomSheet
                    bottomSheetRef={registerBottomSheetRef}
                    isVisible={isRegisterSheetVisible}
                    metricId={selectedMetricDefinition.metricId}
                    onClose={closeManualMetricSheet}
                    onSave={saveManualMetric}
                    metricName={selectedMetricDefinition.metricName}
                    metricValue={metricValue}
                    setMetricValue={setMetricValue}
                    metricUnit={metricUnit}
                    setMetricUnit={setMetricUnit}
                    metricNotes={metricNotes}
                    setMetricNotes={setMetricNotes}
                    recordedAt={recordedAt}
                    setRecordedAt={setRecordedAt}
                    colors={colors}
                    units={selectedMetricDefinition.units}
                />
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    metricPressable: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
});