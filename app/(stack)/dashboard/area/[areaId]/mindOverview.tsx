import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { BodyBatteryMetric } from '@/components/metrics/BodyBatteryMetric';
import { IntensityMinutesMetric } from '@/components/metrics/IntensityMinutesMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { StepsMetric } from '@/components/metrics/StepsMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function MindOverviewScreen({ mainGoalId }: { mainGoalId: string }) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { adapter, status } = useWearable();

    const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [energyData, setEnergyData] = useState<EnergySignal[]>([]);
    const [activityData, setActivityData] = useState<DailyActivity[]>([]);

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
    }, [adapter]);

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
                    <BodyBatteryMetric energyData={energyData} showDivider />
                    <SleepMetric sleepData={sleepData} showDivider />
                </View>
                <View style={globalStyles.row}>
                    <StepsMetric activityData={activityData} showDivider />
                    <IntensityMinutesMetric activityData={activityData} />
                </View>
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
            </Card>

            <GenesListCard areaId="mind" />

            {/* Tips card */}
            <TipsList areaId={mainGoalId} />
        </>
    );
}