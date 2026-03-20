import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { MindTrendsChart } from '@/components/metrics/MindTrendsChart';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { shouldSyncWearableData, syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';

export default function MindOverviewScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { adapter, status } = useWearable();
    const [loading, setLoading] = useState(() => adapter.source !== 'none');
    const [error, setError] = useState<string | null>(null);
    const lastSyncAtRef = React.useRef(status.lastSyncAt);
    lastSyncAtRef.current = status.lastSyncAt;

    useEffect(() => {
        if (adapter.source === 'none') {
            setLoading(false);
            return;
        }
        const syncIfNeeded = async () => {
            try {
                setLoading(true);
                if (shouldSyncWearableData(lastSyncAtRef.current)) {
                    await syncWearableMetricsToStorage(adapter, () => {});
                }
            } catch (err) {
                console.error('Failed to sync wearable data:', err);
                setError('Failed to sync wearable data');
            } finally {
                setLoading(false);
            }
        };
        syncIfNeeded();
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
                <MindTrendsChart />
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
            
        </>
    );
}