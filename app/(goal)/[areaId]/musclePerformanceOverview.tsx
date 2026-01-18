import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function MusclePerformanceScreen({ mainGoalId }: { mainGoalId: string }) {
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
          <ActivityIndicator size="large" color="rgba(255,120,100,0.95)" />
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.bg}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  // Transform wearable data to performance metrics
  const latestSleep = sleepData[0];
  const latestHRV = hrvData[0];
  const latestActivity = activityData[0];
  const latestEnergy = energyData[0];

  const performance = {
    trainingReadiness: latestEnergy?.bodyBatteryLevel ?? 82,
    readinessStatus: (latestEnergy?.bodyBatteryLevel ?? 82) > 75 ? 'Optimal' : 'Moderate',
    recoveryTime: 12, // Would need workout tracking data
    trainingLoad: {
      current: latestActivity?.activeMinutes ? latestActivity.activeMinutes * 2 : 245,
      optimal: '220-280',
      status: 'Balanced',
    },
    anaerobicLoad: 68, // Would need intensity data
    strengthSessions: 4, // Would need workout tracking
    lastStrengthWorkout: '2h ago', // Would need workout tracking
    sleepQuality: latestSleep?.efficiencyPct ?? 88,
    sleepHours: latestSleep ? latestSleep.durationMinutes / 60 : 8.2,
    bodyBattery: latestEnergy?.bodyBatteryLevel ?? 78,
    hrv: latestHRV?.rmssdMs ?? 68,
    restingHR: latestHRV?.avgRestingHrBpm ?? 52,
    proteinWindow: 'Active (45min remaining)', // Would need workout tracking
  };

  return (
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Muscle Performance</Text>
        <Text style={styles.subtitle}>Strength training readiness and recovery metrics</Text>

        <WearableStatus status={status} />

        {/* Training Readiness Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Readiness</Text>

          <View style={styles.centerMetric}>
            <Text style={styles.bigValue}>{performance.trainingReadiness}</Text>
            <Text style={styles.bigLabel}>Readiness Score</Text>
            <Text style={styles.statusGood}>{performance.readinessStatus}</Text>
            {latestEnergy && <Text style={styles.source}>Source: {latestEnergy.source}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Recovery time</Text>
              <Text style={styles.value}>{performance.recoveryTime}h</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Last workout</Text>
              <Text style={styles.valueSmall}>{performance.lastStrengthWorkout}</Text>
            </View>
          </View>
        </View>

        {/* Training Load Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Training Load Management</Text>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>7-day load</Text>
              <Text style={styles.value}>{performance.trainingLoad.current}</Text>
              <Text style={styles.accent}>{performance.trainingLoad.status}</Text>
            </View>

            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Optimal range</Text>
              <Text style={styles.valueSmall}>{performance.trainingLoad.optimal}</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Anaerobic load</Text>
              <Text style={styles.value}>{performance.anaerobicLoad}</Text>
              <Text style={styles.muted}>High intensity</Text>
            </View>
          </View>

          {latestActivity && (
            <Text style={styles.source}>
              Source: {latestActivity.source} • {latestActivity.date}
            </Text>
          )}

          <View style={styles.loadBar}>
            <View style={[styles.loadFill, { width: `${(performance.trainingLoad.current / 350) * 100}%` }]} />
          </View>
          <Text style={styles.loadText}>Your training load is well-balanced. Continue with current intensity.</Text>
        </View>

        {/* Recovery Factors Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Recovery Factors</Text>

          <View style={styles.row}>
            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Sleep quality</Text>
              <Text style={styles.value}>{performance.sleepQuality}%</Text>
              <Text style={styles.accent}>{performance.sleepHours.toFixed(1)}h</Text>
              {latestSleep && <Text style={styles.source}>{latestSleep.source}</Text>}
            </View>

            <View style={[styles.col, styles.colWithDivider]}>
              <Text style={styles.label}>Body Battery</Text>
              <Text style={styles.value}>{performance.bodyBattery}%</Text>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>HRV</Text>
              <Text style={styles.value}>{performance.hrv}</Text>
              <Text style={styles.muted}>ms</Text>
              {latestHRV && <Text style={styles.source}>{latestHRV.source}</Text>}
            </View>
          </View>

          <Text style={styles.recoveryText}>
            🛌 Sleep and HRV are primary drivers of muscle recovery and protein synthesis. Deep sleep stages trigger
            growth hormone release for muscle repair.
          </Text>
        </View>

        {/* Protein Timing Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Anabolic Window</Text>

          <View style={styles.proteinSection}>
            <Text style={styles.proteinStatus}>⏰ {performance.proteinWindow}</Text>
            <Text style={styles.proteinText}>
              Post-workout protein intake is most effective within 2-3 hours after training. Muscle protein synthesis
              remains elevated for 24-48 hours after resistance training.
            </Text>
          </View>

          <View style={styles.proteinTips}>
            <Text style={styles.tipLabel}>Recommended:</Text>
            <Text style={styles.tipText}>• 20-40g protein within 2h post-workout</Text>
            <Text style={styles.tipText}>• 1.6-2.2g/kg body weight daily total</Text>
            <Text style={styles.tipText}>• Leucine-rich sources (whey, eggs, meat)</Text>
            <Text style={styles.tipText}>• Distribute protein across 3-5 meals</Text>
          </View>
        </View>

        {/* Information Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Understanding muscle performance</Text>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>💪 Training Readiness</Text>
            <Text style={styles.infoText}>
              Combines HRV, sleep quality, recovery time, and recent training load to predict your body's preparedness
              for high-intensity strength training. Scores above 75 indicate optimal conditions for progressive
              overload.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>📊 Training Load</Text>
            <Text style={styles.infoText}>
              Quantifies training stress from the past 7 days. Anaerobic load specifically measures high-intensity work
              (heavy lifting, HIIT). Maintaining load within your optimal range prevents overtraining while ensuring
              progression.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>⏱️ Recovery Time</Text>
            <Text style={styles.infoText}>
              Estimated hours until full muscular and CNS recovery. Heavy compound lifts (squats, deadlifts) require
              48-72h for complete recovery. Training the same muscle groups before recovery is complete impairs
              adaptation.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>🛌 Sleep & Muscle Growth</Text>
            <Text style={styles.infoText}>
              80% of growth hormone is released during deep sleep. Sleep deprivation reduces protein synthesis by ~20%
              and increases cortisol (catabolic). Aim for 7-9 hours with sleep quality above 80% for optimal
              hypertrophy.
            </Text>
          </View>
        </View>

        {/* Optimization Tips Card */}
        <TipsList areaId={mainGoalId} title="tips:muscle.levels.optimization.title" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: 'rgba(255,120,100,0.95)',
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
    borderColor: 'rgba(255,120,100,0.18)',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  centerMetric: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bigValue: {
    fontSize: 56,
    fontWeight: '800',
    color: 'rgba(255,120,100,0.95)',
  },
  bigLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    marginTop: 4,
  },
  statusGood: {
    color: 'rgba(100,255,150,0.9)',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  source: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
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
  valueSmall: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: 'rgba(255,120,100,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  loadBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    marginTop: 12,
    overflow: 'hidden',
  },
  loadFill: {
    height: '100%',
    backgroundColor: 'rgba(255,120,100,0.7)',
  },
  loadText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  recoveryText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  proteinSection: {
    marginBottom: 16,
  },
  proteinStatus: {
    color: 'rgba(255,200,100,0.95)',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  proteinText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  proteinTips: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tipLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
    color: 'rgba(255,100,100,0.9)',
    fontSize: 16,
  },
});
