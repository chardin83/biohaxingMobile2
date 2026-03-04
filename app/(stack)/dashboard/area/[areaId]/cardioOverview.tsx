import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, HRVSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function CardioScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [hrv, activity, energy] = await Promise.all([
          adapter.getHRV(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setHrvData(hrv);
        setActivityData(activity);
        setEnergyData(energy);
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
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  // Transform wearable data to cardio metrics
  const latestEnergy = energyData[0];

  // Calculate weekly training load from activity data
  const weeklyActiveMinutes = activityData.reduce((sum, day) => sum + (day.activeMinutes || 0), 0);
  const trainingLoad = weeklyActiveMinutes * 2; // Simple calculation

  let trainingLoadStatus: string;
  if (trainingLoad > 400) {
    trainingLoadStatus = 'High';
  } else if (trainingLoad > 200) {
    trainingLoadStatus = 'Optimal';
  } else {
    trainingLoadStatus = 'Low';
  }

  const cardio = {
    vo2max: 48, // Would need fitness data from wearable
    vo2maxDelta: 3,
    trainingLoad: trainingLoad || 285,
    trainingLoadStatus,
    recoveryTime: (latestEnergy?.bodyBatteryLevel ?? 0) > 80 ? 12 : 18,
    fitnessAge: 32, // Would be calculated from VO2max and other factors
    actualAge: 38,
  };

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.cardio }}>{t("cardioOverview.title")}</ThemedText>
      <ThemedText type="subtitle">{t("cardioOverview.description")}</ThemedText>
      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title={t("cardioOverview.yourCardioPerformance")}>
        <View style={globalStyles.row}>
          <VO2MaxMetric vo2max={cardio.vo2max} trend={cardio.vo2maxDelta} showDivider />
          <RestingHRMetric hrvData={hrvData} showDivider />
          <View style={globalStyles.col}>
            <ThemedText type="label">{t("cardioOverview.trainingLoad")}</ThemedText>
            <ThemedText type="title2">{cardio.trainingLoad}</ThemedText>
            <ThemedText type="caption">{cardio.trainingLoadStatus}</ThemedText>
            {activityData.length > 0 && <ThemedText type="caption">{t("cardioOverview.sevenDayTotal")}</ThemedText>}
          </View>
        </View>
        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          <View style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}>
            <ThemedText type="label">{t("cardioOverview.recoveryTime")}</ThemedText>
            <ThemedText type="title2">{cardio.recoveryTime}h</ThemedText>
            <ThemedText type="caption">{t("cardioOverview.untilNextHardEffort")}</ThemedText>
          </View>
          <View style={globalStyles.col}>
            <ThemedText type="label">{t("cardioOverview.fitnessAge")}</ThemedText>
            <ThemedText type="title2">{cardio.fitnessAge}</ThemedText>
            <ThemedText type="caption">{cardio.actualAge - cardio.fitnessAge} {t("cardioOverview.yearsYounger")}</ThemedText>
          </View>
        </View>
      </Card>

      {/* VO2 Max explanation */}
      <Card title={t("cardioOverview.understandingYourMetrics.title")}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫁 {t("cardioOverview.understandingYourMetrics.vo2Max.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.vo2Max.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 {t("cardioOverview.understandingYourMetrics.restingHeartRate.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.restingHeartRate.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💪 {t("cardioOverview.understandingYourMetrics.trainingLoad.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.trainingLoad.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏱️ {t("cardioOverview.understandingYourMetrics.recoveryTime.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.recoveryTime.description")}
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🎂 {t("cardioOverview.understandingYourMetrics.fitnessAge.title")}</ThemedText>
          <ThemedText type="default">
            {t("cardioOverview.understandingYourMetrics.fitnessAge.description")}
          </ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="cardioFitness" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId}/>
    </>
  );
}
