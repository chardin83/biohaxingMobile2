import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HRVMetric } from '@/components/metrics/HRVMetric';
import { RestingHRMetric } from '@/components/metrics/RestingHRMetric';
import { VO2MaxMetric } from '@/components/metrics/VO2MaxMetric';
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
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adapter]);

  if (loading) {
    return (
      <View style={styles.bg}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255,215,100,0.95)" />
          <Text style={styles.loadingText}>Loading energy data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.bg}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading data: {error}</Text>
        </View>
      </View>
    );
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
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Energy Systems</Text>
        <Text style={styles.subtitle}>Mitochondrial function and cellular energy production</Text>
        <WearableStatus status={status} />

        {/* Body Battery - Main Energy Indicator */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cellular Energy Reserves</Text>

          <View style={styles.centerMetric}>
            <Text style={styles.bigValue}>{energy.bodyBattery}</Text>
            <Text style={styles.bigLabel}>Body Battery</Text>
            <Text style={styles.statusGood}>{energy.bodyBatteryChange} since waking</Text>
          </View>

          <View style={styles.batteryBar}>
            <View style={[styles.batteryFill, { width: `${energy.bodyBattery}%` }]} />
          </View>

          <Text style={styles.batteryText}>
            Body Battery tracks your body's energy reserves by monitoring stress, activity, and recovery. It reflects
            your mitochondrial ATP production capacity.
          </Text>
        </View>

        {/* Energy Production Factors */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Energy Production Metrics</Text>

          <View style={styles.row}>
            <VO2MaxMetric vo2max={energy.vo2max} status={energy.vo2maxStatus} showDivider />

            <RestingHRMetric hrvData={hrvData} showDivider />

            <HRVMetric hrvData={hrvData} />
          </View>

          <Text style={styles.metricExplainer}>
            VO₂ max indicates mitochondrial density and oxidative capacity. Higher values = more efficient ATP
            production from oxygen.
          </Text>
        </View>

        {/* Energy Drain vs Recharge */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Energy Balance</Text>

          <View style={styles.balanceSection}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>⚡ Energy Drain</Text>
              <View style={styles.drainCard}>
                <Text style={styles.drainValue}>{energy.stressScore}</Text>
                <Text style={styles.drainLabel}>Stress score</Text>
                <Text style={styles.drainText}>{energy.stressLevel}</Text>
              </View>
              <View style={[styles.drainCard, { marginTop: 8 }]}>
                <Text style={styles.drainValue}>{energy.intensityMinutes}</Text>
                <Text style={styles.drainLabel}>Intensity minutes</Text>
              </View>
            </View>

            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>🔋 Energy Recharge</Text>
              <View style={styles.rechargeCard}>
                <Text style={styles.rechargeValue}>{energy.sleepHours}h</Text>
                <Text style={styles.rechargeLabel}>Sleep duration</Text>
                <Text style={styles.rechargeText}>{energy.sleepQuality}% quality</Text>
              </View>
              <View style={[styles.rechargeCard, { marginTop: 8 }]}>
                <Text style={styles.rechargeValue}>{energy.deepSleepMinutes}min</Text>
                <Text style={styles.rechargeLabel}>Deep sleep</Text>
              </View>
            </View>
          </View>

          <Text style={styles.balanceNote}>
            Deep sleep is when mitochondrial repair and autophagy (cellular cleanup) occur. Chronic stress increases
            cortisol, which impairs mitochondrial function.
          </Text>
        </View>

        {/* Mitochondrial Health Information */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding Mitochondria</Text>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🔬 The Powerhouses of Your Cells</Text>
            <Text style={styles.infoText}>
              Mitochondria are organelles that produce ATP (adenosine triphosphate), the energy currency of all cells.
              Each cell contains hundreds to thousands of mitochondria. They convert nutrients and oxygen into ~90% of
              your body's energy.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⚡ ATP Production</Text>
            <Text style={styles.infoText}>
              Through oxidative phosphorylation, mitochondria produce 30-32 ATP molecules per glucose molecule (vs only
              2 ATP from glycolysis). This process requires oxygen, which is why VO₂ max correlates with energy
              capacity.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🧬 Mitochondrial Biogenesis</Text>
            <Text style={styles.infoText}>
              Exercise (especially Zone 2 cardio) triggers PGC-1α activation, which increases mitochondrial density.
              More mitochondria = more energy production capacity. This is why trained athletes have higher VO₂ max.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🛡️ Oxidative Stress</Text>
            <Text style={styles.infoText}>
              Mitochondria produce reactive oxygen species (ROS) as byproducts of ATP production. Excessive ROS causes
              oxidative damage to mitochondrial DNA. Antioxidants (Vitamin C, E, CoQ10, glutathione) help neutralize ROS
              and protect mitochondrial function.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏰ NAD+ and Energy Decline</Text>
            <Text style={styles.infoText}>
              NAD+ (nicotinamide adenine dinucleotide) is essential for mitochondrial function. NAD+ levels decline ~50%
              between ages 20-80, reducing ATP production efficiency. NAD+ precursors (NR, NMN) and sirtuins activators
              may support mitochondrial health.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🔄 Mitophagy & Cellular Cleanup</Text>
            <Text style={styles.infoText}>
              Mitophagy is the selective autophagy of damaged mitochondria. Occurs during fasting and deep sleep.
              Regular mitophagy prevents accumulation of dysfunctional mitochondria that produce excess ROS and less
              ATP.
            </Text>
          </View>
        </View>

        {/* Tips Card */}
        <TipsList areaId={mainGoalId} title="tips:energy.levels.optimization.title" />

        {/* Activity Tracking */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Today's Activity</Text>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Active minutes</Text>
              <Text style={styles.value}>{energy.activityMinutes}</Text>
            </View>

            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Steps</Text>
              <Text style={styles.value}>{energy.steps.toLocaleString()}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Intensity min</Text>
              <Text style={styles.value}>{energy.intensityMinutes}</Text>
            </View>
          </View>

          <Text style={styles.activityNote}>
            Regular movement throughout the day maintains mitochondrial health. Even light activity (walking) stimulates
            ATP production and reduces oxidative stress.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: 'rgba(255,215,100,0.95)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,100,0.18)',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  centerMetric: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bigValue: {
    fontSize: 56,
    fontWeight: '800',
    color: 'rgba(255,215,100,0.95)',
  },
  bigLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    marginTop: 4,
  },
  statusGood: {
    color: 'rgba(100,255,150,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  batteryBar: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    backgroundColor: 'rgba(255,215,100,0.75)',
  },
  batteryText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colWithDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  value: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: 'rgba(255,215,100,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  metricExplainer: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  balanceSection: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  drainCard: {
    backgroundColor: 'rgba(255,100,100,0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.3)',
  },
  drainValue: {
    color: 'rgba(255,150,150,0.95)',
    fontSize: 24,
    fontWeight: '700',
  },
  drainLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  drainText: {
    color: 'rgba(255,150,150,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  rechargeCard: {
    backgroundColor: 'rgba(100,255,150,0.12)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100,255,150,0.3)',
  },
  rechargeValue: {
    color: 'rgba(100,255,150,0.95)',
    fontSize: 24,
    fontWeight: '700',
  },
  rechargeLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  rechargeText: {
    color: 'rgba(100,255,150,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  balanceNote: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  tipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  activityNote: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'rgba(255,0,0,0.85)',
    fontSize: 16,
    marginTop: 12,
  },
  dataSource: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
});
