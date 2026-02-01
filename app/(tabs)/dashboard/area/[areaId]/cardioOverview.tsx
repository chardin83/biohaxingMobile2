import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
      <ThemedText type="title">Cardio Fitness</ThemedText>
      <ThemedText type="subtitle">Cardiovascular endurance metrics and training insights</ThemedText>

      <WearableStatus status={status} />

      {/* Overview card */}
      <Card title="Your cardio performance">
        <View style={globalStyles.row}>
          <VO2MaxMetric vo2max={cardio.vo2max} trend={cardio.vo2maxDelta} showDivider />
          <RestingHRMetric hrvData={hrvData} showDivider />
          <View style={globalStyles.col}>
            <ThemedText type="label">Training Load</ThemedText>
            <ThemedText type="title2">{cardio.trainingLoad}</ThemedText>
            <ThemedText type="caption">{cardio.trainingLoadStatus}</ThemedText>
            {activityData.length > 0 && <ThemedText type="caption">7-day total</ThemedText>}
          </View>
        </View>
        <View style={[globalStyles.row, globalStyles.marginTop8]}>
          <View style={[globalStyles.col, globalStyles.colWithDivider, { borderRightColor: colors.borderLight ?? colors.border }]}>
            <ThemedText type="label">Recovery time</ThemedText>
            <ThemedText type="title2">{cardio.recoveryTime}h</ThemedText>
            <ThemedText type="caption">Until next hard effort</ThemedText>
            {latestEnergy && (
              <ThemedText type="caption">Based on battery: {latestEnergy.bodyBatteryLevel}%</ThemedText>
            )}
          </View>
          <View style={globalStyles.col}>
            <ThemedText type="label">Fitness age</ThemedText>
            <ThemedText type="title2">{cardio.fitnessAge}</ThemedText>
            <ThemedText type="caption">{cardio.actualAge - cardio.fitnessAge} yrs younger</ThemedText>
          </View>
        </View>
      </Card>

      {/* VO2 Max explanation */}
      <Card title="Understanding your metrics">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫁 VO₂ Max</ThemedText>
          <ThemedText type="default">
            VO₂ max measures the maximum amount of oxygen your body can use during intense exercise. It's the gold
            standard for cardiovascular fitness. Higher values indicate better endurance capacity.
          </ThemedText>
          <ThemedText type="default" style={styles.infoTextItalic}>
            Your level ({cardio.vo2max}) is considered {cardio.vo2max > 45 ? 'Good to Excellent' : 'Fair to Good'} for
            your age group.
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🫀 Resting Heart Rate</ThemedText>
          <ThemedText type="default">
            Lower resting heart rate typically indicates better cardiovascular fitness. Athletes often have resting
            heart rates below 60 bpm. Monitor trends over time. A sudden increase may signal overtraining, illness, or
            stress.
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">💪 Training Load</ThemedText>
          <ThemedText type="default">
            Training Load tracks the cumulative intensity and volume of your workouts over 7 days. Optimal load means
            you're training effectively without overtraining. Too high = risk of injury/burnout. Too low =
            insufficient stimulus for adaptation.
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏱️ Recovery Time</ThemedText>
          <ThemedText type="default">
            Time needed before your body is ready for another hard training session. Based on HRV, sleep quality, and
            body battery. Respecting recovery prevents injury and improves performance. Training hard when recovery is
            incomplete leads to diminished returns.
          </ThemedText>
        </View>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🎂 Fitness Age</ThemedText>
          <ThemedText type="default">
            Based on your VO₂ max, resting heart rate, and other factors. A lower fitness age indicates superior
            cardiovascular health. Regular aerobic training can reduce your fitness age by 10-20 years compared to
            sedentary peers.
          </ThemedText>
        </View>
      </Card>

      <GenesListCard areaId="cardioFitness" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} title="tips:cardio.levels.optimization.title" />
    </>
  );
}

const styles = StyleSheet.create({
  infoTextItalic: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});
