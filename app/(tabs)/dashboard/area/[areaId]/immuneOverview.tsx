import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RecoveryStatusMetric } from '@/components/metrics/RecoveryStatusMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function ImmuneScreen({ mainGoalId }: { mainGoalId: string }) {
  const { colors } = useTheme();
  const { adapter, status } = useWearable();
  const { t } = useTranslation();
    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);
  const [sleepHours, setSleepHours] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, hrv, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getHRV(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
        setHrvData(hrv);
        setEnergyData(energy);

        // Sätt sleepHours
        if (sleep.length > 0) {
          const latest = sleep[sleep.length - 1];
          setSleepHours(latest.durationMinutes ? latest.durationMinutes / 60 : null);
        }

        // Sätt hrv
        if (hrv.length > 0) {
          setHrvData(hrv);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adapter]);


  if (loading) {
    return (
        <Loading />
    );
  }

  if (error) {
    return <Error error={error} />;
  }

  // Transform wearable data to immune metrics
  const latestEnergy = energyData[0];

  const immune = {
    stressLevel: (latestEnergy?.bodyBatteryLevel ?? 78) > 70 ? t("metrics.low") : t("metrics.moderate"),
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 78,
  };

  return (
    <>
      <ThemedText type="title" style={{ color: colors.accentStrong }}>{t("immuneOverview.title")}</ThemedText>
      <ThemedText type="subtitle" style={{ color: colors.textTertiary }}>
        {t("immuneOverview.description")}
      </ThemedText>

      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title={t("immuneOverview.immuneStatus.title")} >
        <View style={globalStyles.row}>
          {/* Sleep */}
          <SleepMetric sleepData={sleepData} showDivider />

          {/* Stress/Body Battery */}
          <View
            style={[
              globalStyles.col,
              globalStyles.colWithDivider,
              { borderRightColor: colors.borderLight ?? colors.border },
            ]}
          >
            <ThemedText type="label">{t("immuneOverview.immuneStatus.stressLevel")}</ThemedText>
            <ThemedText type="title3">{immune.stressLevel}</ThemedText>
            <ThemedText type="caption">{t("immuneOverview.immuneStatus.bodyBattery")}: {immune.bodyBattery}%</ThemedText>
            {latestEnergy && <ThemedText type="caption">{latestEnergy.source}</ThemedText>}
          </View>

          {/* HRV */}
          <HRVMetric hrvData={hrvData} />
        </View>

        {/* Second row */}
        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          {/* Resting Heart Rate */}
          <RestingHRMetric hrvData={hrvData} showDivider />

          {/* Recovery Status */}
          <RecoveryStatusMetric
            hrvData={hrvData}
            sleepHours={sleepHours}
          />

           {/* Immune Recovery Status */}
          <View style={globalStyles.col}>
            <ThemedText type="label">{t("immuneOverview.immuneStatus.recoveryStatus")}</ThemedText>
            <ThemedText type="title3">{immune.bodyBattery > 70 ? t("metrics.good") : t("metrics.moderate")}</ThemedText>
            <ThemedText type="caption">{immune.bodyBattery > 70 ? t("metrics.readyForActivity") : t("metrics.needRecovery")}</ThemedText>
          </View>
        </View>
      </Card>

      {/* Information card */}
      <Card title={t("immuneOverview.whyTheseMetricsMatter.title")}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💤 {t("immuneOverview.whyTheseMetricsMatter.sleep.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.sleep.description")}
            Adequate sleep is crucial for immune function. During sleep, the body produces cytokines that help fight
            infection and inflammation.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">😌 {t("immuneOverview.whyTheseMetricsMatter.stress.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.stress.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">❤️ {t("immuneOverview.whyTheseMetricsMatter.hrv.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.hrv.description")}
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 {t("immuneOverview.whyTheseMetricsMatter.restingHeartRate.title")}</ThemedText>
          <ThemedText type="default">
            {t("immuneOverview.whyTheseMetricsMatter.restingHeartRate.description")}
          </ThemedText>
        </View>
      </Card>

      {/* DNA & Immunförsvar Genetics */}
      <GenesListCard areaId="immune"/>

      {/* Tips card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}
