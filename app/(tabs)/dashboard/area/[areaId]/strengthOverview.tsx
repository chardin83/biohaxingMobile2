import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { HRVMetric } from '@/components/metrics/HRVMetric';
import { SleepConsistencyMetric } from '@/components/metrics/SleepConsistencyMetric';
import { SleepMetric } from '@/components/metrics/SleepMetric';
import { Card } from '@/components/ui/Card';
import { Error } from '@/components/ui/Error';
import GenesListCard from '@/components/ui/GenesListCard';
import { Loading } from '@/components/ui/Loading';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';
import { DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange } from '@/wearables/types';
import { useWearable } from '@/wearables/wearableProvider';

export default function StrengthScreen({ mainGoalId }: { mainGoalId: string }) {
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Muscle Performance</Text>
        <Text style={styles.subtitle}>Strength training readiness and recovery metrics</Text>

        <WearableStatus status={status} />

        {/* Training Readiness Card */}
        {/* <Card title="Training Readiness">
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
        </Card>*/}

        {/* Training Load Card */}
        {/*<Card title="Training Load Management" style={{ marginTop: 16 }}>
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
        </Card> */}

        {/* Recovery Factors Card */}
        <Card title="Recovery Factors">
          <View style={styles.row}>
            <SleepMetric sleepData={sleepData} showDivider/>
            <SleepConsistencyMetric sleepData={{ ...sleepData[0], targetBedtime: '22:30' }} showDivider />
            <HRVMetric hrvData={hrvData} showDivider={false} />
          </View>
          <Text style={styles.recoveryText}>
            🛌 Sleep and HRV are primary drivers of muscle recovery and protein synthesis. Deep sleep stages trigger
            growth hormone release for muscle repair.
          </Text>
        </Card>

        {/* Protein Timing Card */}
        <Card title="Anabolic Window">
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
        </Card>

        {/* Information Card */}
        <Card title="Understanding muscle performance"  >
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
          </Card>

          {/* DNA & Gener som påverkar styrka */}
          <GenesListCard areaId="strength" />

        {/* Optimization Tips Card */}
        <TipsList areaId={mainGoalId} title="tips:muscle.levels.optimization.title" />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: Colors.dark.readinessRed, // Använd för rubrik
  },
  subtitle: {
    color: Colors.dark.textTertiary,
    fontSize: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  centerMetric: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bigValue: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.dark.readinessRed, // Använd för readiness score
  },
  bigLabel: {
    color: Colors.dark.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  statusGood: {
    color: Colors.dark.successColor,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  source: {
    color: Colors.dark.textWeak,
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
    borderRightColor: Colors.dark.textWeak,
  },
  label: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  value: {
    color: Colors.dark.textWhite,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  valueSmall: {
    color: Colors.dark.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  muted: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  accent: {
    color: Colors.dark.accentDefault,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  loadBar: {
    height: 12,
    backgroundColor: Colors.dark.overlayLight,
    borderRadius: 6,
    marginTop: 12,
    overflow: 'hidden',
  },
  loadFill: {
    height: '100%',
    backgroundColor: Colors.dark.accentMedium,
  },
  loadText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  recoveryText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.textWeak,
  },
  proteinSection: {
    marginBottom: 16,
  },
  proteinStatus: {
    color: Colors.dark.successColor,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  proteinText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  proteinTips: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.textWeak,
  },
  tipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  tipText: {
    color: Colors.dark.textTertiary,
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
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 16,
  },
});
