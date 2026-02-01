import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function EnergyScreen({ mainGoalId }: { mainGoalId: string }) {
  const { adapter, status } = useWearable();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<SleepSummary[]>([]);
  const [hrvData, setHrvData] = useState<HRVSummary[]>([]);
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [energyData, setEnergyData] = useState<EnergySignal[]>([]);



const { colors } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const range: TimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        };

        const [sleep, hrv, activity, energy] = await Promise.all([
          adapter.getSleep(range),
          adapter.getHRV(range),
          adapter.getDailyActivity(range),
          adapter.getEnergySignal(range),
        ]);

        setSleepData(sleep);
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

  // Transform wearable data to energy metrics
  const latestSleep = sleepData[0];
  const latestActivity = activityData[0];
  const latestEnergy = energyData[0];

  // Calculate metrics only for display in energy object
  const { hrv } = calculateHRVMetrics(hrvData);
  const { restingHR } = calculateRestingHRMetrics(hrvData);

  const energy = {
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 0,
    bodyBatteryChange: '+18',
    bodyBatteryStatus: (latestEnergy?.bodyBatteryLevel ?? 72) > 60 ? 'Good' : 'Low',
    stressScore: 32,
    stressLevel: 'Moderate',
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 7.5,
    sleepQuality: latestSleep?.efficiencyPct ?? 82,
    deepSleepMinutes: latestSleep?.stages?.deepMinutes ?? 98,
    vo2max: 46,
    vo2maxStatus: 'Good',
    restingHR: restingHR ?? 56,
    hrv: hrv ?? 64,
    activityMinutes: latestActivity?.activeMinutes ?? 128,
    steps: latestActivity?.steps ?? 8900,
    intensityMinutes: 45,
  };

  return (
    <>
      <ThemedText type="title" style={{ color: colors.gold }}>Energy Systems</ThemedText>
      <ThemedText type="subtitle">Mitochondrial function and cellular energy production</ThemedText>
      <WearableStatus status={status} />

      {/* Body Battery - Main Energy Indicator */}
      <Card title="Cellular Energy Reserves">
        <View style={styles.centerMetric}>
          <ThemedText type="title2">{energy.bodyBattery}</ThemedText>
          <ThemedText type="label">Body Battery</ThemedText>
          <ThemedText type="caption">{energy.bodyBatteryChange} since waking</ThemedText>
        </View>
        <View style={[styles.batteryBar, { backgroundColor: colors.overlayLight }]}>
          <View
            style={[
              styles.batteryFill,
              {
                width: `${energy.bodyBattery}%`,
                backgroundColor: colors.goldSoft,
              }
            ]}
          />
        </View>
        <ThemedText type="explainer" >
          Body Battery tracks your body's energy reserves by monitoring stress, activity, and recovery. It reflects
          your mitochondrial ATP production capacity.
        </ThemedText>
      </Card>

      {/* DNA & Mitochondria Genetics */}
      <GenesListCard areaId="energy" />

      {/* Energy Production Factors */}
      <Card title="Energy Production Metrics">
        <View style={globalStyles.row}>
          <VO2MaxMetric vo2max={energy.vo2max} status={energy.vo2maxStatus} showDivider />
          <RestingHRMetric hrvData={hrvData} showDivider />
          <HRVMetric hrvData={hrvData} />
        </View>
        <ThemedText type="explainer" style ={[globalStyles.explainer, { borderColor: colors.borderLight }]}>
          VO₂ max indicates mitochondrial density and oxidative capacity. Higher values = more efficient ATP
          production from oxygen.
        </ThemedText>
      </Card>

      {/* Energy Drain vs Recharge */}
      <Card title="Energy Balance">
        <View style={styles.balanceSection}>
          <View style={globalStyles.flex1}>
            <ThemedText type="title3">⚡ Energy Drain</ThemedText>
            <View
              style={[
                globalStyles.card,
                {
                  borderColor: colors.surfaceRedBorder,
                  backgroundColor: colors.surfaceRed,
                },
              ]}
            >
              <ThemedText type="value">{energy.stressScore}</ThemedText>
              <ThemedText type="label">Stress score</ThemedText>
              <ThemedText type="caption">{energy.stressLevel}</ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8,  {
                  borderColor: colors.surfaceRedBorder,
                  backgroundColor: colors.surfaceRed,
                },]}>
              <ThemedText type="value">{energy.intensityMinutes}</ThemedText>
              <ThemedText type="label">Intensity minutes</ThemedText>
            </View>
          </View>

          <View style={globalStyles.flex1}>
            <ThemedText type="title3">🔋 Energy Recharge</ThemedText>
            <View
              style={[
                globalStyles.card,
                {
                  borderColor: colors.surfaceGreenBorder,
                  backgroundColor: colors.surfaceGreen,
                },
              ]}
            >
              <ThemedText type="value">{energy.sleepHours}h</ThemedText>
              <ThemedText type="label">Sleep duration</ThemedText>
              <ThemedText type="caption">{energy.sleepQuality}% quality</ThemedText>
            </View>
            <View style={[globalStyles.card, globalStyles.marginTop8, {
                  borderColor: colors.surfaceGreenBorder,
                  backgroundColor: colors.surfaceGreen,
                },]}>
              <ThemedText type="value">{energy.deepSleepMinutes}min</ThemedText>
              <ThemedText type="label">Deep sleep</ThemedText>
            </View>
          </View>
        </View>

        <ThemedText
          type="explainer"
          style={[
            globalStyles.explainer,
            {  borderTopColor: colors.borderLight }
          ]}
        >
          Deep sleep is when mitochondrial repair and autophagy (cellular cleanup) occur. Chronic stress increases
          cortisol, which impairs mitochondrial function.
        </ThemedText>
      </Card>

      {/* Mitochondrial Health Information */}
      <Card title="Understanding Mitochondria">
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔬 The Powerhouses of Your Cells</ThemedText>
          <ThemedText type="default">
            Mitochondria are organelles that produce ATP (adenosine triphosphate), the energy currency of all cells.
            Each cell contains hundreds to thousands of mitochondria. They convert nutrients and oxygen into ~90% of
            your body's energy.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚡ ATP Production</ThemedText>
          <ThemedText type="default">
            Through oxidative phosphorylation, mitochondria produce 30-32 ATP molecules per glucose molecule (vs only
            2 ATP from glycolysis). This process requires oxygen, which is why VO₂ max correlates with energy
            capacity.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 Mitochondrial Biogenesis</ThemedText>
          <ThemedText type="default">
            Exercise (especially Zone 2 cardio) triggers PGC-1α activation, which increases mitochondrial density.
            More mitochondria = more energy production capacity. This is why trained athletes have higher VO₂ max.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛡️ Oxidative Stress</ThemedText>
          <ThemedText type="default">
            Mitochondria produce reactive oxygen species (ROS) as byproducts of ATP production. Excessive ROS causes
            oxidative damage to mitochondrial DNA. Antioxidants (Vitamin C, E, CoQ10, glutathione) help neutralize ROS
            and protect mitochondrial function.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ NAD+ and Energy Decline</ThemedText>
          <ThemedText type="default">
            NAD+ (nicotinamide adenine dinucleotide) is essential for mitochondrial function. NAD+ levels decline ~50%
            between ages 20-80, reducing ATP production efficiency. NAD+ precursors (NR, NMN) and sirtuins activators
            may support mitochondrial health.
          </ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔄 Mitophagy & Cellular Cleanup</ThemedText>
          <ThemedText type="default">
            Mitophagy is the selective autophagy of damaged mitochondria. Occurs during fasting and deep sleep.
            Regular mitophagy prevents accumulation of dysfunctional mitochondria that produce excess ROS and less
            ATP.
          </ThemedText>
        </View>
      </Card>

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} title="tips:energy.levels.optimization.title" />

      {/* Activity Tracking */}
      <Card title="Today's Activity">
        <View style={globalStyles.row}>
          <View style={[globalStyles.col, globalStyles.colWithDivider]}>
            <ThemedText type="label">Active minutes</ThemedText>
            <ThemedText type="value">{energy.activityMinutes}</ThemedText>
          </View>

          <View style={[globalStyles.col, globalStyles.colWithDivider]}>
            <ThemedText type="label">Steps</ThemedText>
            <ThemedText type="value">{energy.steps.toLocaleString()}</ThemedText>
          </View>

          <View style={globalStyles.col}>
            <ThemedText type="label">Intensity min</ThemedText>
            <ThemedText type="value">{energy.intensityMinutes}</ThemedText>
          </View>
        </View>

        <ThemedText
          type="explainer"
          style={[
            globalStyles.explainer,
            { borderTopColor: colors.borderLight }
          ]}
        >
          Regular movement throughout the day maintains mitochondrial health. Even light activity (walking) stimulates
          ATP production and reduces oxidative stress.
        </ThemedText>
      </Card>
   </>
  );
}

const styles = StyleSheet.create({
  centerMetric: {
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryBar: {
    height: 16,
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
  },
  balanceSection: {
    flexDirection: 'row',
    gap: 12,
  },
});
